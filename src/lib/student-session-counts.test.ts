import { describe, expect, it } from "vitest";
import { countSessionsPerStudent } from "./student-session-counts";

describe("countSessionsPerStudent", () => {
  it("compte les feuilles par élève", () => {
    const sessions = [
      {
        id: "s1",
        studentIds: ["a", "b"],
      },
      {
        id: "s2",
        studentIds: ["a"],
      },
    ] as const;
    const m = countSessionsPerStudent(sessions as never);
    expect(m.get("a")).toBe(2);
    expect(m.get("b")).toBe(1);
    expect(m.get("x")).toBeUndefined();
  });
});
