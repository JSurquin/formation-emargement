import { formatFrenchDateLong } from "./date-format";
import { getSessionSignatureSummary } from "./session-signature";
import type { Student, TrainingSession } from "./types";

export { formatFrenchDateTimeShort as formatSessionLastActivity } from "./date-format";

export function buildSessionSummaryPlainText(
  session: TrainingSession,
  allStudents: Student[],
  organizationName?: string,
): string {
  const org = organizationName?.trim();
  const byId = new Map(allStudents.map((s) => [s.id, s]));
  const roster = session.studentIds
    .map((id) => byId.get(id))
    .filter((s): s is Student => Boolean(s));
  const sig = getSessionSignatureSummary(session);
  const lines: string[] = [];
  if (org) lines.push(`Organisme : ${org}`);
  lines.push(`Session : ${session.title}`);
  lines.push(`Date : ${formatFrenchDateLong(session.date)}`);
  if (session.location?.trim()) lines.push(`Lieu : ${session.location.trim()}`);
  if (session.trainer?.trim()) {
    lines.push(`Intervenant : ${session.trainer.trim()}`);
  }
  if (session.tags?.length) {
    lines.push(`Étiquettes : ${session.tags.join(", ")}`);
  }
  if (session.archived) lines.push("Statut : archivée");
  lines.push(
    `Signatures : matin ${sig.signedM}/${sig.n}, après-midi ${sig.signedA}/${sig.n}`,
  );
  lines.push("");
  lines.push(`Élèves inscrits (${roster.length}) :`);
  for (const s of roster) {
    const extra = [s.email, s.phone, s.company].filter(Boolean).join(" · ");
    lines.push(`- ${s.firstName} ${s.lastName}${extra ? ` — ${extra}` : ""}`);
  }
  if (session.notes?.trim()) {
    lines.push("");
    lines.push("Notes :");
    lines.push(session.notes.trim());
  }
  return lines.join("\n");
}
