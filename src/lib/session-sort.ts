import type { TrainingSession } from "./types";

export type SessionSortMode =
  | "date-desc"
  | "date-asc"
  | "title"
  | "favorites-first";

export function sortSessions(
  sessions: TrainingSession[],
  mode: SessionSortMode,
): TrainingSession[] {
  const arr = [...sessions];
  const tie = (a: TrainingSession, b: TrainingSession) =>
    a.id.localeCompare(b.id);

  switch (mode) {
    case "date-desc":
      return arr.sort(
        (a, b) => b.date.localeCompare(a.date) || tie(a, b),
      );
    case "date-asc":
      return arr.sort(
        (a, b) => a.date.localeCompare(b.date) || tie(a, b),
      );
    case "title":
      return arr.sort(
        (a, b) => a.title.localeCompare(b.title, "fr") || tie(a, b),
      );
    case "favorites-first":
      return arr.sort((a, b) => {
        const fa = a.favorited ? 1 : 0;
        const fb = b.favorited ? 1 : 0;
        if (fb !== fa) return fb - fa;
        return b.date.localeCompare(a.date) || tie(a, b);
      });
    default:
      return arr;
  }
}
