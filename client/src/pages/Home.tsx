import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Coffee,
  Dumbbell,
  Flag,
  Flame,
  GraduationCap,
  LayoutDashboard,
  Moon,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
  SunMedium,
  Target,
  Utensils,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { minutesToTime, shiftFlexibleBlocks, toMinutes } from "@shared/scheduling";
import { generateRoutine } from "@shared/routineGenerator";
import { trpc } from "@/lib/trpc";

type Block = {
  id: string;
  title: string;
  subtitle: string;
  start: string;
  end: string;
  kind: "fixed" | "flex" | "rest" | "meal" | "goal";
  icon: "sun" | "coffee" | "work" | "meal" | "dumbbell" | "target" | "moon" | "spark";
  color: string;
};

type Preferences = {
  wake: string;
  sleep: string;
  anchor: string;
  exercise: string;
  meals: string;
  goals: string;
  constraints: string;
};

const defaultPreferences: Preferences = {
  wake: "07:00",
  sleep: "23:00",
  anchor: "08:30 – 17:30",
  exercise: "17:30 – 18:15",
  meals: "Breakfast 07:45 · Lunch 12:30 · Dinner 19:00",
  goals: "Read 20 pages, practice Spanish, plan tomorrow",
  constraints: "Keep mornings calm and leave 30 minutes of buffer before sleep",
};

const initialBlocks: Block[] = [
  { id: "wake", title: "Wake up", subtitle: "Start gently · hydrate + light", start: "07:00", end: "07:15", kind: "fixed", icon: "sun", color: "amber" },
  { id: "morning", title: "Morning reset", subtitle: "Stretch, shower, get ready", start: "07:15", end: "07:45", kind: "flex", icon: "spark", color: "lavender" },
  { id: "breakfast", title: "Breakfast", subtitle: "Protein + something nourishing", start: "07:45", end: "08:15", kind: "meal", icon: "coffee", color: "peach" },
  { id: "focus", title: "Deep work", subtitle: "Priority 01 · no notifications", start: "08:30", end: "10:30", kind: "fixed", icon: "work", color: "blue" },
  { id: "break", title: "Reset break", subtitle: "Walk away from the screen", start: "10:30", end: "10:45", kind: "rest", icon: "spark", color: "mint" },
  { id: "work2", title: "Work / study", subtitle: "Keep the momentum going", start: "10:45", end: "12:30", kind: "fixed", icon: "work", color: "blue" },
  { id: "lunch", title: "Lunch", subtitle: "Eat away from your desk", start: "12:30", end: "13:15", kind: "meal", icon: "meal", color: "peach" },
  { id: "admin", title: "Admin + messages", subtitle: "Clear the small things", start: "13:15", end: "14:00", kind: "flex", icon: "spark", color: "lavender" },
  { id: "project", title: "Project block", subtitle: "Priority 02 · creative focus", start: "14:00", end: "16:30", kind: "fixed", icon: "target", color: "blue" },
  { id: "exercise", title: "Move your body", subtitle: "Strength + mobility", start: "17:30", end: "18:15", kind: "fixed", icon: "dumbbell", color: "mint" },
  { id: "dinner", title: "Dinner", subtitle: "Slow down and refuel", start: "19:00", end: "19:45", kind: "meal", icon: "meal", color: "peach" },
  { id: "personal", title: "Personal development", subtitle: "20 pages · Spanish practice", start: "20:00", end: "21:00", kind: "goal", icon: "target", color: "lavender" },
  { id: "free", title: "Free time", subtitle: "Unstructured is still productive", start: "21:00", end: "22:15", kind: "rest", icon: "spark", color: "cream" },
  { id: "winddown", title: "Prepare for sleep", subtitle: "Screens off · tomorrow preview", start: "22:15", end: "23:00", kind: "rest", icon: "moon", color: "indigo" },
];

function iconFor(icon: Block["icon"]) {
  const props = { size: 17, strokeWidth: 1.8 };
  if (icon === "sun") return <SunMedium {...props} />;
  if (icon === "coffee") return <Coffee {...props} />;
  if (icon === "work") return <GraduationCap {...props} />;
  if (icon === "meal") return <Utensils {...props} />;
  if (icon === "dumbbell") return <Dumbbell {...props} />;
  if (icon === "target") return <Target {...props} />;
  if (icon === "moon") return <Moon {...props} />;
  return <Sparkles {...props} />;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(date);
}

