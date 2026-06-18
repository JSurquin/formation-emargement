import { describe, expect, it } from "vitest";
import { buildConventionParticipantRows, formatSiret } from "./convention-print";
import type { Student, TrainingSession } from "./types";

const student = (id: string, firstName: string, lastName: string): Student => ({
  id,
  firstName,
  lastName,
});

describe("formatSiret", () => {
  it("formate un SIRET sur 14 chiffres", () => {
    expect(formatSiret("12345678900012")).toBe("123 456 789 00012");
  });
});

describe("buildConventionParticipantRows", () => {
  const session: TrainingSession = {
    id: "s1",
    title: "Session test",
    date: "2026-06-20",
    studentIds: ["a", "b", "c"],
    attendance: { morning: {}, afternoon: {} },
  };

  it("liste les stagiaires de la session avec le candidat courant mis en évidence", () => {
    const rows = buildConventionParticipantRows(
      session,
      [
        student("a", "Alice", "Martin"),
        student("b", "Bob", "Durand"),
        student("c", "Claire", "Petit"),
      ],
      "b",
    );

    expect(rows).toHaveLength(3);
    expect(rows[1]).toEqual({
      index: 2,
      name: "Bob DURAND",
      isCurrent: true,
    });
  });

  it("propose 10 lignes vides sans session", () => {
    const rows = buildConventionParticipantRows(undefined, [], "x");
    expect(rows).toHaveLength(10);
    expect(rows.every((row) => row.name === "")).toBe(true);
  });
});
