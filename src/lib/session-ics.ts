import type { TrainingSession } from "./types";

function padIcsDate(yyyyMmDd: string): string {
  return yyyyMmDd.replace(/-/g, "");
}

/** DTEND exclusif (jour suivant) pour événement journée entière. */
function nextCalendarDay(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const x = new Date(Date.UTC(y, m - 1, d + 1));
  return padIcsDate(x.toISOString().slice(0, 10));
}

function escapeIcsText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function icsUtcStamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
}

export function downloadSessionIcs(
  session: TrainingSession,
  organizationName?: string,
  filenameHint?: string,
): void {
  const uid = `${session.id}@formation-emargement.local`;
  const d0 = padIcsDate(session.date);
  const d1 = nextCalendarDay(session.date);
  const loc = session.location?.trim();
  const parts: string[] = [];
  if (organizationName?.trim()) {
    parts.push(`Organisme : ${organizationName.trim()}`);
  }
  if (session.trainer?.trim()) {
    parts.push(`Intervenant : ${session.trainer.trim()}`);
  }
  if (session.notes?.trim()) {
    parts.push(session.notes.trim());
  }
  const desc = escapeIcsText(parts.join("\\n"));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Formation Emargement//FR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsUtcStamp()}`,
    `DTSTART;VALUE=DATE:${d0}`,
    `DTEND;VALUE=DATE:${d1}`,
    `SUMMARY:${escapeIcsText(session.title.trim())}`,
  ];
  if (loc) lines.push(`LOCATION:${escapeIcsText(loc)}`);
  if (desc) lines.push(`DESCRIPTION:${desc}`);
  lines.push("END:VEVENT", "END:VCALENDAR");

  const ics = lines.join("\r\n") + "\r\n";
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe =
    filenameHint ??
    `session-${session.title.replace(/\s+/g, "_").slice(0, 32)}-${session.date}`;
  a.download = `${safe}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