export default function Home() {
  const [preferences, setPreferences] = useState<Preferences>(() => {
    try { return JSON.parse(localStorage.getItem("dayflow-preferences") || "null") || defaultPreferences; } catch { return defaultPreferences; }
  });
  const [blocks, setBlocks] = useState<Block[]>(() => {
    try { return JSON.parse(localStorage.getItem("dayflow-blocks") || "null") || initialBlocks; } catch { return initialBlocks; }
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventStart, setEventStart] = useState("14:00");
  const [eventEnd, setEventEnd] = useState("16:00");
  const [isReplanning, setIsReplanning] = useState(false);
  const [savedPulse, setSavedPulse] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("Just now");
  const [activeNav, setActiveNav] = useState("Today");
  const today = useMemo(() => new Date(), []);
  const { isAuthenticated } = useAuth();
  const hasLoadedServerPlan = useRef(false);
  const savedPlan = trpc.routine.get.useQuery({ planDate: today.toISOString().slice(0, 10) }, { enabled: isAuthenticated });
  const saveRoutine = trpc.routine.save.useMutation({ onError: () => toast.error("We could not sync your routine, but it is still saved on this device") });

  useEffect(() => { localStorage.setItem("dayflow-preferences", JSON.stringify(preferences)); }, [preferences]);
  useEffect(() => { localStorage.setItem("dayflow-blocks", JSON.stringify(blocks)); }, [blocks]);
  useEffect(() => {
    if (!savedPlan.data || hasLoadedServerPlan.current) return;
    hasLoadedServerPlan.current = true;
    setPreferences(savedPlan.data.preferences as Preferences);
    setBlocks(savedPlan.data.blocks as Block[]);
    setLastUpdated("Synced from your account");
  }, [savedPlan.data]);
  const fixedCount = blocks.filter((block) => block.kind === "fixed").length;
  const flexCount = blocks.filter((block) => block.kind === "flex" || block.kind === "goal").length;

  const savePreferences = () => {
    if (toMinutes(preferences.sleep) <= toMinutes(preferences.wake)) { toast.error("Sleep time must be later than wake time"); return; }
    const generated = generateRoutine(preferences) as Block[];
    setBlocks(generated);
    setShowOnboarding(false);
    setSavedPulse(true);
    setTimeout(() => setSavedPulse(false), 700);
    setLastUpdated("Saved just now");
    if (isAuthenticated) saveRoutine.mutate({ planDate: today.toISOString().slice(0, 10), preferences, blocks: generated });
    toast.success("Your rhythm is saved and the routine is updated");
  };

  const addEventAndReplan = () => {
    if (!eventTitle.trim()) { toast.error("Give the event a name first"); return; }
    const start = toMinutes(eventStart);
    const rawEnd = toMinutes(eventEnd);
    if (rawEnd <= start) { toast.error("The end time must be after the start time"); return; }
    const end = rawEnd;
    setIsReplanning(true);
    setTimeout(() => {
      const newEvent: Block = { id: `event-${Date.now()}`, title: eventTitle.trim(), subtitle: "Added today · fixed commitment", start: eventStart, end: eventEnd, kind: "fixed", icon: "work", color: "rose" };
      const revised = shiftFlexibleBlocks(blocks, eventStart, eventEnd).map((block) => block.id === "admin" || block.id === "morning" ? { ...block, subtitle: `${block.subtitle} · moved around your event` } : block);
      setBlocks([...revised.filter((block) => toMinutes(block.start) < start), newEvent, ...revised.filter((block) => toMinutes(block.start) >= start)].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)));
      setIsReplanning(false);
      setShowQuickAdd(false);
      setEventTitle("");
      setLastUpdated("Updated just now");
      if (isAuthenticated) saveRoutine.mutate({ planDate: today.toISOString().slice(0, 10), preferences, blocks: [...revised, newEvent] });
      toast.success("Your day was replanned around the new event");
    }, 850);
  };

  return (
    <div className="dayflow-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark"><Sparkles size={17} /></span><span>dayflow</span></div>
        <div className="sidebar-caption">YOUR SPACE</div>
        <nav className="nav-list">
          {[[LayoutDashboard, "Today"], [CalendarDays, "Calendar"], [Target, "Goals"]].map(([Icon, label]) => (
            <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label as string} onClick={() => setActiveNav(label as string)}><Icon size={18} /> <span>{label as string}</span>{label === "Today" && <span className="nav-dot" />}</button>
          ))}
        </nav>
        <div className="sidebar-caption settings-caption">SETTINGS</div>
        <button className="nav-item" onClick={() => setShowOnboarding(true)}><Zap size={18} /> <span>Preferences</span></button>
        <div className="sidebar-bottom">
          <div className="focus-card"><div className="focus-card-icon"><Flame size={17} /></div><div><strong>Focus mode</strong><span>Build your best rhythm</span></div><ChevronDown size={15} /></div>
          <div className="user-row"><div className="avatar">AM</div><div><strong>Alex Morgan</strong><span>Personal plan</span></div><MoreHorizontal size={18} /></div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar"><div className="breadcrumb"><span>DayFlow</span><span className="slash">/</span><strong>{activeNav}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Notifications"><Bell size={18} /><span className="notification-dot" /></button><button className="date-pill"><CalendarDays size={16} /> {formatDate(today)} <ChevronDown size={15} /></button></div></header>

        <section className="page-intro"><div><p className="eyebrow">{formatDate(today).toUpperCase()}</p><h1>Good morning, Alex <span className="wave">✦</span></h1><p className="intro-copy">A thoughtful plan for a clear, meaningful day.</p></div><div className="intro-actions"><span className="saved-status"><span className={`status-dot ${savedPulse ? "pulse" : ""}`} /> {isAuthenticated && savedPlan.isLoading ? "Syncing your plan…" : isAuthenticated && savedPlan.isError ? "Offline · saved locally" : lastUpdated}</span><Button variant="outline" className="preferences-button" onClick={() => setShowOnboarding(true)}><Zap size={16} /> Edit preferences</Button></div></section>

        <section className="summary-grid"><div className="summary-card highlight"><div className="summary-label"><span className="summary-icon"><Clock3 size={16} /></span>DAY AT A GLANCE</div><div className="summary-value">{Math.max(0, Math.round((toMinutes(preferences.sleep) - toMinutes(preferences.wake)) / 60))}<span> hrs awake</span></div><div className="summary-note"><span className="mini-line" /> {fixedCount} fixed blocks · {flexCount} flexible</div></div><div className="summary-card"><div className="summary-label"><span className="summary-icon green"><Check size={16} /></span>DAILY INTENT</div><div className="intent-text">Make space for <strong>deep work</strong><br />and a slower evening.</div><div className="progress-row"><span>Balance score</span><strong>86%</strong></div><div className="progress"><span /></div></div><div className="summary-card summary-action" onClick={() => setShowQuickAdd(true)}><div className="summary-label"><span className="summary-icon violet"><Plus size={16} /></span>PLANS CHANGED?</div><div className="action-title">Add an event<br /><span>and let DayFlow adapt</span></div><ArrowRight size={20} /></div></section>

        <section className="planner-layout"><div className="timeline-panel"><div className="panel-heading"><div><h2>Your routine</h2><p>Designed around your energy, not just your calendar.</p></div><div className="heading-actions"><button className="text-button" onClick={() => setShowQuickAdd(true)}><Plus size={15} /> Quick add</button><button className="more-button"><MoreHorizontal size={19} /></button></div></div><div className="timeline"><div className="current-time-line"><span>NOW</span><i /></div>{blocks.map((block) => <div className={`timeline-row ${block.kind}`} key={block.id}><div className="time-col"><strong>{block.start}</strong><span>{block.end}</span></div><div className={`timeline-marker ${block.color}`}><span>{iconFor(block.icon)}</span></div><div className={`block-card ${block.color}`}><div><div className="block-title">{block.title}{block.kind === "fixed" && <span className="fixed-tag">FIXED</span>}</div><div className="block-subtitle">{block.subtitle}</div></div><div className="block-duration">{Math.max(15, toMinutes(block.end) - toMinutes(block.start))} min</div></div></div>)}</div></div>
          <aside className="insight-panel"><div className="insight-orb"><Sparkles size={23} /></div><p className="eyebrow">DAYFLOW NOTE</p><h3>Protect your first<br /><em>clear hour.</em></h3><p className="insight-copy">Your best focus window starts early. Keep this block notification-free and everything else gets easier.</p><div className="insight-divider" /><div className="insight-meta"><span><SunMedium size={15} /> Energy peak</span><strong>08:30 – 10:30</strong></div><div className="insight-meta"><span><Moon size={15} /> Wind-down</span><strong>22:15 onwards</strong></div><button className="replan-button" onClick={() => { setIsReplanning(true); setTimeout(() => { setIsReplanning(false); toast.success("Routine refreshed around your preferences"); }, 700); }}>{isReplanning ? <RefreshCw className="spin" size={16} /> : <RefreshCw size={16} />} Refresh my day</button></aside></section>
        <footer className="page-footer"><span><span className="footer-dot" /> Your routine adapts as life happens.</span><span>DayFlow learns your rhythm over time.</span></footer>
      </main>

      {showOnboarding && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowOnboarding(false)}><div className="modal-card"><button className="modal-close" onClick={() => setShowOnboarding(false)}><X size={18} /></button><div className="modal-kicker"><Sparkles size={15} /> YOUR RHYTHM</div><h2>Shape your ideal day.</h2><p className="modal-description">Tell us what your day needs to make room for. DayFlow will use this as your planning compass.</p><div className="form-grid"><label>Wake up<input type="time" value={preferences.wake} onChange={(e) => setPreferences({ ...preferences, wake: e.target.value })} /></label><label>Wind down<input type="time" value={preferences.sleep} onChange={(e) => setPreferences({ ...preferences, sleep: e.target.value })} /></label></div><label>Work / study commitment<input value={preferences.anchor} onChange={(e) => setPreferences({ ...preferences, anchor: e.target.value })} placeholder="08:30 – 17:30" /></label><label>Exercise window<input value={preferences.exercise} onChange={(e) => setPreferences({ ...preferences, exercise: e.target.value })} placeholder="17:30 – 18:15" /></label><label>Meals and anchors<input value={preferences.meals} onChange={(e) => setPreferences({ ...preferences, meals: e.target.value })} /></label><label>Daily goals<textarea value={preferences.goals} onChange={(e) => setPreferences({ ...preferences, goals: e.target.value })} rows={2} /></label><label>Planning preferences<textarea value={preferences.constraints} onChange={(e) => setPreferences({ ...preferences, constraints: e.target.value })} rows={2} /></label><Button className="modal-save" onClick={savePreferences}>Save my rhythm <ArrowRight size={16} /></Button></div></div>}
      {showQuickAdd && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setShowQuickAdd(false)}><div className="modal-card quick-modal"><button className="modal-close" onClick={() => setShowQuickAdd(false)}><X size={18} /></button><div className="modal-kicker"><RefreshCw size={15} /> LIVE REPLANNING</div><h2>What changed?</h2><p className="modal-description">Add the new fixed commitment. Flexible blocks will move around it automatically.</p><label>Event name<input autoFocus value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="Team meeting" /></label><div className="form-grid"><label>Starts<input type="time" value={eventStart} onChange={(e) => setEventStart(e.target.value)} /></label><label>Ends<input type="time" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} /></label></div><div className="replan-preview"><div className="preview-icon"><RefreshCw size={17} /></div><div><strong>DayFlow will protect your fixed blocks</strong><span>and shift flexible activities to the next available window.</span></div></div><Button className="modal-save" onClick={addEventAndReplan} disabled={isReplanning}>{isReplanning ? <><RefreshCw className="spin" size={16} /> Rebuilding your day…</> : <>Replan my day <ArrowRight size={16} /></>}</Button></div></div>}
    </div>
  );
}
