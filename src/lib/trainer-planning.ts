import type { Prisma } from "@prisma/client";
import type { TrainerDocument } from "./types";

export type TrainerPlanningSession = {
  id: string;
  title: string;
  date: string;
  location?: string;
  studentCount: number;
  archived: boolean;
  documents: TrainerDocument[];
};

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

function asTrainerDocuments(value: Prisma.JsonValue | null): TrainerDocument[] {
  if (!Array.isArray(value)) return [];
  const out: TrainerDocument[] = [];
  for (const item of value) {
    if (
      item &&
      typeof item === "object" &&
      !Array.isArray(item) &&
      typeof (item as TrainerDocument).id === "string" &&
      typeof (item as TrainerDocument).label === "string" &&
      typeof (item as TrainerDocument).fileName === "string" &&
      typeof (item as TrainerDocument).mimeType === "string" &&
      typeof (item as TrainerDocument).dataUrl === "string" &&
      typeof (item as TrainerDocument).uploadedAt === "string"
    ) {
      out.push(item as TrainerDocument);
    }
  }
  return out;
}

export function mapSessionToPlanningRow(row: {
  id: string;
  title: string;
  date: string;
  location: string | null;
  studentIds: Prisma.JsonValue;
  archived: boolean;
  trainerDocuments: Prisma.JsonValue | null;
}): TrainerPlanningSession {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    location: row.location ?? undefined,
    studentCount: asStringArray(row.studentIds).length,
    archived: row.archived,
    documents: asTrainerDocuments(row.trainerDocuments),
  };
}

export function splitPlanningSessions(
  sessions: TrainerPlanningSession[],
  todayIso = new Date().toISOString().slice(0, 10),
): {
  upcoming: TrainerPlanningSession[];
  past: TrainerPlanningSession[];
} {
  const upcoming: TrainerPlanningSession[] = [];
  const past: TrainerPlanningSession[] = [];

  for (const session of sessions) {
    if (session.date >= todayIso) upcoming.push(session);
    else past.push(session);
  }

  upcoming.sort((a, b) => a.date.localeCompare(b.date));
  past.sort((a, b) => b.date.localeCompare(a.date));

  return { upcoming, past };
}
