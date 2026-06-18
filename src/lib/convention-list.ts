import { getUpcomingSessionForStudent } from "./student-follow-up";
import type { Student, TrainingSession } from "./types";

export type ConventionRow = {
  student: Student;
  session?: TrainingSession;
  sessionStudents: Student[];
  /** Date de création de la convention (ISO). */
  createdAt: string;
  signed: boolean;
  /** Convention partagée avec un autre candidat de la session. */
  linkedToStudent?: Student;
};

export type AttachableConvention = {
  referenceStudent: Student;
  session: TrainingSession;
  label: string;
};

export function resolveConventionStudent(
  student: Student,
  students: Student[],
): Student {
  const linkedId = student.linkedConventionStudentId?.trim();
  if (!linkedId || linkedId === student.id) return student;
  const linked = students.find((s) => s.id === linkedId);
  if (!linked) return student;
  return linked;
}

export function isConventionSigned(
  student: Student,
  students: Student[] = [],
): boolean {
  const ref = students.length
    ? resolveConventionStudent(student, students)
    : student;
  return Boolean(ref.conventionSignedAt?.trim());
}

export function hasConventionBeenCreated(
  student: Student,
  students: Student[] = [],
): boolean {
  const ref = students.length
    ? resolveConventionStudent(student, students)
    : student;
  return Boolean(
    ref.conventionCreatedAt?.trim() || ref.conventionSignedAt?.trim(),
  );
}

export function getConventionCreatedAt(
  student: Student,
  students: Student[],
): string {
  const ref = resolveConventionStudent(student, students);
  return (
    ref.conventionCreatedAt?.trim() || ref.conventionSignedAt?.trim() || ""
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

export function listAttachableConventionsForStudent(
  student: Student,
  students: Student[],
  sessions: TrainingSession[],
): AttachableConvention[] {
  if (hasConventionBeenCreated(student, students)) return [];

  const { session } = getConventionSessionForStudent(
    student.id,
    sessions,
    students,
  );
  if (!session) return [];

  return session.studentIds
    .filter((id) => id !== student.id)
    .map((id) => students.find((s) => s.id === id))
    .filter((s): s is Student => Boolean(s))
    .filter(
      (s) => hasConventionBeenCreated(s, students) && !s.linkedConventionStudentId,
    )
    .map((referenceStudent) => ({
      referenceStudent,
      session,
      label: `${referenceStudent.firstName} ${referenceStudent.lastName} — ${session.title}`,
    }));
}

export function listCreatedConventions(
  students: Student[],
  sessions: TrainingSession[],
): ConventionRow[] {
  return students
    .filter((student) => hasConventionBeenCreated(student, students))
    .map((student) => {
      const { session, sessionStudents } = getConventionSessionForStudent(
        student.id,
        sessions,
        students,
      );
      const linkedToStudent = student.linkedConventionStudentId
        ? students.find((s) => s.id === student.linkedConventionStudentId)
        : undefined;
      return {
        student,
        session,
        sessionStudents,
        createdAt: getConventionCreatedAt(student, students),
        signed: isConventionSigned(student, students),
        linkedToStudent,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
