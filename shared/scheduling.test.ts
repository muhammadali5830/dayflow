import { describe, expect, it } from "vitest";
import { overlaps, shiftFlexibleBlocks, toMinutes } from "./scheduling";

describe("DayFlow scheduling", () => {
  it("converts clock values into minutes", () => {
    expect(toMinutes("14:30")).toBe(870);
  });

  it("detects an event overlap without treating touching edges as overlap", () => {
    const block = { id: "focus", start: "13:00", end: "14:00", kind: "flex" as const };
    expect(overlaps(block, "14:00", "16:00")).toBe(false);
    expect(overlaps(block, "13:30", "16:00")).toBe(true);
  });

  it("preserves fixed commitments and moves only overlapping flexible blocks", () => {
    const blocks = [
      { id: "fixed", start: "13:00", end: "14:00", kind: "fixed" as const },
      { id: "flex", start: "14:30", end: "15:15", kind: "flex" as const },
      { id: "goal", start: "18:00", end: "18:30", kind: "goal" as const },
    ];
    const revised = shiftFlexibleBlocks(blocks, "14:00", "16:00");
    expect(revised[0]).toEqual(blocks[0]);
    expect(revised[1]).toMatchObject({ start: "16:15", end: "17:00" });
    expect(revised[2]).toEqual(blocks[2]);
  });
});
