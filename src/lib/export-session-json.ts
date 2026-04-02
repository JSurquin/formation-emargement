import type { Student, TrainingSession } from "./types";

export type SessionJsonBundle = {
  version: 1;
  exportedAt: string;
  session: TrainingSession;
  /** Uniquement les fiches présentes sur la feuille. */
  students: Student[];
};

export function downloadSessionJsonBundle(
  session: TrainingSession,
  allStudents: Student[],
  filenameHint?: string,
): void {
  const idSet = new Set(session.studentIds);
  const students = allStudents.filter((s) => idSet.has(s.id));
  const bundle: SessionJsonBundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    session,
    students,
  };
  const safe =
    filenameHint ??
    `session-${session.title.replace(/\s+/g, "_").slice(0, 36)}-${session.date}`;
  const blob = new Blob([JSON.stringify(bundle, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
