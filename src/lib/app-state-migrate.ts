import type { AppState } from "./types";

export const APP_STATE_SCHEMA_VERSION = 6;

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
  if (v < 4) {
    next = {
      ...next,
      students: next.students.map((s) => ({
        ...s,
        funderEmail: s.funderEmail?.trim() || undefined,
        conventionSignedAt: s.conventionSignedAt || undefined,
        conventionCreatedAt: s.conventionCreatedAt || undefined,
        presenceConfirmedForSessionId:
          s.presenceConfirmedForSessionId || undefined,
      })),
    };
  }
  if (v < 5) {
    next = {
      ...next,
      students: next.students.map((s) => ({
        ...s,
        funderName: s.funderName?.trim() || undefined,
        funderSiret: s.funderSiret?.replace(/\s/g, "") || undefined,
      })),
    };
  }
  if (v < 6) {
    next = {
      ...next,
      sessions: next.sessions.map((sess) => ({
        ...sess,
        attestationSignatures: sess.attestationSignatures ?? undefined,
      })),
    };
  }
  return { ...next, schemaVersion: APP_STATE_SCHEMA_VERSION };
}
