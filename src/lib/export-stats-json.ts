import type { StudentAttendanceRow } from "./student-aggregates";

export type StatsJsonExport = {
  version: 1;
  exportedAt: string;
  filteredBySearch: boolean;
  rows: {
    firstName: string;
    lastName: string;
    email?: string;
    sessionsCount: number;
    signedSlots: number;
    possibleSlots: number;
    pct: number | null;
  }[];
};

export function downloadStudentStatsJson(
  rows: StudentAttendanceRow[],
  searchActive: boolean,
  filenameBase?: string,
): void {
  const payload: StatsJsonExport = {
    version: 1,
    exportedAt: new Date().toISOString(),
    filteredBySearch: searchActive,
    rows: rows.map((r) => ({
      firstName: r.student.firstName,
      lastName: r.student.lastName,
      email: r.student.email,
      sessionsCount: r.sessionsCount,
      signedSlots: r.signedSlots,
      possibleSlots: r.possibleSlots,
      pct: r.pct,
    })),
  };
  const safe =
    filenameBase ?? `stats-signatures-${new Date().toISOString().slice(0, 10)}`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${safe}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
