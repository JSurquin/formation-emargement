"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  FileText,
  Printer,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { listCreatedConventions } from "@/lib/convention-list";
import { formatFrenchDateTimeShort } from "@/lib/date-format";
import { getFundingMethodLabel } from "@/lib/funding-method";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import {
  StudentProfilePrint,
  type StudentProfilePrintMode,
} from "@/components/student-profile-print";

export default function ConventionsPage() {
  const { state, hydrated, updateStudent } = useFormation();
  const [q, setQ] = React.useState("");
  const [printTarget, setPrintTarget] = React.useState<{
    studentId: string;
    mode: StudentProfilePrintMode;
  } | null>(null);

  const rows = React.useMemo(
    () => listCreatedConventions(state.students, state.sessions),
    [state.students, state.sessions],
  );

  const filtered = React.useMemo(() => {
    const byStudent = filterStudentsByQuery(
      rows.map((r) => r.student),
      q,
    );
    const ids = new Set(byStudent.map((s) => s.id));
    return rows.filter((r) => ids.has(r.student.id));
  }, [rows, q]);

  const printRow = React.useMemo(() => {
    if (!printTarget) return null;
    return rows.find((r) => r.student.id === printTarget.studentId) ?? null;
  }, [printTarget, rows]);

  React.useEffect(() => {
    if (!printTarget || !printRow) return;
    const reset = () => setPrintTarget(null);
    window.addEventListener("afterprint", reset);
    const t = window.setTimeout(() => window.print(), 80);
    return () => {
      window.removeEventListener("afterprint", reset);
      window.clearTimeout(t);
    };
  }, [printTarget, printRow]);

  useSlashFocus("conventions-search", hydrated);

  const triggerPrint = (studentId: string) => {
    const row = rows.find((r) => r.student.id === studentId);
    if (!row) return;
    if (!row.student.conventionCreatedAt) {
      updateStudent(studentId, {
        conventionCreatedAt: new Date().toISOString(),
      });
    }
    setPrintTarget({ studentId, mode: "convention" });
    toast.success(
      "Convention prête — choisissez « Enregistrer en PDF » dans la fenêtre d'impression si besoin.",
    );
  };

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
        eyebrow="Conventions"
        title={
          <>
            Vos <GradientAccent>conventions</GradientAccent> de formation
          </>
        }
        description="Retrouvez ici toutes les conventions générées depuis les fiches candidats. Vous pouvez rouvrir une fiche ou réimprimer le document en PDF."
        actions={
          <Link
            href="/eleves"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "gap-2 rounded-full",
            )}
          >
            <ArrowLeft className="size-4" />
            Annuaire élèves
          </Link>
        }
      />

      <Card className="dg-surface ring-0">
        <CardHeader className="space-y-4 border-b border-border/50 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <FileText className="size-4" />
            </span>
            Encart conventions — {rows.length}{" "}
            {rows.length > 1 ? "conventions" : "convention"}
          </CardTitle>
          <CardDescription>
            Une convention apparaît ici dès qu&apos;elle est créée ou imprimée
            depuis une fiche candidat. Touche / pour filtrer la liste.
          </CardDescription>
          {rows.length > 0 ? (
            <ParticipantSearchInput
              id="conventions-search"
              value={q}
              onChange={setQ}
              placeholder="Filtrer prénom, nom, financeur…"
              aria-label="Filtrer la liste des conventions"
            />
          ) : null}
        </CardHeader>
        <CardContent className="p-0 sm:px-0">
          {rows.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucune convention pour l&apos;instant. Ouvrez une{" "}
              <Link
                href="/eleves"
                className="font-medium text-indigo-600 underline underline-offset-2 dark:text-violet-300"
              >
                fiche candidat
              </Link>{" "}
              et cliquez sur « Créer la convention ».
            </p>
          ) : filtered.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-muted-foreground">
              Aucun résultat pour cette recherche.
            </p>
          ) : (
            <div className="dg-table-scroll border-t border-border/80 dark:border-white/10">
              <Table className="min-w-[36rem]">
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent dark:border-white/10">
                    <TableHead className="pl-6 font-heading">Candidat</TableHead>
                    <TableHead className="hidden font-heading md:table-cell">
                      Financement
                    </TableHead>
                    <TableHead className="hidden font-heading lg:table-cell">
                      Session
                    </TableHead>
                    <TableHead className="font-heading">Créée le</TableHead>
                    <TableHead className="text-center font-heading">
                      Statut
                    </TableHead>
                    <TableHead className="pr-6 text-right font-heading">
                      Actions
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
                        <Link
                          href={`/eleves/${row.student.id}`}
                          className="text-indigo-700 underline-offset-2 hover:underline dark:text-violet-200"
                        >
                          {row.student.firstName} {row.student.lastName}
                        </Link>
                        {row.student.funderName ? (
                          <span className="mt-0.5 block truncate text-xs font-normal text-muted-foreground">
                            {row.student.funderName}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                        {getFundingMethodLabel(row.student.fundingMethod) ?? "—"}
                      </TableCell>
                      <TableCell className="hidden max-w-[200px] lg:table-cell">
                        {row.session ? (
                          <span className="block truncate text-sm">
                            {row.session.title}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {row.createdAt
                          ? formatFrenchDateTimeShort(row.createdAt)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {row.signed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="size-3.5" />
                            Signée
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                            <CircleAlert className="size-3.5" />
                            En attente
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <div className="flex justify-end gap-0.5">
                          <Link
                            href={`/eleves/${row.student.id}`}
                            className={cn(
                              buttonVariants({ variant: "ghost", size: "icon" }),
                              "rounded-full text-muted-foreground hover:bg-muted",
                            )}
                            aria-label={`Ouvrir la fiche de ${row.student.firstName} ${row.student.lastName}`}
                          >
                            <ExternalLink className="size-4" />
                          </Link>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-muted-foreground hover:bg-muted"
                            aria-label={`Réimprimer la convention de ${row.student.firstName} ${row.student.lastName}`}
                            onClick={() => triggerPrint(row.student.id)}
                          >
                            <Printer className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {printTarget && printRow ? (
        <StudentProfilePrint
          mode={printTarget.mode}
          organizationName={state.organizationName}
          student={printRow.student}
          session={printRow.session}
          sessionStudents={printRow.sessionStudents}
        />
      ) : null}
    </div>
  );
}
