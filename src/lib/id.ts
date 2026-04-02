/** Identifiant unique pour élèves, sessions, modèles… */
export function newId(): string {
  return crypto.randomUUID();
}
