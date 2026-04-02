"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, FileDown, FileJson } from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import {
  Button,
  buttonVariants,
} from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { filterStudentsByQuery } from "@/lib/student-search";
import { computeStudentAttendanceRows } from "@/lib/student-aggregates";
import { exportStudentStatsCsv } from "@/lib/export-csv";
import { downloadStudentStatsJson } from "@/lib/export-stats-json";
import { useSlashFocus } from "@/hooks/use-slash-focus";

export default function StatistiquesPage() {
  const { state, hydrated } = useFormation();
  const [q, setQ] = React.useState("");

  const rows = React.useMemo(
    () => computeStudentAttendanceRows(state),
    [state],
  );

  const filtered = React.useMemo(() => {
    const byStudent = filterStudentsByQuery(
      rows.map((r) => r.student),
      q,
    );
    const ids = new Set(byStudent.map((s) => s.id));
    return rows.filter((r) => ids.has(r.student.id));
  }, [rows, q]);

  useSlashFocus("stats-search", hydrated);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Synthèse"
        title={
          <>
            <GradientAccent>Signatures</GradientAccent> par élève
          </>
        }
        description="Pour chaque fiche annuaire : nombre de sessions où l’élève figure, créneaux signés sur les créneaux possibles (2 par session : matin et après-midi). Données locales uniquement."
        actions={
          <div className="flex w-full flex-wrap gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              disabled={state.students.length === 0}
              onClick={() => {
                exportStudentStatsCsv(
                  rows,
                  `stats-signatures-${new Date().toISOString().slice(0, 10)}.csv`,
                );
                toast.success("Export CSV des statistiques téléchargé.");
              }}
            >
              <FileDown className="size-4" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2 rounded-full"
              disabled={filtered.length === 0}
              onClick={() => {
                downloadStudentStatsJson(
                  filtered,
                  Boolean(q.trim()),
                  `stats-signatures${q.trim() ? "-filtre" : ""}-${new Date().toISOString().slice(0, 10)}`,
                );
                toast.success(
                  q.trim()
                    ? `JSON téléchargé (${filtered.length} ligne(s) filtrées).`
                    : "JSON des statistiques téléchargé.",
                );
              }}
            >
              <FileJson className="size-4" />
              JSON{q.trim() ? " (vue)" : ""}
            </Button>
            <Link
              href="/"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "gap-2 rounded-full",
              )}
            >
              <ArrowLeft className="size-4" />
              Sessions
            </Link>
          </div>
        }
      />

      <Card className="dg-surface ring-0">
        <CardHeader className="space-y-4 border-b border-border/50 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Tableau — {state.students.length}{" "}
            {state.students.length > 1 ? "élèves" : "élève"}
          </CardTitle>
          <CardDescription>
            Touche / pour focus sur la recherche. Les élèves sans aucune session
            affichent 0 % jusqu’à ce qu’ils soient ajoutés sur une feuille.
          </CardDescription>
          {state.students.length > 0 ? (
            <ParticipantSearchInput
              id="stats-search"
              value={q}
              onChange={setQ}
              placeholder="Filtrer prénom, nom, e-mail…"
              aria-label="Filtrer le tableau des statistiques"
            />
          ) : null}
        </CardHeader>
        <CardContent className="p-0 sm:px-0">
          {state.students.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun élève dans l’annuaire.{" "}
              <Link
                href="/eleves"
                className="font-medium text-indigo-600 underline underline-offset-2 dark:text-violet-300"
              >
                Ajouter des élèves
              </Link>
              .
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            <div className="dg-table-scroll border-t border-border/80 dark:border-white/10">
            <Table className="min-w-[22rem]">
              <TableHeader>
                <TableRow className="border-border/60 hover:bg-transparent dark:border-white/10">
                  <TableHead className="pl-6 font-heading">Élève</TableHead>
                  <TableHead className="text-center font-heading">
                    Sessions
                  </TableHead>
                  <TableHead className="text-center font-heading">
                    Créneaux signés
                  </TableHead>
                  <TableHead className="pr-6 text-right font-heading">
                    Taux
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <TableRow
                    key={row.student.id}
                    className="border-border/50 dark:border-white/5"
                  >
                    <TableCell className="pl-6 font-medium">
                      {row.student.firstName} {row.student.lastName}
                      {row.student.email ? (
                        <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                          {row.student.email}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-center tabular-nums">
                      {row.sessionsCount}
                    </TableCell>
                    <TableCell className="text-center tabular-nums text-muted-foreground">
                      {row.signedSlots} / {row.possibleSlots}
                    </TableCell>
                    <TableCell className="pr-6 text-right font-medium tabular-nums text-indigo-700 dark:text-violet-300">
                      {row.pct === null ? "—" : `${row.pct} %`}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
