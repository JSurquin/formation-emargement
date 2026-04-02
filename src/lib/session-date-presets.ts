/** Midi local pour limiter les décalages fuseau / heure d’été. */
function localNoon(d: Date): Date {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  return x;
}

export function toIsoDateLocal(d: Date): string {
  const x = localNoon(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeekMonday(ref: Date): Date {
  const d = localNoon(ref);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function endOfWeekSunday(ref: Date): Date {
  const start = startOfWeekMonday(ref);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function startOfMonth(ref: Date): Date {
  const d = localNoon(ref);
  d.setDate(1);
  return d;
}

function endOfMonth(ref: Date): Date {
  const d = localNoon(ref);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 12, 0, 0, 0);
}

export type SessionDatePresetId = "week" | "month" | "next30" | "clear";

export function applySessionDatePreset(
  id: SessionDatePresetId,
  today = new Date(),
): { dateFrom: string; dateTo: string } {
  if (id === "clear") return { dateFrom: "", dateTo: "" };
  const t = localNoon(today);
  if (id === "week") {
    return {
      dateFrom: toIsoDateLocal(startOfWeekMonday(t)),
      dateTo: toIsoDateLocal(endOfWeekSunday(t)),
    };
  }
  if (id === "month") {
    return {
      dateFrom: toIsoDateLocal(startOfMonth(t)),
      dateTo: toIsoDateLocal(endOfMonth(t)),
    };
  }
  if (id === "next30") {
    const end = new Date(t);
    end.setDate(end.getDate() + 29);
    return { dateFrom: toIsoDateLocal(t), dateTo: toIsoDateLocal(end) };
  }
  return { dateFrom: "", dateTo: "" };
}

export const SESSION_DATE_PRESETS: {
  id: Exclude<SessionDatePresetId, "clear">;
  label: string;
}[] = [
  { id: "week", label: "Cette semaine" },
  { id: "month", label: "Ce mois" },
  { id: "next30", label: "30 j. à venir" },
];
