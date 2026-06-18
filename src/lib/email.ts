import nodemailer from "nodemailer";
import type { HalfDay } from "@/lib/types";

type MailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
};

function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  const from = process.env.SMTP_FROM?.trim() || user;
  if (!host || !user || !pass || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? "587");
  return { host, port, user, pass, from };
}

export function isEmailConfigured(): boolean {
  return getMailConfig() !== null;
}

async function sendMail(options: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const config = getMailConfig();
  if (!config) {
    console.warn("[email] SMTP non configuré — e-mail non envoyé:", options.to);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: { user: config.user, pass: config.pass },
  });

  await transporter.sendMail({
    from: config.from,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
}

const halfDayLabels: Record<HalfDay, string> = {
  morning: "matin",
  afternoon: "après-midi",
};

export async function sendAttendanceSignEmail(input: {
  to: string;
  studentName: string;
  sessionTitle: string;
  sessionDate: string;
  halfDay: HalfDay;
  signUrl: string;
}): Promise<void> {
  const halfLabel = halfDayLabels[input.halfDay];
  const subject = `Émargement — ${input.sessionTitle} (${halfLabel})`;
  const text = [
    `Bonjour ${input.studentName},`,
    "",
    `Votre session « ${input.sessionTitle} » a lieu le ${input.sessionDate}.`,
    `Merci de signer votre présence du ${halfLabel} via ce lien :`,
    input.signUrl,
    "",
    "Ce lien est personnel et expire après utilisation ou à la fin de la journée.",
  ].join("\n");

  const html = `
    <p>Bonjour ${input.studentName},</p>
    <p>Votre session <strong>${input.sessionTitle}</strong> a lieu le ${input.sessionDate}.</p>
    <p>Merci de signer votre présence du <strong>${halfLabel}</strong> :</p>
    <p><a href="${input.signUrl}">${input.signUrl}</a></p>
    <p><small>Ce lien est personnel et expire après utilisation ou à la fin de la journée.</small></p>
  `;

  await sendMail({ to: input.to, subject, text, html });
}

export async function sendTrainerAssignedEmail(input: {
  to: string;
  trainerName: string;
  sessionTitle: string;
  sessionDate: string;
  sessionUrl: string;
}): Promise<void> {
  const subject = `Session assignée — ${input.sessionTitle}`;
  const text = [
    `Bonjour ${input.trainerName},`,
    "",
    `Vous avez été assigné(e) à la session « ${input.sessionTitle} » le ${input.sessionDate}.`,
    `Accédez à la feuille d'émargement : ${input.sessionUrl}`,
  ].join("\n");

  const html = `
    <p>Bonjour ${input.trainerName},</p>
    <p>Vous avez été assigné(e) à la session <strong>${input.sessionTitle}</strong> le ${input.sessionDate}.</p>
    <p><a href="${input.sessionUrl}">Ouvrir la feuille d'émargement</a></p>
  `;

  await sendMail({ to: input.to, subject, text, html });
}

export async function sendWelcomeEmail(input: {
  to: string;
  name: string;
  roleLabel: string;
  loginUrl: string;
}): Promise<void> {
  const subject = "Votre compte Formation Émargement";
  const text = [
    `Bonjour ${input.name},`,
    "",
    `Votre compte (${input.roleLabel}) a été créé.`,
    `Connectez-vous ici : ${input.loginUrl}`,
  ].join("\n");

  const html = `
    <p>Bonjour ${input.name},</p>
    <p>Votre compte (<strong>${input.roleLabel}</strong>) a été créé.</p>
    <p><a href="${input.loginUrl}">Se connecter</a></p>
  `;

  await sendMail({ to: input.to, subject, text, html });
}

function textToHtml(text: string): string {
  return text
    .split("\n")
    .map((line) => (line ? `<p>${line}</p>` : "<br/>"))
    .join("");
}

export async function sendPlainReminderEmail(input: {
  to: string;
  subject: string;
  text: string;
}): Promise<boolean> {
  const config = getMailConfig();
  if (!config) {
    console.warn("[email] SMTP non configuré — e-mail non envoyé:", input.to);
    return false;
  }
  await sendMail({
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: textToHtml(input.text),
  });
  return true;
}
