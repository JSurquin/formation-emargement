import type { Student } from "./types";

export function downloadStudentsJson(
  students: Student[],
  filenameBase?: string,
): void {
  const safe =
    filenameBase ??
    `annuaire-${new Date().toISOString().slice(0, 10)}`;
  const blob = new Blob([JSON.stringify(students, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
