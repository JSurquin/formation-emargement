import type { TrainingSession } from "./types";

export type CalendarSessionItem = {
  id: string;
  title: string;
  date: string;
  studentCount: number;
  location?: string;
  archived: boolean;
  trainer?: string;
};

export type CalendarDayCell = {
  date: string;
  dayOfMonth: number;
  inMonth: boolean;
  sessions: CalendarSessionItem[];
};

export function toCalendarSessionItem(
  session: TrainingSession,
): CalendarSessionItem {
  return {
    id: session.id,
    title: session.title,
    date: session.date,
    studentCount: session.studentIds.length,
    location: session.location,
    archived: session.archived ?? false,
    trainer: session.trainer,
  };
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildMonthGrid(
  sessions: TrainingSession[],
  year: number,
  month: number,
): CalendarDayCell[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const daysInMonth = last.getDate();

  // Lundi = 0 … Dimanche = 6 (ISO-like)
  const startOffset = (first.getDay() + 6) % 7;

  const byDate = new Map<string, CalendarSessionItem[]>();
  for (const sess of sessions) {
    const [y, m] = sess.date.split("-").map(Number);
    if (y !== year || m !== month) continue;
    const list = byDate.get(sess.date) ?? [];
    list.push(toCalendarSessionItem(sess));
    byDate.set(sess.date, list);
  }

  for (const list of byDate.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  }

  const cells: CalendarDayCell[] = [];

  for (let i = 0; i < startOffset; i++) {
    const d = new Date(year, month - 1, -startOffset + i + 1);
    const iso = toIsoDate(d);
    cells.push({
      date: iso,
      dayOfMonth: d.getDate(),
      inMonth: false,
      sessions: byDate.get(iso) ?? [],
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      date: iso,
      dayOfMonth: day,
      inMonth: true,
      sessions: byDate.get(iso) ?? [],
    });
  }

  while (cells.length % 7 !== 0) {
    const lastCell = cells[cells.length - 1];
    const d = new Date(lastCell.date + "T12:00:00");
    d.setDate(d.getDate() + 1);
    const iso = toIsoDate(d);
    cells.push({
      date: iso,
      dayOfMonth: d.getDate(),
      inMonth: false,
      sessions: byDate.get(iso) ?? [],
    });
  }

  return cells;
}

export function countSessionsInMonth(
  sessions: TrainingSession[],
  year: number,
  month: number,
): number {
  return sessions.filter((s) => {
    const [y, m] = s.date.split("-").map(Number);
    return y === year && m === month;
  }).length;
}

export const CALENDAR_WEEKDAY_LABELS = [
  "Lun",
  "Mar",
  "Mer",
  "Jeu",
  "Ven",
  "Sam",
  "Dim",
] as const;
