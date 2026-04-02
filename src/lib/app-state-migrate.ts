import type { AppState } from "./types";

export const APP_STATE_SCHEMA_VERSION = 1;

/**
 * Normalise un état chargé (localStorage ou import) vers le schéma courant.
 * Ajouter ici des branches `if (v < N)` lors des évolutions de schéma.
 */
export function migrateAppState(state: AppState): AppState {
  const v = state.schemaVersion ?? 0;
  let next: AppState = { ...state };
  if (v < 1) {
    /* schéma initial : rien à transformer pour l’instant */
  }
  return { ...next, schemaVersion: APP_STATE_SCHEMA_VERSION };
}
