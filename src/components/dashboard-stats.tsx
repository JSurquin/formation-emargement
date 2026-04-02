"use client";

import {
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  PenLine,
  Star,
} from "lucide-react";
import type { DashboardStats as DashboardStatsModel } from "@/lib/dashboard-stats";
import { Card, CardContent } from "@/components/ui/card";

type DashboardStatsProps = {
  stats: DashboardStatsModel;
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  const cards = [
    {
      label: "Sessions actives",
      value: stats.activeSessions,
      hint:
        stats.archivedSessions > 0
          ? `${stats.archivedSessions} archivée(s) · ${stats.sessionCount} au total`
          : `${stats.sessionCount} au total`,
      icon: CalendarDays,
    },
    {
      label: "Ce mois-ci",
      value: stats.sessionsThisMonth,
      hint: "sessions planifiées",
      icon: CalendarDays,
    },
    {
      label: "Annuaire",
      value: stats.studentCount,
      hint: "élèves",
      icon: GraduationCap,
    },
    {
      label: "Signatures",
      value:
        stats.pctSignatures === null ? "—" : `${stats.pctSignatures} %`,
      hint:
        stats.totalSignatureSlots === 0
          ? "aucun créneau (sessions actives)"
          : `${stats.signedSlots} / ${stats.totalSignatureSlots} créneaux`,
      icon: PenLine,
    },
    {
      label: "Feuilles complètes",
      value: stats.completeSheets,
      hint: "sessions actives, tous signés",
      icon: CheckCircle2,
    },
    {
      label: "Favoris",
      value: stats.favoriteSessions,
      hint: "sessions épinglées",
      icon: Star,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map(({ label, value, hint, icon: Icon }) => (
        <Card key={label} className="dg-surface ring-0">
          <CardContent className="flex items-start gap-3 p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-violet-500/20 dark:text-violet-200">
              <Icon className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 break-words font-heading text-2xl font-bold tabular-nums tracking-tight">
                {value}
              </p>
              <p className="break-words text-xs text-muted-foreground">{hint}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
