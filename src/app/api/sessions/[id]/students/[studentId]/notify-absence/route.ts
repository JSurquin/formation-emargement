import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageSessions } from "@/lib/auth-types";
import { sendPlainReminderEmail } from "@/lib/email";
import { buildAbsenceNotificationEmail } from "@/lib/student-reminder-text";
import type { Student, TrainingSession } from "@/lib/types";
import type { FundingMethod } from "@/lib/funding-method";
import { isFundingMethod } from "@/lib/funding-method";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string; studentId: string }> };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function rowToStudent(row: {
  id: string;
  firstName: string;
  lastName: string;
  funderEmail: string | null;
  fundingMethod: string | null;
}): Student {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    funderEmail: row.funderEmail ?? undefined,
    fundingMethod: isFundingMethod(row.fundingMethod ?? "")
      ? (row.fundingMethod as FundingMethod)
      : undefined,
  };
}

function rowToSession(row: {
  id: string;
  title: string;
  date: string;
  studentIds: unknown;
  location?: string | null;
}): TrainingSession {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    studentIds: asStringArray(row.studentIds),
    location: row.location ?? undefined,
    attendance: { morning: {}, afternoon: {} },
  };
}

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !canManageSessions(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id: sessionId, studentId } = await params;

    const [sessionRow, studentRow, meta] = await Promise.all([
      prisma.trainingSession.findUnique({ where: { id: sessionId } }),
      prisma.student.findUnique({ where: { id: studentId } }),
      prisma.appMeta.findUnique({ where: { id: "default" } }),
    ]);

    if (!sessionRow) {
      return NextResponse.json(
        { error: "Session introuvable." },
        { status: 404 },
      );
    }

    if (!studentRow) {
      return NextResponse.json(
        { error: "Stagiaire introuvable." },
        { status: 404 },
      );
    }

    const studentIds = asStringArray(sessionRow.studentIds);
    if (!studentIds.includes(studentId)) {
      return NextResponse.json(
        { error: "Ce stagiaire n'est pas inscrit sur cette session." },
        { status: 400 },
      );
    }

    const to = studentRow.funderEmail?.trim() ?? "";
    if (!to) {
      return NextResponse.json(
        { error: "Renseignez l'e-mail du financeur sur la fiche candidat." },
        { status: 400 },
      );
    }

    const student = rowToStudent(studentRow);
    const session = rowToSession(sessionRow);
    const organizationName = meta?.organizationName ?? "";
    const { subject, text } = buildAbsenceNotificationEmail({
      student,
      session,
      organizationName,
    });

    const sent = await sendPlainReminderEmail({ to, subject, text });
    return NextResponse.json({
      ok: true,
      sent,
      to,
      subject,
      smtpConfigured: sent,
    });
  } catch (error) {
    console.error(
      "POST /api/sessions/[id]/students/[studentId]/notify-absence failed:",
      error,
    );
    return NextResponse.json({ error: "Envoi impossible." }, { status: 500 });
  }
}
