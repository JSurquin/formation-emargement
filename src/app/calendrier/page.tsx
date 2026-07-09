"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  buildMonthGrid,
  CALENDAR_WEEKDAY_LABELS,
  countSessionsInMonth,
} from "@/lib/global-calendar";

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export default function CalendrierPage() {
  const { state, hydrated } = useFormation();
  const today = new Date();
  const [year, setYear] = React.useState(today.getFullYear());
  const [month, setMonth] = React.useState(today.getMonth() + 1);

  const grid = React.useMemo(
    () => buildMonthGrid(state.sessions, year, month),
    [state.sessions, year, month],
  );

  const sessionCount = React.useMemo(
    () => countSessionsInMonth(state.sessions, year, month),
    [state.sessions, year, month],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  const todayIso = today.toISOString().slice(0, 10);

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Vue d’ensemble"
        title={
          <>
            Calendrier <GradientAccent>global</GradientAccent>
          </>
        }
        description="Toutes les sessions de l’organisme sur un mois — complément au planning formateur (sessions assignées)."
        actions={
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Sessions
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full")}
            aria-label="Mois précédent"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </button>
          <h2 className="min-w-[10rem] text-center font-heading text-lg font-semibold capitalize">
            {monthLabel(year, month)}
          </h2>
          <button
            type="button"
            className={cn(buttonVariants({ variant: "outline", size: "icon" }), "rounded-full")}
            aria-label="Mois suivant"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
        <Badge variant="secondary" className="rounded-full">
          {sessionCount} session{sessionCount > 1 ? "s" : ""} ce mois
        </Badge>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/60 bg-card/50 dark:border-white/10">
        <div className="grid min-w-[40rem] grid-cols-7 border-b border-border/60 dark:border-white/10">
          {CALENDAR_WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="px-2 py-2 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              {label}
            </div>
          ))}
        </div>
        <div className="grid min-w-[40rem] grid-cols-7">
          {grid.map((cell) => (
            <div
              key={cell.date}
              className={cn(
                "min-h-[5.5rem] border-b border-r border-border/40 p-1.5 dark:border-white/5",
                !cell.inMonth && "bg-muted/20",
                cell.date === todayIso &&
                  "bg-indigo-500/5 ring-1 ring-inset ring-indigo-500/30",
              )}
            >
              <p
                className={cn(
                  "mb-1 text-right text-xs font-medium",
                  cell.inMonth ? "text-foreground" : "text-muted-foreground/60",
                )}
              >
                {cell.dayOfMonth}
              </p>
              <ul className="space-y-0.5">
                {cell.sessions.slice(0, 3).map((sess) => (
                  <li key={sess.id}>
                    <Link
                      href={`/sessions/${sess.id}`}
                      className={cn(
                        "block truncate rounded px-1 py-0.5 text-[10px] leading-tight transition-colors hover:bg-indigo-500/15",
                        sess.archived
                          ? "text-muted-foreground line-through"
                          : "bg-indigo-500/10 text-indigo-800 dark:text-violet-200",
                      )}
                      title={sess.title}
                    >
                      {sess.title}
                    </Link>
                  </li>
                ))}
                {cell.sessions.length > 3 ? (
                  <li className="px-1 text-[10px] text-muted-foreground">
                    +{cell.sessions.length - 3} autre
                    {cell.sessions.length - 3 > 1 ? "s" : ""}
                  </li>
                ) : null}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
