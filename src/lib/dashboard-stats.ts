import type { AppState } from "./types";

export type DashboardStats = {
  sessionCount: number;
  activeSessions: number;
  archivedSessions: number;
  studentCount: number;
  sessionsThisMonth: number;
  /** % des créneaux signature matin+aprem remplis (0–100), ou null si aucun créneau. */
  pctSignatures: number | null;
  signedSlots: number;
  totalSignatureSlots: number;
  /** Sessions avec au moins un élève et signatures matin+aprem pour tous. */
  completeSheets: number;
  /** Sessions marquées favorites. */
  favoriteSessions: number;
};

export function computeDashboardStats(state: AppState): DashboardStats {
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const sessionsThisMonth = state.sessions.filter((s) =>
    s.date.startsWith(ym),
  ).length;

  let signedSlots = 0;
  let totalSignatureSlots = 0;
  let completeSheets = 0;

  const activeSessionsList = state.sessions.filter((s) => !s.archived);

  for (const sess of activeSessionsList) {
    const n = sess.studentIds.length;
    if (n === 0) continue;
    totalSignatureSlots += n * 2;
    let sheetComplete = true;
    for (const id of sess.studentIds) {
      const m = sess.attendance.morning[id]?.signatureDataUrl;
      const a = sess.attendance.afternoon[id]?.signatureDataUrl;
      if (m) signedSlots++;
      else sheetComplete = false;
      if (a) signedSlots++;
      else sheetComplete = false;
    }
    if (sheetComplete) completeSheets++;
  }

  const pctSignatures =
    totalSignatureSlots > 0
      ? Math.round((100 * signedSlots) / totalSignatureSlots)
      : null;

  const favoriteSessions = state.sessions.filter((s) => s.favorited).length;
  const activeSessions = activeSessionsList.length;
  const archivedSessions = state.sessions.length - activeSessions;

  return {
    sessionCount: state.sessions.length,
    activeSessions,
    archivedSessions,
    studentCount: state.students.length,
    sessionsThisMonth,
    pctSignatures,
    signedSlots,
    totalSignatureSlots,
    completeSheets,
    favoriteSessions,
  };
}
