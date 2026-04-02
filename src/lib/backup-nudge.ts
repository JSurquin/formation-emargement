const QUIET_UNTIL_KEY = "digiforma-backup-quiet-until-ts";
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Repousse le prochain rappel de sauvegarde d’une semaine (export, fermeture du toast, etc.). */
export function postponeBackupNudge(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(QUIET_UNTIL_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function shouldShowBackupNudge(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(QUIET_UNTIL_KEY);
    if (!raw) return true;
    const t = Number(raw);
    if (Number.isNaN(t)) return true;
    return Date.now() - t >= WEEK_MS;
  } catch {
    return false;
  }
}
