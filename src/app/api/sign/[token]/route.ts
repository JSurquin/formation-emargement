import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getValidSignToken,
  markSignTokenUsed,
} from "@/lib/attendance-token";
import type { AttendanceSlot, HalfDay } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Taille max d'une signature base64 (512 Ko). */
const MAX_SIGNATURE_DATA_URL_LENGTH = 512 * 1024;

type Params = { params: Promise<{ token: string }> };

function asAttendance(value: unknown): {
  morning: Record<string, AttendanceSlot>;
  afternoon: Record<string, AttendanceSlot>;
} {
  const empty = { morning: {}, afternoon: {} };
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const raw = value as Record<string, unknown>;
  return {
    morning: (raw.morning as Record<string, AttendanceSlot>) ?? {},
    afternoon: (raw.afternoon as Record<string, AttendanceSlot>) ?? {},
  };
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const row = await getValidSignToken(token);
    if (!row) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré." },
        { status: 404 },
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: row.studentId },
    });
    if (!student) {
      return NextResponse.json(
        { error: "Participant introuvable." },
        { status: 404 },
      );
    }

    const halfDay = row.halfDay as HalfDay;
    const attendance = asAttendance(row.session.attendance);
    const slot = attendance[halfDay]?.[row.studentId];
    const alreadySigned = Boolean(slot?.signatureDataUrl);

    return NextResponse.json({
      sessionTitle: row.session.title,
      sessionDate: row.session.date,
      halfDay,
      student: {
        firstName: student.firstName,
        lastName: student.lastName,
      },
      alreadySigned,
    });
  } catch (error) {
    console.error("GET /api/sign/[token] failed:", error);
    return NextResponse.json(
      { error: "Impossible de charger le lien." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { token } = await params;
    const row = await getValidSignToken(token);
    if (!row) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré." },
        { status: 404 },
      );
    }

    const body = (await request.json()) as { signatureDataUrl?: string };
    const signatureDataUrl = body.signatureDataUrl?.trim();
    if (!signatureDataUrl?.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "Signature invalide." },
        { status: 400 },
      );
    }
    if (signatureDataUrl.length > MAX_SIGNATURE_DATA_URL_LENGTH) {
      return NextResponse.json(
        { error: "Signature trop volumineuse." },
        { status: 400 },
      );
    }

    const halfDay = row.halfDay as HalfDay;
    const attendance = asAttendance(row.session.attendance);
    const half = { ...attendance[halfDay] };
    const existing = half[row.studentId] ?? {
      present: false,
      signatureDataUrl: null,
      signedAt: null,
    };

    half[row.studentId] = {
      ...existing,
      present: true,
      signatureDataUrl,
      signedAt: new Date().toISOString(),
    };

    const updatedAttendance = {
      ...attendance,
      [halfDay]: half,
    };

    await prisma.trainingSession.update({
      where: { id: row.sessionId },
      data: {
        attendance: updatedAttendance,
        lastActivityAt: new Date(),
      },
    });

    await markSignTokenUsed(token);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/sign/[token] failed:", error);
    return NextResponse.json(
      { error: "Signature impossible." },
      { status: 500 },
    );
  }
}
