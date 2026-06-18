import { describe, expect, it } from "vitest";
import {
  mapSessionToPlanningRow,
  splitPlanningSessions,
} from "./trainer-planning";

describe("mapSessionToPlanningRow", () => {
  it("compte les stagiaires et normalise les champs", () => {
    const row = mapSessionToPlanningRow({
      id: "s1",
      title: "Excel",
      date: "2026-06-20",
      location: "Paris",
      studentIds: ["a", "b"],
      archived: false,
      trainerDocuments: null,
    });
    expect(row.studentCount).toBe(2);
    expect(row.location).toBe("Paris");
  });
});

describe("splitPlanningSessions", () => {
  it("sépare à venir et passé, triés par date", () => {
    const sessions = [
      mapSessionToPlanningRow({
        id: "past",
        title: "Passée",
        date: "2026-06-01",
        location: null,
        studentIds: [],
        archived: true,
        trainerDocuments: null,
      }),
      mapSessionToPlanningRow({
        id: "soon",
        title: "Bientôt",
        date: "2026-06-25",
        location: null,
        studentIds: ["x"],
        archived: false,
        trainerDocuments: null,
      }),
      mapSessionToPlanningRow({
        id: "next",
        title: "Prochaine",
        date: "2026-06-20",
        location: null,
        studentIds: [],
        archived: false,
        trainerDocuments: null,
      }),
    ];

    const { upcoming, past } = splitPlanningSessions(sessions, "2026-06-18");
    expect(upcoming.map((s) => s.id)).toEqual(["next", "soon"]);
    expect(past.map((s) => s.id)).toEqual(["past"]);
  });
});
