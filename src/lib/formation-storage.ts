import type { AppState, SessionTemplate, TrainingCatalogEntry } from "./types";
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

function normalizeTrainingCatalog(raw: unknown): TrainingCatalogEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: TrainingCatalogEntry[] = [];
  for (const item of raw) {
    if (
      item &&
      typeof item === "object" &&
      typeof (item as TrainingCatalogEntry).id === "string" &&
      typeof (item as TrainingCatalogEntry).title === "string"
    ) {
      out.push(item as TrainingCatalogEntry);
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
  trainingCatalog: [],
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
      trainingCatalog: normalizeTrainingCatalog(parsed.trainingCatalog),
    };
    return migrateAppState(merged);
  } catch {
    return defaultAppState;
  }
}

export type SaveAppStateResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "network" | "unknown" };

export async function loadAppStateFromApi(): Promise<
  AppState | { error: "network" | "unknown" }
> {
  try {
    const res = await fetch("/api/app-state", { cache: "no-store" });
    if (!res.ok) return { error: "unknown" };
    const parsed = (await res.json()) as AppState;
    if (!parsed.students || !parsed.sessions) return { error: "unknown" };
    const merged: AppState = {
      ...defaultAppState,
      ...parsed,
      organizationName: parsed.organizationName ?? "",
      noteSnippets: Array.isArray(parsed.noteSnippets)
        ? parsed.noteSnippets.filter((x) => typeof x === "string")
        : [],
      sessionTemplates: normalizeTemplates(parsed.sessionTemplates),
      trainingCatalog: normalizeTrainingCatalog(parsed.trainingCatalog),
    };
    return migrateAppState(merged);
  } catch {
    return { error: "network" };
  }
}

export async function saveAppStateToApi(
  state: AppState,
): Promise<SaveAppStateResult> {
  const toSave: AppState = {
    ...state,
    schemaVersion: APP_STATE_SCHEMA_VERSION,
  };
  try {
    const res = await fetch("/api/app-state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(toSave),
    });
    if (!res.ok) return { ok: false, reason: "unknown" };
    return { ok: true };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function isEmptyAppState(state: AppState): boolean {
  return (
    state.students.length === 0 &&
    state.sessions.length === 0 &&
    !(state.organizationName ?? "").trim()
  );
}

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
