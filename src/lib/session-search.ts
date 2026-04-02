import type { TrainingSession } from "./types";

function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

export function filterSessionsByQuery(
  sessions: TrainingSession[],
  rawQuery: string,
): TrainingSession[] {
  const q = fold(rawQuery);
  if (!q) return sessions;
  const tokens = q.split(/\s+/).filter(Boolean);
  return sessions.filter((sess) => {
    const blob = fold(
      [
        sess.title,
        sess.date,
        sess.notes ?? "",
        (sess.tags ?? []).join(" "),
        sess.favorited ? "favori" : "",
        sess.location ?? "",
        sess.trainer ?? "",
        String(sess.studentIds.length),
      ].join(" "),
    );
    return tokens.every((t) => blob.includes(t));
  });
}
