import type { StudentAttendanceRow } from "./student-aggregates";
import type { Student, TrainingSession } from "./types";

function csvCell(s: string) {
  const t = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (/[";,\n]/.test(t)) return `"${t.replace(/"/g, '""')}"`;
  return t;
}

function downloadText(content: string, filename: string, mime: string) {
  const blob = new Blob(["\ufeff", content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportStudentsCsv(students: Student[], filename: string) {
  const header = ["Prénom", "Nom", "E-mail", "Téléphone", "Structure"]
    .map(csvCell)
    .join(";");
  const rows = students.map((s) =>
    [
      s.firstName,
      s.lastName,
      s.email ?? "",
      s.phone ?? "",
      s.company ?? "",
    ]
      .map(csvCell)
      .join(";"),
  );
  downloadText([header, ...rows].join("\n"), filename, "text/csv;charset=utf-8");
}

export function exportSessionsInventoryCsv(
  sessions: TrainingSession[],
  filename: string,
) {
  const header = [
    "Intitulé",
    "Date",
    "Lieu",
    "Formateur",
    "Étiquettes",
    "Nb élèves",
    "Sign. matin",
    "Sign. après-midi",
    "Favori",
    "Id",
  ]
    .map(csvCell)
    .join(";");
  const rows = sessions.map((s) => {
    let sm = 0;
    let sa = 0;
    for (const id of s.studentIds) {
      if (s.attendance.morning[id]?.signatureDataUrl) sm++;
      if (s.attendance.afternoon[id]?.signatureDataUrl) sa++;
    }
    return [
      s.title,
      s.date,
      s.location ?? "",
      s.trainer ?? "",
      (s.tags ?? []).join("|"),
      String(s.studentIds.length),
      String(sm),
      String(sa),
      s.favorited ? "oui" : "non",
      s.id,
    ]
      .map(csvCell)
      .join(";");
  });
  downloadText([header, ...rows].join("\n"), filename, "text/csv;charset=utf-8");
}

export function exportStudentStatsCsv(
  rows: StudentAttendanceRow[],
  filename: string,
) {
  const header = [
    "Prénom",
    "Nom",
    "E-mail",
    "Sessions",
    "Créneaux signés",
    "Créneaux possibles",
    "Taux %",
  ]
    .map(csvCell)
    .join(";");
  const lines = rows.map((r) =>
    [
      r.student.firstName,
      r.student.lastName,
      r.student.email ?? "",
      String(r.sessionsCount),
      String(r.signedSlots),
      String(r.possibleSlots),
      r.pct === null ? "" : String(r.pct),
    ]
      .map(csvCell)
      .join(";"),
  );
  downloadText([header, ...lines].join("\n"), filename, "text/csv;charset=utf-8");
}

export function exportSessionAttendanceCsv(
  session: TrainingSession,
  students: Student[],
  filename: string,
) {
  const byId = new Map(students.map((s) => [s.id, s]));
  const header = [
    "Prénom",
    "Nom",
    "E-mail",
    "Téléphone",
    "Structure",
    "Matin présent",
    "Matin signé",
    "Après-midi présent",
    "Après-midi signé",
  ]
    .map(csvCell)
    .join(";");

  const rows: string[] = [];
  for (const sid of session.studentIds) {
    const st = byId.get(sid);
    const m = session.attendance.morning[sid];
    const a = session.attendance.afternoon[sid];
    rows.push(
      [
        st?.firstName ?? "",
        st?.lastName ?? "",
        st?.email ?? "",
        st?.phone ?? "",
        st?.company ?? "",
        m?.present ? "oui" : "non",
        m?.signatureDataUrl ? "oui" : "non",
        a?.present ? "oui" : "non",
        a?.signatureDataUrl ? "oui" : "non",
      ]
        .map(csvCell)
        .join(";"),
    );
  }

  downloadText([header, ...rows].join("\n"), filename, "text/csv;charset=utf-8");
}
