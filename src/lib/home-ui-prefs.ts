import type { SessionSortMode } from "./session-sort";

const KEY = "digiforma-home-ui-v1";

export type HomeUiPrefs = {
  sortMode: SessionSortMode;
  archiveListFilter: "all" | "active" | "archived";
  favoritesOnly: boolean;
  incompleteOnly: boolean;
  dateFrom: string;
  dateTo: string;
};

const defaults: HomeUiPrefs = {
  sortMode: "date-desc",
  archiveListFilter: "all",
  favoritesOnly: false,
  incompleteOnly: false,
  dateFrom: "",
  dateTo: "",
};

export function loadHomeUiPrefs(): HomeUiPrefs {
  if (typeof window === "undefined") return { ...defaults };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const p = JSON.parse(raw) as Partial<HomeUiPrefs>;
    const sortMode =
      p.sortMode === "date-desc" ||
      p.sortMode === "date-asc" ||
      p.sortMode === "title" ||
      p.sortMode === "favorites-first"
        ? p.sortMode
        : defaults.sortMode;
    const archiveListFilter =
      p.archiveListFilter === "all" ||
      p.archiveListFilter === "active" ||
      p.archiveListFilter === "archived"
        ? p.archiveListFilter
        : defaults.archiveListFilter;
    return {
      sortMode,
      archiveListFilter,
      favoritesOnly: p.favoritesOnly === true,
      incompleteOnly: p.incompleteOnly === true,
      dateFrom: typeof p.dateFrom === "string" ? p.dateFrom : "",
      dateTo: typeof p.dateTo === "string" ? p.dateTo : "",
    };
  } catch {
    return { ...defaults };
  }
}

export function saveHomeUiPrefs(prefs: HomeUiPrefs): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}
