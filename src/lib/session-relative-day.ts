/**
 * Libellé relatif à aujourd’hui pour une date de session (YYYY-MM-DD, fuseau local).
 */
export function formatSessionRelativeDay(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) return "Aujourd’hui";
  if (diffDays === 1) return "Demain";
  if (diffDays === -1) return "Hier";
  if (diffDays > 1 && diffDays <= 7) return `Dans ${diffDays} jours`;
  if (diffDays < -1 && diffDays >= -7) return `Il y a ${-diffDays} jours`;
  if (diffDays > 7 && diffDays <= 14) return "Dans 2 semaines";
  if (diffDays < -7 && diffDays >= -14) return "La semaine dernière";
  if (diffDays > 0) return `Dans ${diffDays} j`;
  return `Il y a ${-diffDays} j`;
}

export type SessionDateProximity = "past" | "today" | "future";

export function getSessionDateProximity(isoDate: string): SessionDateProximity {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "past";
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  if (diffMs < 0) return "past";
  if (diffMs === 0) return "today";
  return "future";
}
