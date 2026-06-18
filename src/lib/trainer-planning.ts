import type { Prisma } from "@prisma/client";

export type TrainerPlanningSession = {
  id: string;
  title: string;
  date: string;
  location?: string;
  studentCount: number;
  archived: boolean;
};

function asStringArray(value: Prisma.JsonValue): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === "string");
}

export function mapSessionToPlanningRow(row: {
  id: string;
  title: string;
  date: string;
  location: string | null;
  studentIds: Prisma.JsonValue;
  archived: boolean;
}): TrainerPlanningSession {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    location: row.location ?? undefined,
    studentCount: asStringArray(row.studentIds).length,
    archived: row.archived,
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
