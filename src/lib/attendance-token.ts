import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { HalfDay } from "@/lib/types";

function endOfDayIsoDate(isoDate: string): Date {
  const d = new Date(`${isoDate}T23:59:59.999`);
  if (Number.isNaN(d.getTime())) {
    return new Date(Date.now() + 1000 * 60 * 60 * 24);
  }
  return d;
}

export function generateSignTokenValue(): string {
  return randomBytes(24).toString("hex");
}

export async function createAttendanceSignToken(input: {
  sessionId: string;
  studentId: string;
  halfDay: HalfDay;
  sessionDate: string;
}): Promise<string> {
  const token = generateSignTokenValue();
  const expiresAt = endOfDayIsoDate(input.sessionDate);

  await prisma.attendanceSignToken.create({
    data: {
      token,
      sessionId: input.sessionId,
      studentId: input.studentId,
      halfDay: input.halfDay,
      expiresAt,
    },
  });

  return token;
}

export async function getValidSignToken(token: string) {
  const row = await prisma.attendanceSignToken.findUnique({
    where: { token },
    include: { session: true },
  });

  if (!row) return null;
  if (row.usedAt) return null;
  if (row.expiresAt.getTime() < Date.now()) return null;

  return row;
}

export async function markSignTokenUsed(token: string): Promise<void> {
  await prisma.attendanceSignToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });
}

export function buildSignUrl(token: string, baseUrl?: string): string {
  const origin =
    baseUrl?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${origin}/sign/${token}`;
}
