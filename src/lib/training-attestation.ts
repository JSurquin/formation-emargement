import type { Student, TrainingSession } from "./types";

export type StudentAttendanceSummary = {
  presentMorning: boolean;
  presentAfternoon: boolean;
  signedMorning: boolean;
  signedAfternoon: boolean;
};

export function getStudentAttendanceSummary(
  session: TrainingSession,
  studentId: string,
): StudentAttendanceSummary {
  const m = session.attendance.morning[studentId];
  const a = session.attendance.afternoon[studentId];
  return {
    presentMorning: m?.present ?? false,
    presentAfternoon: a?.present ?? false,
    signedMorning: Boolean(m?.signatureDataUrl),
    signedAfternoon: Boolean(a?.signatureDataUrl),
  };
}

/** Élève ayant au moins un créneau marqué présent. */
export function isStudentEligibleForAttestation(
  session: TrainingSession,
  studentId: string,
): boolean {
  const s = getStudentAttendanceSummary(session, studentId);
  return s.presentMorning || s.presentAfternoon;
}

export function buildAttestationDurationLabel(
  summary: StudentAttendanceSummary,
): string {
  if (summary.presentMorning && summary.presentAfternoon) {
    return "journée complète";
  }
  if (summary.presentMorning) {
    return "demi-journée (matin)";
  }
  if (summary.presentAfternoon) {
    return "demi-journée (après-midi)";
  }
  return "session de formation";
}

export function formatAttestationIssueDate(date = new Date()): string {
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function slugPart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 30);
}

/** Nom de fichier suggéré pour l’enregistrement PDF via la boîte d’impression. */
export function buildAttestationFilename(
  session: TrainingSession,
  student: Pick<Student, "firstName" | "lastName">,
): string {
  return `attestation-${slugPart(student.lastName)}-${slugPart(student.firstName)}-${session.date}.pdf`;
}

export function listEligibleStudentIds(session: TrainingSession): string[] {
  return session.studentIds.filter((id) =>
    isStudentEligibleForAttestation(session, id),
  );
}
