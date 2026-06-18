import type { Student, TrainingSession } from "./types";

export type ConventionParticipantRow = {
  index: number;
  name: string;
  isCurrent: boolean;
};

const DEFAULT_PARTICIPANT_ROWS = 10;

export function formatSiret(raw: string): string {
  const n = raw.replace(/\s/g, "");
  if (!n) return "";
  const chunks = [
    n.slice(0, 3),
    n.slice(3, 6),
    n.slice(6, 9),
    n.slice(9, 14),
  ].filter(Boolean);
  return chunks.join(" ");
}

export function buildConventionParticipantRows(
  session: TrainingSession | undefined,
  students: Student[],
  currentStudentId: string,
): ConventionParticipantRow[] {
  const byId = new Map(students.map((s) => [s.id, s]));
  const rowCount = session
    ? Math.max(session.studentIds.length, 1)
    : DEFAULT_PARTICIPANT_ROWS;

  return Array.from({ length: rowCount }, (_, i) => {
    const studentId = session?.studentIds[i];
    const rowStudent = studentId ? byId.get(studentId) : undefined;
    return {
      index: i + 1,
      name: rowStudent
        ? `${rowStudent.firstName} ${rowStudent.lastName.toUpperCase()}`
        : "",
      isCurrent: studentId === currentStudentId,
    };
  });
}
