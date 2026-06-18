import type { AppState } from "./types";

export const APP_STATE_SCHEMA_VERSION = 3;

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
  if (v < 2) {
    next = {
      ...next,
      students: next.students.map((s) => ({
        ...s,
        socialSecurityNumber: s.socialSecurityNumber?.trim() || undefined,
        documents: s.documents?.length ? s.documents : undefined,
      })),
    };
  }
  if (v < 3) {
    next = {
      ...next,
      students: next.students.map((s) => ({
        ...s,
        fundingMethod: s.fundingMethod || undefined,
      })),
    };
  }
  return { ...next, schemaVersion: APP_STATE_SCHEMA_VERSION };
}
