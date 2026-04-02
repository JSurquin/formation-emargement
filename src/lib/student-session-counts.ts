import type { TrainingSession } from "./types";

/** Nombre de feuilles sur lesquelles chaque élève apparaît. */
export function countSessionsPerStudent(
  sessions: TrainingSession[],
): Map<string, number> {
  const map = new Map<string, number>();
  for (const sess of sessions) {
    for (const id of sess.studentIds) {
      map.set(id, (map.get(id) ?? 0) + 1);
    }
  }
  return map;
}
