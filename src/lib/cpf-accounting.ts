import {
  getSessionStudentAccounting,
  isSessionFinished,
} from "./accounting";
import type { SessionStudentAccounting, Student, TrainingSession } from "./types";

export type CpfNotificationStatus = "pending" | "done" | "upcoming";

export type CpfAccountingRow = {
  studentId: string;
  sessionId: string;
  entryStatus: CpfNotificationStatus;
  exitStatus: CpfNotificationStatus;
  accounting: SessionStudentAccounting | null;
};

export type CpfAccountingRowEnriched = CpfAccountingRow & {
  student: Student;
  session: TrainingSession;
};

export function isCpfStudent(student: Student): boolean {
  return student.fundingMethod === "cpf";
}

export function getCpfEntryStatus(
  session: TrainingSession,
  accounting: SessionStudentAccounting | null,
  today?: string,
): CpfNotificationStatus {
  if (accounting?.cpfEntryNotifiedAt) return "done";
  const ref = today ?? new Date().toISOString().slice(0, 10);
  if (session.date > ref) return "upcoming";
  return "pending";
}

export function getCpfExitStatus(
  session: TrainingSession,
  accounting: SessionStudentAccounting | null,
  today?: string,
): CpfNotificationStatus {
  if (accounting?.cpfExitNotifiedAt) return "done";
  if (!isSessionFinished(session, today)) return "upcoming";
  return "pending";
}

export function classifyCpfRow(
  student: Student,
  session: TrainingSession,
  today?: string,
): CpfAccountingRow | null {
  if (!session.studentIds.includes(student.id)) return null;
  if (!isCpfStudent(student)) return null;

  const accounting = getSessionStudentAccounting(session, student.id);

  return {
    studentId: student.id,
    sessionId: session.id,
    entryStatus: getCpfEntryStatus(session, accounting, today),
    exitStatus: getCpfExitStatus(session, accounting, today),
    accounting,
  };
}

export function listCpfAccountingRows(
  students: Student[],
  sessions: TrainingSession[],
  today?: string,
): CpfAccountingRowEnriched[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const rows: CpfAccountingRowEnriched[] = [];

  for (const session of sessions) {
    for (const studentId of session.studentIds) {
      const student = studentMap.get(studentId);
      if (!student) continue;
      const row = classifyCpfRow(student, session, today);
      if (!row) continue;
      rows.push({ ...row, student, session });
    }
  }

  return rows.sort((a, b) => {
    const dateCmp = a.session.date.localeCompare(b.session.date);
    if (dateCmp !== 0) return dateCmp;
    return a.student.lastName.localeCompare(b.student.lastName, "fr");
  });
}

export function countPendingCpfNotifications(
  students: Student[],
  sessions: TrainingSession[],
  today?: string,
): number {
  return listCpfAccountingRows(students, sessions, today).filter(
    (row) => row.entryStatus === "pending" || row.exitStatus === "pending",
  ).length;
}
