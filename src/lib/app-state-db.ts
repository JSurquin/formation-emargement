import type { Prisma } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  APP_STATE_SCHEMA_VERSION,
  defaultAppState,
  migrateAppState,
} from "@/lib/formation-storage";
import type {
  AppState,
  AttendanceSlot,
  SessionTemplate,
  Student,
  TrainingSession,
} from "@/lib/types";

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function asSessionTemplates(value: Prisma.JsonValue): SessionTemplate[] {
  if (!Array.isArray(value)) return [];
  const out: SessionTemplate[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof (item as SessionTemplate).id === "string" &&
      typeof (item as SessionTemplate).name === "string" &&
      Array.isArray((item as SessionTemplate).studentIds) &&
      (item as SessionTemplate).studentIds.every((id) => typeof id === "string")
    ) {
      out.push(item as SessionTemplate);
    }
  }
  return out;
}

function asAttendanceSlot(value: unknown): AttendanceSlot | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const slot = value as AttendanceSlot;
  if (
    typeof slot.present !== "boolean" ||
    (slot.signatureDataUrl !== null &&
      typeof slot.signatureDataUrl !== "string") ||
    (slot.signedAt !== null && typeof slot.signedAt !== "string")
  ) {
    return null;
  }
  return slot;
}

function asAttendance(value: Prisma.JsonValue): TrainingSession["attendance"] {
  const empty = { morning: {}, afternoon: {} };
  if (!value || typeof value !== "object" || Array.isArray(value)) return empty;
  const raw = value as Record<string, unknown>;
  const morningRaw = raw.morning;
  const afternoonRaw = raw.afternoon;
  const morning: Record<string, AttendanceSlot> = {};
  const afternoon: Record<string, AttendanceSlot> = {};
  if (morningRaw && typeof morningRaw === "object" && !Array.isArray(morningRaw)) {
    for (const [id, slot] of Object.entries(morningRaw)) {
      const parsed = asAttendanceSlot(slot);
      if (parsed) morning[id] = parsed;
    }
  }
  if (
    afternoonRaw &&
    typeof afternoonRaw === "object" &&
    !Array.isArray(afternoonRaw)
  ) {
    for (const [id, slot] of Object.entries(afternoonRaw)) {
      const parsed = asAttendanceSlot(slot);
      if (parsed) afternoon[id] = parsed;
    }
  }
  return { morning, afternoon };
}

function rowToStudent(row: {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
}): Student {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    company: row.company ?? undefined,
  };
}

function rowToSession(row: {
  id: string;
  title: string;
  date: string;
  studentIds: Prisma.JsonValue;
  notes: string | null;
  tags: Prisma.JsonValue | null;
  favorited: boolean;
  archived: boolean;
  location: string | null;
  trainer: string | null;
  createdAt: Date | null;
  lastActivityAt: Date | null;
  attendance: Prisma.JsonValue;
}): TrainingSession {
  const studentIds = asStringArray(row.studentIds);
  const tags = row.tags ? asStringArray(row.tags) : undefined;
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    studentIds,
    notes: row.notes ?? undefined,
    tags: tags?.length ? tags : undefined,
    favorited: row.favorited || undefined,
    archived: row.archived || undefined,
    location: row.location ?? undefined,
    trainer: row.trainer ?? undefined,
    createdAt: row.createdAt?.toISOString(),
    lastActivityAt: row.lastActivityAt?.toISOString(),
    attendance: asAttendance(row.attendance),
  };
}

export async function loadAppStateFromDb(): Promise<AppState> {
  const [meta, students, sessions] = await Promise.all([
    prisma.appMeta.findUnique({ where: { id: "default" } }),
    prisma.student.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.trainingSession.findMany({
      orderBy: [{ createdAt: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  if (!meta && students.length === 0 && sessions.length === 0) {
    return defaultAppState;
  }

  const state: AppState = migrateAppState({
    schemaVersion: meta?.schemaVersion ?? APP_STATE_SCHEMA_VERSION,
    organizationName: meta?.organizationName ?? "",
    noteSnippets: meta ? asStringArray(meta.noteSnippets) : [],
    sessionTemplates: meta ? asSessionTemplates(meta.sessionTemplates) : [],
    students: students.map(rowToStudent),
    sessions: sessions.map(rowToSession),
  });

  return state;
}

function parseIsoDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function saveAppStateToDb(state: AppState): Promise<void> {
  const normalized = migrateAppState({
    ...state,
    schemaVersion: APP_STATE_SCHEMA_VERSION,
  });

  await prisma.$transaction(async (tx) => {
    await tx.appMeta.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        schemaVersion: APP_STATE_SCHEMA_VERSION,
        organizationName: normalized.organizationName ?? "",
        noteSnippets: normalized.noteSnippets ?? [],
        sessionTemplates: normalized.sessionTemplates ?? [],
      },
      update: {
        schemaVersion: APP_STATE_SCHEMA_VERSION,
        organizationName: normalized.organizationName ?? "",
        noteSnippets: normalized.noteSnippets ?? [],
        sessionTemplates: normalized.sessionTemplates ?? [],
      },
    });

    const studentIds = new Set(normalized.students.map((s) => s.id));
    const sessionIds = new Set(normalized.sessions.map((s) => s.id));

    const existingStudents = await tx.student.findMany({ select: { id: true } });
    const existingSessions = await tx.trainingSession.findMany({
      select: { id: true },
    });

    const studentsToDelete = existingStudents
      .map((s) => s.id)
      .filter((id) => !studentIds.has(id));
    const sessionsToDelete = existingSessions
      .map((s) => s.id)
      .filter((id) => !sessionIds.has(id));

    if (studentsToDelete.length) {
      await tx.student.deleteMany({ where: { id: { in: studentsToDelete } } });
    }
    if (sessionsToDelete.length) {
      await tx.trainingSession.deleteMany({
        where: { id: { in: sessionsToDelete } },
      });
    }

    for (const student of normalized.students) {
      await tx.student.upsert({
        where: { id: student.id },
        create: {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email ?? null,
          phone: student.phone ?? null,
          company: student.company ?? null,
        },
        update: {
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email ?? null,
          phone: student.phone ?? null,
          company: student.company ?? null,
        },
      });
    }

    for (const session of normalized.sessions) {
      await tx.trainingSession.upsert({
        where: { id: session.id },
        create: {
          id: session.id,
          title: session.title,
          date: session.date,
          studentIds: session.studentIds,
          notes: session.notes ?? null,
          tags: session.tags ?? PrismaNamespace.DbNull,
          favorited: session.favorited === true,
          archived: session.archived === true,
          location: session.location ?? null,
          trainer: session.trainer ?? null,
          createdAt: parseIsoDate(session.createdAt),
          lastActivityAt: parseIsoDate(session.lastActivityAt),
          attendance: session.attendance,
        },
        update: {
          title: session.title,
          date: session.date,
          studentIds: session.studentIds,
          notes: session.notes ?? null,
          tags: session.tags ?? PrismaNamespace.DbNull,
          favorited: session.favorited === true,
          archived: session.archived === true,
          location: session.location ?? null,
          trainer: session.trainer ?? null,
          createdAt: parseIsoDate(session.createdAt),
          lastActivityAt: parseIsoDate(session.lastActivityAt),
          attendance: session.attendance,
        },
      });
    }
  });
}
