import type { AppState } from "./types";

const SNAPSHOT_KEY = "digiforma-like-emergency-v1";

export type EmergencySnapshot = {
  savedAt: string;
  state: AppState;
};

export function saveEmergencySnapshot(state: AppState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: EmergencySnapshot = {
      savedAt: new Date().toISOString(),
      state: JSON.parse(JSON.stringify(state)) as AppState,
    };
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / stringify errors */
  }
}

export function loadEmergencySnapshot(): EmergencySnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as EmergencySnapshot;
    if (
      !p?.state ||
      !Array.isArray(p.state.students) ||
      !Array.isArray(p.state.sessions)
    ) {
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function clearEmergencySnapshot(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SNAPSHOT_KEY);
}
