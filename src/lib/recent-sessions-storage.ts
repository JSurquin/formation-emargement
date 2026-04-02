const STORAGE_KEY = "digiforma-recent-session-ids";
const MAX_IDS = 6;

export const RECENT_SESSIONS_CHANGED_EVENT = "digiforma-recent-sessions-changed";

export function recordRecentSessionOpened(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const prev: unknown = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(prev)
      ? prev.filter((x): x is string => typeof x === "string")
      : [];
    const next = [id, ...list.filter((x) => x !== id)].slice(0, MAX_IDS);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_SESSIONS_CHANGED_EVENT));
  } catch {
    /* sessionStorage indisponible ou quota */
  }
}

export function readRecentSessionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return [];
  }
}
