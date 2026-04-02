"use client";

import * as React from "react";
import type { TrainingSession } from "@/lib/types";
import { loadHomeUiPrefs, saveHomeUiPrefs } from "@/lib/home-ui-prefs";
import { filterSessionsByQuery } from "@/lib/session-search";
import { getSessionSignatureSummary } from "@/lib/session-signature";
import type { SessionSortMode } from "@/lib/session-sort";
import { sortSessions } from "@/lib/session-sort";

export type ArchiveListFilter = "all" | "active" | "archived";

export function useHomeSessionList(
  sessions: TrainingSession[],
  hydrated: boolean,
) {
  const [sessionListSearch, setSessionListSearch] = React.useState("");
  const [sortMode, setSortMode] = React.useState<SessionSortMode>("date-desc");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [archiveListFilter, setArchiveListFilter] =
    React.useState<ArchiveListFilter>("all");
  const [incompleteOnly, setIncompleteOnly] = React.useState(false);
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [tagFilter, setTagFilter] = React.useState("");
  const [homePrefsLoaded, setHomePrefsLoaded] = React.useState(false);

  const sessionsScoped = React.useMemo(() => {
    let list = sessions;
    if (archiveListFilter === "active") {
      list = list.filter((s) => !s.archived);
    } else if (archiveListFilter === "archived") {
      list = list.filter((s) => s.archived);
    }
    const df = dateFrom.trim();
    const dt = dateTo.trim();
    if (df) list = list.filter((s) => s.date >= df);
    if (dt) list = list.filter((s) => s.date <= dt);
    if (incompleteOnly) {
      list = list.filter((s) => {
        const sig = getSessionSignatureSummary(s);
        return sig.n > 0 && sig.incompleteSignatures;
      });
    }
    return list;
  }, [sessions, archiveListFilter, dateFrom, dateTo, incompleteOnly]);

  const archiveScopeCount = sessionsScoped.length;

  const sessionsDisplayed = React.useMemo(() => {
    let list = filterSessionsByQuery(sessionsScoped, sessionListSearch);
    if (favoritesOnly) {
      list = list.filter((s) => s.favorited);
    }
    const tf = tagFilter.trim().toLowerCase();
    if (tf) {
      list = list.filter((s) =>
        (s.tags ?? []).some((t) => t.toLowerCase().includes(tf)),
      );
    }
    return sortSessions(list, sortMode);
  }, [
    sessionsScoped,
    sessionListSearch,
    favoritesOnly,
    tagFilter,
    sortMode,
  ]);

  React.useEffect(() => {
    if (!hydrated) return;
    const p = loadHomeUiPrefs();
    setSortMode(p.sortMode);
    setArchiveListFilter(p.archiveListFilter);
    setFavoritesOnly(p.favoritesOnly);
    setIncompleteOnly(p.incompleteOnly);
    setDateFrom(p.dateFrom);
    setDateTo(p.dateTo);
    setHomePrefsLoaded(true);
  }, [hydrated]);

  React.useEffect(() => {
    if (!hydrated || !homePrefsLoaded) return;
    saveHomeUiPrefs({
      sortMode,
      archiveListFilter,
      favoritesOnly,
      incompleteOnly,
      dateFrom,
      dateTo,
    });
  }, [
    hydrated,
    homePrefsLoaded,
    sortMode,
    archiveListFilter,
    favoritesOnly,
    incompleteOnly,
    dateFrom,
    dateTo,
  ]);

  const idsToArchiveInList = React.useMemo(
    () => sessionsDisplayed.filter((s) => !s.archived).map((s) => s.id),
    [sessionsDisplayed],
  );
  const idsToUnarchiveInList = React.useMemo(
    () => sessionsDisplayed.filter((s) => s.archived).map((s) => s.id),
    [sessionsDisplayed],
  );

  return {
    sessionListSearch,
    setSessionListSearch,
    sortMode,
    setSortMode,
    favoritesOnly,
    setFavoritesOnly,
    archiveListFilter,
    setArchiveListFilter,
    incompleteOnly,
    setIncompleteOnly,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    tagFilter,
    setTagFilter,
    sessionsScoped,
    archiveScopeCount,
    sessionsDisplayed,
    idsToArchiveInList,
    idsToUnarchiveInList,
  };
}
