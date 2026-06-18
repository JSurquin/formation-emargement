import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageSessions } from "@/lib/auth-types";
import {
  buildSignUrl,
  createAttendanceSignToken,
} from "@/lib/attendance-token";
import { sendAttendanceSignEmail } from "@/lib/email";
import type { HalfDay } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function isSessionToday(isoDate: string): boolean {
  const today = new Date().toISOString().slice(0, 10);
  return isoDate === today;
}

export async function POST(_request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || !canManageSessions(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id: sessionId } = await params;
    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable." },
        { status: 404 },
      );
    }

    if (!isSessionToday(session.date)) {
      return NextResponse.json(
        {
          error:
            "Les e-mails d'émargement ne sont envoyés que le jour de la session.",
        },
        { status: 400 },
      );
    }

    const studentIds = asStringArray(session.studentIds);
    const students = await prisma.student.findMany({
      where: { id: { in: studentIds } },
    });

    const halves: HalfDay[] = ["morning", "afternoon"];
    let sent = 0;
    let skipped = 0;

    for (const student of students) {
      const email = student.email?.trim();
      if (!email) {
        skipped += halves.length;
        continue;
      }

      for (const halfDay of halves) {
        const token = await createAttendanceSignToken({
          sessionId,
          studentId: student.id,
          halfDay,
          sessionDate: session.date,
        });
        const signUrl = buildSignUrl(token);
        await sendAttendanceSignEmail({
          to: email,
          studentName: `${student.firstName} ${student.lastName}`,
          sessionTitle: session.title,
          sessionDate: session.date,
          halfDay,
          signUrl,
        });
        sent++;
      }
    }

    return NextResponse.json({ ok: true, sent, skipped });
  } catch (error) {
    console.error("POST /api/sessions/[id]/send-emails failed:", error);
    return NextResponse.json(
      { error: "Envoi impossible." },
      { status: 500 },
    );
  }
}
