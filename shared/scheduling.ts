export type SchedulableBlock = {
  id: string;
  start: string;
  end: string;
  kind: "fixed" | "flex" | "rest" | "meal" | "goal";
};

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}`;
}

export function overlaps(block: SchedulableBlock, start: string, end: string) {
  return toMinutes(block.start) < toMinutes(end) && toMinutes(block.end) > toMinutes(start);
}

export function shiftFlexibleBlocks<T extends SchedulableBlock>(blocks: T[], eventStart: string, eventEnd: string) {
  const eventStartMinutes = toMinutes(eventStart);
  const eventEndMinutes = toMinutes(eventEnd);
  const movingIds = new Set(blocks.filter((block) => (block.kind === "flex" || block.kind === "goal") && overlaps(block, eventStart, eventEnd)).map((block) => block.id));
  const occupied = blocks.filter((block) => !movingIds.has(block.id)).map((block) => ({ start: toMinutes(block.start), end: toMinutes(block.end) }));
  occupied.push({ start: eventStartMinutes, end: eventEndMinutes });
  let cursor = eventEndMinutes + 15;

  return [...blocks].sort((a, b) => toMinutes(a.start) - toMinutes(b.start)).map((block) => {
    if (!movingIds.has(block.id)) return block;
    const duration = toMinutes(block.end) - toMinutes(block.start);
    while (occupied.some((slot) => cursor < slot.end && cursor + duration > slot.start)) cursor += 15;
    const shifted = { ...block, start: minutesToTime(cursor), end: minutesToTime(cursor + duration) };
    occupied.push({ start: cursor, end: cursor + duration });
    cursor += duration + 15;
    return shifted;
  });
}
