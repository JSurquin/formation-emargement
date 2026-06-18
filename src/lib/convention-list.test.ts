import { describe, expect, it } from "vitest";
import {
  hasConventionBeenCreated,
  listCreatedConventions,
} from "./convention-list";
import type { Student, TrainingSession } from "./types";

const baseStudent = (over: Partial<Student> = {}): Student => ({
  id: "s1",
  firstName: "Jean",
  lastName: "Dupont",
  ...over,
});

const baseSession = (over: Partial<TrainingSession> = {}): TrainingSession =>
  ({
    id: "sess1",
    title: "Formation Excel",
    date: "2026-06-20",
    studentIds: ["s1"],
    attendance: { morning: {}, afternoon: {} },
    ...over,
  }) as TrainingSession;

describe("hasConventionBeenCreated", () => {
  it("retourne true si conventionCreatedAt est renseigné", () => {
    expect(
      hasConventionBeenCreated(
        baseStudent({ conventionCreatedAt: "2026-06-01T10:00:00.000Z" }),
      ),
    ).toBe(true);
  });

  it("retourne true si conventionSignedAt est renseigné (rétrocompatibilité)", () => {
    expect(
      hasConventionBeenCreated(
        baseStudent({ conventionSignedAt: "2026-06-02T10:00:00.000Z" }),
      ),
    ).toBe(true);
  });

  it("retourne false sans date de convention", () => {
    expect(hasConventionBeenCreated(baseStudent())).toBe(false);
  });
});

describe("listCreatedConventions", () => {
  it("liste les candidats avec convention, triés par date décroissante", () => {
    const students = [
      baseStudent({
        id: "s1",
        conventionCreatedAt: "2026-06-01T10:00:00.000Z",
      }),
      baseStudent({
        id: "s2",
        firstName: "Marie",
        conventionCreatedAt: "2026-06-03T10:00:00.000Z",
      }),
      baseStudent({ id: "s3", firstName: "Paul" }),
    ];
    const sessions = [baseSession({ studentIds: ["s1", "s2"] })];
    const rows = listCreatedConventions(students, sessions);
    expect(rows).toHaveLength(2);
    expect(rows[0]?.student.id).toBe("s2");
    expect(rows[1]?.student.id).toBe("s1");
    expect(rows[0]?.session?.title).toBe("Formation Excel");
  });
});
