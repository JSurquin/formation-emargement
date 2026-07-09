import { describe, expect, it } from "vitest";
import { buildMonthGrid, countSessionsInMonth } from "@/lib/global-calendar";
import { buildAttendanceForStudents } from "@/lib/types";

describe("global-calendar", () => {
  it("place les sessions sur le bon jour du mois", () => {
    const grid = buildMonthGrid(
      [
        {
          id: "s1",
          title: "Word",
          date: "2026-03-10",
          studentIds: ["a"],
          attendance: buildAttendanceForStudents(["a"]),
        },
      ],
      2026,
      3,
    );
    const day10 = grid.find((c) => c.date === "2026-03-10");
    expect(day10?.sessions).toHaveLength(1);
    expect(day10?.sessions[0].title).toBe("Word");
  });

  it("compte les sessions du mois", () => {
    expect(
      countSessionsInMonth(
        [
          {
            id: "s1",
            title: "A",
            date: "2026-03-01",
            studentIds: [],
            attendance: buildAttendanceForStudents([]),
          },
          {
            id: "s2",
            title: "B",
            date: "2026-04-01",
            studentIds: [],
            attendance: buildAttendanceForStudents([]),
          },
        ],
        2026,
        3,
      ),
    ).toBe(1);
  });
});
