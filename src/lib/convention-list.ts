import { getUpcomingSessionForStudent } from "./student-follow-up";
import { isConventionSigned } from "./student-follow-up";
import type { Student, TrainingSession } from "./types";

export type ConventionRow = {
  student: Student;
  session?: TrainingSession;
  sessionStudents: Student[];
  /** Date de création de la convention (ISO). */
  createdAt: string;
  signed: boolean;
};

export function hasConventionBeenCreated(student: Student): boolean {
  return Boolean(
    student.conventionCreatedAt?.trim() || student.conventionSignedAt?.trim(),
  );
}

/** Session liée à la convention : prochaine session ou la plus récente du candidat. */
export function getConventionSessionForStudent(
  studentId: string,
  sessions: TrainingSession[],
  students: Student[],
): { session?: TrainingSession; sessionStudents: Student[] } {
  const upcoming = getUpcomingSessionForStudent(studentId, sessions);
  const session =
    upcoming ??
    [...sessions]
      .filter((s) => s.studentIds.includes(studentId))
      .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!session) return { session: undefined, sessionStudents: [] };

  const ids = new Set(session.studentIds);
  return {
    session,
    sessionStudents: students.filter((s) => ids.has(s.id)),
  };
}

export function listCreatedConventions(
  students: Student[],
  sessions: TrainingSession[],
): ConventionRow[] {
  return students
    .filter(hasConventionBeenCreated)
    .map((student) => {
      const { session, sessionStudents } = getConventionSessionForStudent(
        student.id,
        sessions,
        students,
      );
      const createdAt =
        student.conventionCreatedAt?.trim() ||
        student.conventionSignedAt?.trim() ||
        "";
      return {
        student,
        session,
        sessionStudents,
        createdAt,
        signed: isConventionSigned(student),
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
