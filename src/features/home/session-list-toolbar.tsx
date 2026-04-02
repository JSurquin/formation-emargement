"use client";

import * as React from "react";
import { Archive, ArchiveRestore } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { SessionSortMode } from "@/lib/session-sort";
import {
  applySessionDatePreset,
  SESSION_DATE_PRESETS,
} from "@/lib/session-date-presets";
import type { ArchiveListFilter } from "./use-home-session-list";

type Props = {
  archiveListFilter: ArchiveListFilter;
  setArchiveListFilter: (v: ArchiveListFilter) => void;
  sortMode: SessionSortMode;
  setSortMode: (v: SessionSortMode) => void;
  tagFilter: string;
  setTagFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  favoritesOnly: boolean;
  setFavoritesOnly: (v: boolean) => void;
  incompleteOnly: boolean;
  setIncompleteOnly: (v: boolean) => void;
  idsToArchiveInList: string[];
  idsToUnarchiveInList: string[];
  bulkSetSessionsArchived: (ids: string[], archived: boolean) => void;
  onConfirmBulk: (opts: {
    title: string;
    description: string;
    confirmLabel: string;
  }) => Promise<boolean>;
};

export function SessionListToolbar({
  archiveListFilter,
  setArchiveListFilter,
  sortMode,
  setSortMode,
  tagFilter,
  setTagFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  favoritesOnly,
  setFavoritesOnly,
  incompleteOnly,
  setIncompleteOnly,
  idsToArchiveInList,
  idsToUnarchiveInList,
  bulkSetSessionsArchived,
  onConfirmBulk,
}: Props) {
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4 dark:border-white/10 dark:bg-black/20 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="grid min-w-[220px] flex-1 gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Archivage
        </span>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "all" as const, label: "Toutes" },
              { id: "active" as const, label: "Actives" },
              { id: "archived" as const, label: "Archives" },
            ] as const
          ).map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant={archiveListFilter === id ? "secondary" : "outline"}
              className={cn(
                "h-9 rounded-full px-3 text-xs",
                archiveListFilter === id &&
                  "border-indigo-300/80 bg-indigo-100/90 text-indigo-950 dark:border-violet-500/40 dark:bg-violet-500/25 dark:text-violet-50",
              )}
              onClick={() => setArchiveListFilter(id)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>
      <div className="grid min-w-[180px] flex-1 gap-2">
        <Label htmlFor="session-sort" className="text-xs uppercase tracking-wide">
          Tri
        </Label>
        <select
          id="session-sort"
          value={sortMode}
          onChange={(e) => setSortMode(e.target.value as SessionSortMode)}
          className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          <option value="date-desc">Date (récent d’abord)</option>
          <option value="date-asc">Date (ancien d’abord)</option>
          <option value="title">Intitulé (A → Z)</option>
          <option value="favorites-first">Favoris en tête</option>
        </select>
      </div>
      <div className="grid min-w-[160px] flex-1 gap-2">
        <Label htmlFor="tag-filter" className="text-xs uppercase tracking-wide">
          Filtre étiquette
        </Label>
        <Input
          id="tag-filter"
          placeholder="ex. Paris"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="bg-background/80"
        />
      </div>
      <div className="grid min-w-[150px] flex-1 gap-2">
        <Label htmlFor="date-from" className="text-xs uppercase tracking-wide">
          Du
        </Label>
        <Input
          id="date-from"
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="bg-background/80"
        />
      </div>
      <div className="grid min-w-[150px] flex-1 gap-2">
        <Label htmlFor="date-to" className="text-xs uppercase tracking-wide">
          Au
        </Label>
        <Input
          id="date-to"
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="bg-background/80"
        />
      </div>
      <div className="flex w-full min-w-0 flex-col gap-1.5 sm:max-w-md">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Périodes rapides
        </span>
        <div className="flex flex-wrap gap-1.5">
          {SESSION_DATE_PRESETS.map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-2.5 text-xs"
              onClick={() => {
                const { dateFrom: df, dateTo: dt } = applySessionDatePreset(
                  id,
                );
                setDateFrom(df);
                setDateTo(dt);
              }}
            >
              {label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 rounded-full px-2.5 text-xs text-muted-foreground"
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
          >
            Effacer dates
          </Button>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
        <Checkbox
          checked={favoritesOnly}
          onCheckedChange={(v) => setFavoritesOnly(v === true)}
        />
        Favoris uniquement
      </label>
      <label className="flex max-w-[220px] cursor-pointer items-center gap-2 pb-2 text-sm">
        <Checkbox
          checked={incompleteOnly}
          onCheckedChange={(v) => setIncompleteOnly(v === true)}
        />
        Signatures à compléter
      </label>
      {idsToArchiveInList.length > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-full border-dashed text-xs"
          onClick={async () => {
            const n = idsToArchiveInList.length;
            const ok = await onConfirmBulk({
              title: "Archiver plusieurs sessions",
              description: `Archiver les ${n} session(s) actuellement listée(s) ?`,
              confirmLabel: "Archiver",
            });
            if (!ok) return;
            bulkSetSessionsArchived(idsToArchiveInList, true);
            toast.success(`${n} session(s) archivée(s).`);
          }}
        >
          <Archive className="mr-1 size-3.5" />
          Archiver la liste ({idsToArchiveInList.length})
        </Button>
      ) : null}
      {idsToUnarchiveInList.length > 0 ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-9 rounded-full border-dashed text-xs"
          onClick={async () => {
            const n = idsToUnarchiveInList.length;
            const ok = await onConfirmBulk({
              title: "Désarchiver plusieurs sessions",
              description: `Désarchiver les ${n} session(s) actuellement listée(s) ?`,
              confirmLabel: "Désarchiver",
            });
            if (!ok) return;
            bulkSetSessionsArchived(idsToUnarchiveInList, false);
            toast.success(`${n} session(s) désarchivée(s).`);
          }}
        >
          <ArchiveRestore className="mr-1 size-3.5" />
          Désarchiver la liste ({idsToUnarchiveInList.length})
        </Button>
      ) : null}
    </div>
  );
}
