import { FORMATION_STORAGE_KEY } from "./formation-storage";

/** Taille approximative occupée par la sauvegarde locale (octets UTF-8). */
export function getFormationStorageByteSize(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem(FORMATION_STORAGE_KEY);
    if (!raw) return 0;
    return new Blob([raw]).size;
  } catch {
    return 0;
  }
}

export function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} Mo`;
}
