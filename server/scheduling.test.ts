import { describe, expect, it } from "vitest";
import { overlaps, shiftFlexibleBlocks, toMinutes } from "../shared/scheduling";

describe("DayFlow scheduling", () => {
  it("converts clock values into minutes", () => {
    expect(toMinutes("14:30")).toBe(870);
  });

  it("detects overlap while allowing touching edges", () => {
    const block = { id: "focus", start: "13:00", end: "14:00", kind: "flex" as const };
    expect(overlaps(block, "14:00", "16:00")).toBe(false);
    expect(overlaps(block, "13:30", "16:00")).toBe(true);
  });

  it("preserves fixed commitments and shifts overlapping flexible blocks", () => {
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

  it("places multiple displaced blocks sequentially around another fixed block", () => {
    const blocks = [
      { id: "flex-1", start: "14:10", end: "14:40", kind: "flex" as const },
      { id: "flex-2", start: "14:45", end: "15:30", kind: "goal" as const },
      { id: "fixed-later", start: "17:00", end: "18:00", kind: "fixed" as const },
    ];
    const revised = shiftFlexibleBlocks(blocks, "14:00", "16:00");
    expect(revised[0]).toMatchObject({ start: "16:15", end: "16:45" });
    expect(revised[1]).toMatchObject({ start: "18:00", end: "18:45" });
    expect(revised[2]).toEqual(blocks[2]);
  });
});
