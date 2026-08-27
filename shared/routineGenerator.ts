import { minutesToTime, toMinutes } from "./scheduling";

export type RoutinePreferences = { wake: string; sleep: string; anchor: string; exercise: string; meals: string; goals: string; constraints: string };
export type GeneratedBlock = { id: string; title: string; subtitle: string; start: string; end: string; kind: "fixed" | "flex" | "rest" | "meal" | "goal"; icon: string; color: string };

function rangeStart(range: string, fallback: string) {
  const match = range.match(/(\d{1,2}:\d{2})/);
  return match?.[1] || fallback;
}

function namedTime(value: string, name: string, fallback: string) {
  const match = value.match(new RegExp(`${name}[^0-9]*(\\d{1,2}:\\d{2})`, "i"));
  return match?.[1] || fallback;
}

export function generateRoutine(preferences: RoutinePreferences): GeneratedBlock[] {
  const wake = toMinutes(preferences.wake || "07:00");
  const sleep = toMinutes(preferences.sleep || "23:00");
  const workStart = toMinutes(rangeStart(preferences.anchor, "08:30"));
  const exerciseStart = toMinutes(rangeStart(preferences.exercise, "17:30"));
  const breakfast = toMinutes(namedTime(preferences.meals, "breakfast", minutesToTime(wake + 45)));
  const dinner = namedTime(preferences.meals, "dinner", "19:00");
  const buffer = /30\s*minutes?|buffer|slow evening/i.test(preferences.constraints) ? 60 : 45;
  const focusStart = Math.max(breakfast + 30, workStart);
  const blocks: GeneratedBlock[] = [
    { id: "wake", title: "Wake up", subtitle: "Start gently · hydrate + light", start: minutesToTime(wake), end: minutesToTime(wake + 15), kind: "fixed", icon: "sun", color: "amber" },
    { id: "morning", title: "Morning reset", subtitle: "Stretch, shower, get ready", start: minutesToTime(wake + 15), end: minutesToTime(breakfast), kind: "flex", icon: "spark", color: "lavender" },
    { id: "breakfast", title: "Breakfast", subtitle: "Protein + something nourishing", start: minutesToTime(breakfast), end: minutesToTime(breakfast + 30), kind: "meal", icon: "coffee", color: "peach" },
    { id: "focus", title: "Deep work", subtitle: preferences.goals ? `Priority 01 · ${preferences.goals.split(",")[0].trim()}` : "Priority 01 · no notifications", start: minutesToTime(focusStart), end: minutesToTime(focusStart + 120), kind: "fixed", icon: "work", color: "blue" },
    { id: "break", title: "Reset break", subtitle: "Walk away from the screen", start: minutesToTime(focusStart + 120), end: minutesToTime(focusStart + 135), kind: "rest", icon: "spark", color: "mint" },
    { id: "work2", title: "Work / study", subtitle: "Keep the momentum going", start: minutesToTime(focusStart + 135), end: minutesToTime(12 * 60 + 30), kind: "fixed", icon: "work", color: "blue" },
    { id: "lunch", title: "Lunch", subtitle: "Eat away from your desk", start: namedTime(preferences.meals, "lunch", "12:30"), end: minutesToTime(toMinutes(namedTime(preferences.meals, "lunch", "12:30")) + 45), kind: "meal", icon: "meal", color: "peach" },
    { id: "admin", title: "Admin + messages", subtitle: "Clear the small things", start: "13:15", end: "14:00", kind: "flex", icon: "spark", color: "lavender" },
    { id: "project", title: "Project block", subtitle: "Priority 02 · creative focus", start: "14:00", end: "16:30", kind: "fixed", icon: "target", color: "blue" },
    { id: "exercise", title: "Move your body", subtitle: "Strength + mobility", start: minutesToTime(exerciseStart), end: minutesToTime(exerciseStart + 45), kind: "fixed", icon: "dumbbell", color: "mint" },
    { id: "dinner", title: "Dinner", subtitle: "Slow down and refuel", start: dinner, end: minutesToTime(toMinutes(dinner) + 45), kind: "meal", icon: "meal", color: "peach" },
    { id: "personal", title: "Personal development", subtitle: preferences.goals || "20 pages · personal growth", start: "20:00", end: "21:00", kind: "goal", icon: "target", color: "lavender" },
    { id: "free", title: "Free time", subtitle: "Unstructured is still productive", start: "21:00", end: minutesToTime(Math.max(21 * 60 + 15, sleep - buffer)), kind: "rest", icon: "spark", color: "cream" },
    { id: "winddown", title: "Prepare for sleep", subtitle: "Screens off · tomorrow preview", start: minutesToTime(Math.max(21 * 60 + 15, sleep - buffer)), end: minutesToTime(sleep), kind: "rest", icon: "moon", color: "indigo" },
  ];
  return blocks.filter((block) => toMinutes(block.start) < toMinutes(block.end));
}
