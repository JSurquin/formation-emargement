import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageStudents } from "@/lib/auth-types";
import { sendPlainReminderEmail } from "@/lib/email";
import {
  getStudentFollowUp,
  getUpcomingSessionForStudent,
  hasIdentityDocument,
  isConventionSigned,
} from "@/lib/student-follow-up";
import {
  buildConventionReminderEmail,
  buildConventionToCandidateEmail,
  buildConvocationEmail,
  buildMissingDocumentsReminderEmail,
  buildPresenceConfirmationReminderEmail,
  getDocumentsReminderRecipient,
  type ReminderKind,
} from "@/lib/student-reminder-text";
import { usesFunderEmailForDocumentReminder } from "@/lib/funding-method";
import type { Student, TrainingSession } from "@/lib/types";
import type { FundingMethod } from "@/lib/funding-method";
import { isFundingMethod } from "@/lib/funding-method";
import type { StudentDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function asStudentDocuments(value: unknown): StudentDocument[] | undefined {
  if (!Array.isArray(value) || !value.length) return undefined;
  return value as StudentDocument[];
}

function rowToStudent(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  socialSecurityNumber: string | null;
  fundingMethod: string | null;
  funderName: string | null;
  funderSiret: string | null;
  funderEmail: string | null;
  conventionSignedAt: string | null;
  conventionCreatedAt: string | null;
  linkedConventionStudentId: string | null;
  presenceConfirmedForSessionId: string | null;
  documents: unknown;
}): Student {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
    socialSecurityNumber: row.socialSecurityNumber ?? undefined,
    fundingMethod: isFundingMethod(row.fundingMethod ?? "")
      ? (row.fundingMethod as FundingMethod)
      : undefined,
    funderName: row.funderName ?? undefined,
    funderSiret: row.funderSiret ?? undefined,
    funderEmail: row.funderEmail ?? undefined,
    conventionSignedAt: row.conventionSignedAt ?? undefined,
    conventionCreatedAt: row.conventionCreatedAt ?? undefined,
    linkedConventionStudentId: row.linkedConventionStudentId ?? undefined,
    presenceConfirmedForSessionId:
      row.presenceConfirmedForSessionId ?? undefined,
    documents: asStudentDocuments(row.documents),
  };
}

function rowToSession(row: {
  id: string;
  title: string;
  date: string;
  studentIds: unknown;
  archived: boolean;
  location?: string | null;
  trainer?: string | null;
}): TrainingSession {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    studentIds: asStringArray(row.studentIds),
    archived: row.archived || undefined,
    location: row.location ?? undefined,
    trainer: row.trainer ?? undefined,
    attendance: { morning: {}, afternoon: {} },
  };
}

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !canManageStudents(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id: studentId } = await params;
    const body = (await request.json()) as { type?: ReminderKind };
    const kind = body.type;
    if (!kind || !["convention", "convention_candidate", "documents", "presence", "convocation"].includes(kind)) {
      return NextResponse.json(
        { error: "Type de relance invalide." },
        { status: 400 },
      );
    }

    const [studentRow, meta, sessionsRows, studentRows] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.appMeta.findUnique({ where: { id: "default" } }),
      prisma.trainingSession.findMany({
        where: { archived: false },
        select: {
          id: true,
          title: true,
          date: true,
          studentIds: true,
          archived: true,
          location: true,
          trainer: true,
        },
      }),
      prisma.student.findMany(),
    ]);

    if (!studentRow) {
      return NextResponse.json(
        { error: "Candidat introuvable." },
        { status: 404 },
      );
    }

    const student = rowToStudent(studentRow);
    const students = studentRows.map(rowToStudent);
    const organizationName = meta?.organizationName ?? "";
    const sessions = sessionsRows.map(rowToSession);
    const upcomingSession = getUpcomingSessionForStudent(studentId, sessions);

    let to = "";
    let subject = "";
    let text = "";

    if (kind === "convention") {
      if (isConventionSigned(student, students)) {
        return NextResponse.json(
          { error: "La convention est déjà marquée comme signée." },
          { status: 400 },
        );
      }
      to = student.funderEmail?.trim() ?? "";
      if (!to) {
        return NextResponse.json(
          { error: "Renseignez l'e-mail du financeur sur la fiche candidat." },
          { status: 400 },
        );
      }
      const built = buildConventionReminderEmail({ student, organizationName });
      subject = built.subject;
      text = built.text;
    }

    if (kind === "convention_candidate") {
      to = student.email?.trim() ?? "";
      if (!to) {
        return NextResponse.json(
          { error: "Le candidat n'a pas d'adresse e-mail." },
          { status: 400 },
        );
      }
      const built = buildConventionToCandidateEmail({
        student,
        organizationName,
      });
      subject = built.subject;
      text = built.text;
    }

    if (kind === "documents") {
      to = getDocumentsReminderRecipient(student);
      if (!to) {
        return NextResponse.json(
          {
            error: usesFunderEmailForDocumentReminder(student.fundingMethod)
              ? "Renseignez l'e-mail du financeur sur la fiche candidat."
              : "Le candidat n'a pas d'adresse e-mail.",
          },
          { status: 400 },
        );
      }
      const missing: string[] = [];
      if (!hasIdentityDocument(student)) {
        missing.push("Pièce d'identité (carte d'identité ou passeport)");
      }
      const { items } = getStudentFollowUp(student, sessions, students);
      if (!items.find((i) => i.id === "profile")?.ok) {
        missing.push("Informations complètes (e-mail et numéro de sécurité sociale)");
      }
      if (!missing.length) {
        return NextResponse.json(
          { error: "Aucun document manquant détecté." },
          { status: 400 },
        );
      }
      const built = buildMissingDocumentsReminderEmail({
        student,
        organizationName,
        missingLabels: missing,
      });
      subject = built.subject;
      text = built.text;
    }

    if (kind === "presence") {
      if (!upcomingSession) {
        return NextResponse.json(
          { error: "Aucune session à venir pour ce candidat." },
          { status: 400 },
        );
      }
      to = student.email?.trim() ?? "";
      if (!to) {
        return NextResponse.json(
          { error: "Le candidat n'a pas d'adresse e-mail." },
          { status: 400 },
        );
      }
      const built = buildPresenceConfirmationReminderEmail({
        student,
        session: upcomingSession,
        organizationName,
      });
      subject = built.subject;
      text = built.text;
    }

    if (kind === "convocation") {
      if (!upcomingSession) {
        return NextResponse.json(
          { error: "Aucune session à venir pour ce candidat." },
          { status: 400 },
        );
      }
      to = student.email?.trim() ?? "";
      if (!to) {
        return NextResponse.json(
          { error: "Le candidat n'a pas d'adresse e-mail." },
          { status: 400 },
        );
      }
      const built = buildConvocationEmail({
        student,
        session: upcomingSession,
        organizationName,
      });
      subject = built.subject;
      text = built.text;
    }

    const sent = await sendPlainReminderEmail({ to, subject, text });
    return NextResponse.json({
      ok: true,
      sent,
      to,
      subject,
      text,
      smtpConfigured: sent,
    });
  } catch (error) {
    console.error("POST /api/students/[id]/send-reminder failed:", error);
    return NextResponse.json(
      { error: "Envoi impossible." },
      { status: 500 },
    );
  }
}
