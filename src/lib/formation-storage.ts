import type { AppState, SessionTemplate } from "./types";
import {
  APP_STATE_SCHEMA_VERSION,
  migrateAppState,
} from "./app-state-migrate";

export { APP_STATE_SCHEMA_VERSION, migrateAppState } from "./app-state-migrate";

function normalizeTemplates(raw: unknown): SessionTemplate[] {
  if (!Array.isArray(raw)) return [];
  const out: SessionTemplate[] = [];
  for (const t of raw) {
    if (
      t &&
      typeof t === "object" &&
      typeof (t as SessionTemplate).id === "string" &&
      typeof (t as SessionTemplate).name === "string" &&
      Array.isArray((t as SessionTemplate).studentIds) &&
      (t as SessionTemplate).studentIds.every((id) => typeof id === "string")
    ) {
      out.push(t as SessionTemplate);
    }
  }
  return out;
}

export const FORMATION_STORAGE_KEY = "digiforma-like-state-v1";

export const defaultAppState: AppState = {
  schemaVersion: APP_STATE_SCHEMA_VERSION,
  students: [],
  sessions: [],
  organizationName: "",
  noteSnippets: [],
  sessionTemplates: [],
};

export function loadAppState(): AppState {
  if (typeof window === "undefined") return defaultAppState;
  try {
    const raw = localStorage.getItem(FORMATION_STORAGE_KEY);
    if (!raw) return defaultAppState;
    const parsed = JSON.parse(raw) as AppState;
    if (!parsed.students || !parsed.sessions) return defaultAppState;
    const merged: AppState = {
      ...defaultAppState,
      ...parsed,
      organizationName: parsed.organizationName ?? "",
      noteSnippets: Array.isArray(parsed.noteSnippets)
        ? parsed.noteSnippets.filter((x) => typeof x === "string")
        : [],
      sessionTemplates: normalizeTemplates(parsed.sessionTemplates),
    };
    return migrateAppState(merged);
  } catch {
    return defaultAppState;
  }
}

export type SaveAppStateResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unknown" };

export function saveAppState(state: AppState): SaveAppStateResult {
  if (typeof window === "undefined") return { ok: true };
  const toSave: AppState = {
    ...state,
    schemaVersion: APP_STATE_SCHEMA_VERSION,
  };
  try {
    localStorage.setItem(FORMATION_STORAGE_KEY, JSON.stringify(toSave));
    return { ok: true };
  } catch (e) {
    const isQuota =
      e instanceof DOMException && e.name === "QuotaExceededError";
    return { ok: false, reason: isQuota ? "quota" : "unknown" };
  }
}
