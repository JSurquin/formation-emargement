import {
  getPendingFollowUpLabels,
  getStudentFollowUp,
} from "./student-follow-up";
import { isStudentEligibleForAttestation } from "./training-attestation";
import type {
  SessionStudentAccounting,
  Student,
  TrainingSession,
} from "./types";

export type AccountingCategory =
  | "relance"
  | "facture_a_envoyer"
  | "en_attente_paiement"
  | "paye";

export type AccountingRow = {
  studentId: string;
  sessionId: string;
  category: AccountingCategory;
  followUpLabels: string[];
  accounting: SessionStudentAccounting | null;
};

export type AccountingRowEnriched = AccountingRow & {
  student: Student;
  session: TrainingSession;
};

export const ACCOUNTING_CATEGORY_LABELS: Record<AccountingCategory, string> = {
  relance: "À relancer",
  facture_a_envoyer: "Factures à envoyer",
  en_attente_paiement: "Paiements en attente",
  paye: "Payés",
};

export function isSessionFinished(
  session: TrainingSession,
  today?: string,
): boolean {
  const ref = today ?? new Date().toISOString().slice(0, 10);
  return session.date < ref;
}

export function getSessionStudentAccounting(
  session: TrainingSession,
  studentId: string,
): SessionStudentAccounting | null {
  const raw = session.sessionAccounting?.[studentId];
  if (!raw) return null;
  return raw;
}

export function classifyAccountingRow(
  student: Student,
  session: TrainingSession,
  sessions: TrainingSession[],
  today?: string,
): AccountingRow | null {
  if (!session.studentIds.includes(student.id)) return null;

  const accounting = getSessionStudentAccounting(session, student.id);
  const { items } = getStudentFollowUp(student, sessions);
  const followUpLabels = getPendingFollowUpLabels(items);
  const finished = isSessionFinished(session, today);
  const present = isStudentEligibleForAttestation(session, student.id);

  if (finished && !present && followUpLabels.length === 0) {
    return null;
  }

  let category: AccountingCategory;

  if (accounting?.paymentReceivedAt) {
    category = "paye";
  } else if (accounting?.invoiceSentAt) {
    category = "en_attente_paiement";
  } else if (finished && present) {
    category = "facture_a_envoyer";
  } else if (followUpLabels.length > 0) {
    category = "relance";
  } else {
    return null;
  }

  return {
    studentId: student.id,
    sessionId: session.id,
    category,
    followUpLabels,
    accounting,
  };
}

export function listAccountingRows(
  students: Student[],
  sessions: TrainingSession[],
  filterCategory?: AccountingCategory,
): AccountingRowEnriched[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const rows: AccountingRowEnriched[] = [];

  for (const session of sessions) {
    for (const studentId of session.studentIds) {
      const student = studentMap.get(studentId);
      if (!student) continue;
      const row = classifyAccountingRow(student, session, sessions);
      if (!row) continue;
      if (filterCategory && row.category !== filterCategory) continue;
      rows.push({ ...row, student, session });
    }
  }

  return rows.sort((a, b) => {
    const dateCmp = b.session.date.localeCompare(a.session.date);
    if (dateCmp !== 0) return dateCmp;
    return a.student.lastName.localeCompare(b.student.lastName, "fr");
  });
}

export function countAccountingByCategory(
  students: Student[],
  sessions: TrainingSession[],
): Record<AccountingCategory, number> {
  const counts: Record<AccountingCategory, number> = {
    relance: 0,
    facture_a_envoyer: 0,
    en_attente_paiement: 0,
    paye: 0,
  };
  for (const row of listAccountingRows(students, sessions)) {
    counts[row.category]++;
  }
  return counts;
}
