import { getFundingMethodLabel } from "./funding-method";
import type { Student, TrainingSession } from "./types";

function formatFrenchDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type ReminderKind =
  | "convention"
  | "convention_candidate"
  | "documents"
  | "presence"
  | "convocation";

export function buildConventionReminderEmail(input: {
  student: Student;
  organizationName?: string;
}): { subject: string; text: string } {
  const org = input.organizationName?.trim() || "L'organisme de formation";
  const studentName = `${input.student.firstName} ${input.student.lastName}`;
  const funding = getFundingMethodLabel(input.student.fundingMethod);

  const subject = `Relance — convention de formation à signer — ${studentName}`;
  const text = [
    "Bonjour,",
    "",
    `Nous vous contactons concernant la convention de formation de ${studentName}.`,
    funding ? `Financement prévu : ${funding}.` : "",
    "",
    "À ce jour, la convention n'a pas encore été signée par le stagiaire.",
    "Vous trouverez ci-joint (ou en pièce jointe) la convention de formation à faire signer par le candidat.",
    "Merci de bien vouloir relancer le candidat ou de nous confirmer la suite à donner au dossier.",
    "",
    `Cordialement,`,
    org,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text };
}

export function buildMissingDocumentsReminderEmail(input: {
  student: Student;
  organizationName?: string;
  missingLabels: string[];
}): { subject: string; text: string } {
  const org = input.organizationName?.trim() || "L'organisme de formation";
  const studentName = input.student.firstName;

  const subject = `Documents manquants — inscription formation`;
  const text = [
    `Bonjour ${studentName},`,
    "",
    "Pour finaliser votre inscription, il nous manque encore :",
    ...input.missingLabels.map((l) => `• ${l}`),
    "",
    "Merci de nous transmettre ces éléments ou de les déposer sur votre fiche candidat dans les plus brefs délais.",
    "",
    "Cordialement,",
    org,
  ].join("\n");

  return { subject, text };
}

export function buildConventionToCandidateEmail(input: {
  student: Student;
  organizationName?: string;
}): { subject: string; text: string } {
  const org = input.organizationName?.trim() || "L'organisme de formation";
  const studentName = input.student.firstName;
  const funding = getFundingMethodLabel(input.student.fundingMethod);

  const subject = `Convention de formation à signer`;
  const text = [
    `Bonjour ${studentName},`,
    "",
    "Veuillez trouver ci-joint votre convention de formation.",
    funding ? `Financement prévu : ${funding}.` : "",
    "",
    "Merci de la relire, la signer et nous la retourner signée dans les plus brefs délais.",
    "Si vous ne voyez pas la pièce jointe, répondez à ce message et nous vous la renverrons.",
    "",
    "Cordialement,",
    org,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text };
}

export function buildConvocationEmail(input: {
  student: Student;
  session: TrainingSession;
  organizationName?: string;
}): { subject: string; text: string } {
  const org = input.organizationName?.trim() || "L'organisme de formation";
  const studentName = input.student.firstName;
  const dateLabel = formatFrenchDate(input.session.date);
  const location = input.session.location?.trim();
  const trainer = input.session.trainer?.trim();

  const subject = `Convocation — ${input.session.title}`;
  const text = [
    `Bonjour ${studentName},`,
    "",
    `Vous êtes convoqué(e) à la formation « ${input.session.title} ».`,
    "",
    `Date : ${dateLabel}`,
    location ? `Lieu : ${location}` : "Lieu : à confirmer",
    trainer ? `Intervenant : ${trainer}` : "",
    "",
    "Merci de confirmer votre présence en répondant à ce message.",
    "En cas d'empêchement, merci de nous prévenir au plus tôt.",
    "",
    "Cordialement,",
    org,
  ]
    .filter(Boolean)
    .join("\n");

  return { subject, text };
}

export function buildPresenceConfirmationReminderEmail(input: {
  student: Student;
  session: TrainingSession;
  organizationName?: string;
}): { subject: string; text: string } {
  const org = input.organizationName?.trim() || "L'organisme de formation";
  const studentName = input.student.firstName;
  const dateLabel = formatFrenchDate(input.session.date);

  const subject = `Confirmation de présence — ${input.session.title}`;
  const text = [
    `Bonjour ${studentName},`,
    "",
    `Votre formation « ${input.session.title} » est prévue le ${dateLabel}.`,
    "",
    "Pouvez-vous nous confirmer votre présence ce jour-là en répondant à ce message ?",
    "En cas d'empêchement, merci de nous prévenir au plus tôt.",
    "",
    "Cordialement,",
    org,
  ].join("\n");

  return { subject, text };
}

export function buildMailtoUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams();
  params.set("subject", subject);
  params.set("body", body);
  return `mailto:${encodeURIComponent(to)}?${params.toString()}`;
}
