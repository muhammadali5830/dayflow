import { describe, expect, it } from "vitest";
import { generateRoutine } from "../shared/routineGenerator";

describe("DayFlow routine generation", () => {
  it("uses submitted wake, exercise, sleep, and goal preferences", () => {
    const blocks = generateRoutine({
      wake: "06:30",
      sleep: "22:30",
      anchor: "09:00 – 17:30",
      exercise: "18:00 – 18:45",
      meals: "Breakfast 07:15",
      goals: "Write 500 words, read",
      constraints: "Quiet morning",
    });
    expect(blocks.find((block) => block.id === "wake")?.start).toBe("06:30");
    expect(blocks.find((block) => block.id === "exercise")?.start).toBe("18:00");
    expect(blocks.find((block) => block.id === "winddown")?.end).toBe("22:30");
    expect(blocks.find((block) => block.id === "personal")?.subtitle).toContain("Write 500 words");
  });
});
