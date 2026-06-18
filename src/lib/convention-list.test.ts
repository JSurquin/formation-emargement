import { describe, expect, it } from "vitest";
import {
  hasConventionBeenCreated,
  isConventionSigned,
  listAttachableConventionsForStudent,
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

  it("retourne true si rattaché à une convention existante", () => {
    const students = [
      baseStudent({
        id: "s2",
        firstName: "Marie",
        linkedConventionStudentId: "s1",
      }),
      baseStudent({
        id: "s1",
        conventionCreatedAt: "2026-06-01T10:00:00.000Z",
      }),
    ];
    expect(hasConventionBeenCreated(students[0]!, students)).toBe(true);
  });

  it("retourne false sans date de convention", () => {
    expect(hasConventionBeenCreated(baseStudent())).toBe(false);
  });
});

describe("listAttachableConventionsForStudent", () => {
  it("propose les conventions existantes de la même session", () => {
    const students = [
      baseStudent({
        id: "s1",
        conventionCreatedAt: "2026-06-01T10:00:00.000Z",
      }),
      baseStudent({ id: "s2", firstName: "Marie" }),
    ];
    const sessions = [baseSession({ studentIds: ["s1", "s2"] })];
    const options = listAttachableConventionsForStudent(
      students[1]!,
      students,
      sessions,
    );
    expect(options).toHaveLength(1);
    expect(options[0]?.referenceStudent.id).toBe("s1");
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

  it("hérite du statut signé via le rattachement", () => {
    const students = [
      baseStudent({
        id: "s1",
        conventionCreatedAt: "2026-06-01T10:00:00.000Z",
        conventionSignedAt: "2026-06-02T10:00:00.000Z",
      }),
      baseStudent({
        id: "s2",
        firstName: "Marie",
        linkedConventionStudentId: "s1",
      }),
    ];
    const rows = listCreatedConventions(students, [
      baseSession({ studentIds: ["s1", "s2"] }),
    ]);
    const linked = rows.find((row) => row.student.id === "s2");
    expect(linked?.signed).toBe(true);
    expect(isConventionSigned(students[1]!, students)).toBe(true);
  });
});
