import type { Student, TrainingSession } from "./types";

/** E-mails des inscrits sur la feuille (séparés par ; pour coller dans un client mail). */
export function buildSessionEmailsList(
  session: TrainingSession,
  allStudents: Student[],
): string {
  const byId = new Map(allStudents.map((s) => [s.id, s]));
  const emails: string[] = [];
  for (const id of session.studentIds) {
    const em = byId.get(id)?.email?.trim();
    if (em) emails.push(em);
  }
  return emails.join("; ");
}
