"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  Share2,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ACCOUNTING_CATEGORY_LABELS,
  computeBillingSummary,
  formatAmountHt,
  listBillingRows,
} from "@/lib/billing";
import type { AccountingCategory } from "@/lib/accounting";
import {
  buildFunderShareSummaryText,
  listFunderShareRows,
} from "@/lib/funder-sharing";
import { formatFrenchDateLong, formatFrenchDateTimeShort } from "@/lib/date-format";

const TAB_ORDER: AccountingCategory[] = [
  "relance",
  "facture_a_envoyer",
  "en_attente_paiement",
  "paye",
];

export default function FacturationPage() {
  const { state, hydrated, setSessionAccounting } = useFormation();
  const [tab, setTab] = React.useState<AccountingCategory>("facture_a_envoyer");
  const [mainTab, setMainTab] = React.useState<"billing" | "sharing">("billing");

  const summary = React.useMemo(
    () => computeBillingSummary(state.students, state.sessions),
    [state.students, state.sessions],
  );

  const funderRows = React.useMemo(
    () => listFunderShareRows(state.students, state.sessions),
    [state.students, state.sessions],
  );

  const markInvoiceSent = (sessionId: string, studentId: string) => {
    setSessionAccounting(sessionId, studentId, {
      invoiceSentAt: new Date().toISOString(),
    });
    toast.success("Facture marquée comme envoyée.");
  };

  const markPaymentReceived = (sessionId: string, studentId: string) => {
    const existing = state.sessions
      .find((s) => s.id === sessionId)
      ?.sessionAccounting?.[studentId];
    setSessionAccounting(sessionId, studentId, {
      invoiceSentAt: existing?.invoiceSentAt ?? new Date().toISOString(),
      paymentReceivedAt: new Date().toISOString(),
    });
    toast.success("Paiement enregistré.");
  };

  const updateBillingField = (
    sessionId: string,
    studentId: string,
    field: "invoiceNumber" | "amountHt" | "invoiceDate",
    raw: string,
  ) => {
    if (field === "amountHt") {
      const parsed = raw.trim() === "" ? undefined : Number.parseFloat(raw);
      setSessionAccounting(sessionId, studentId, {
        amountHt:
          parsed != null && !Number.isNaN(parsed) ? parsed : undefined,
      });
      return;
    }
    setSessionAccounting(sessionId, studentId, {
      [field]: raw.trim() || undefined,
    });
  };

  const copyFunderSummary = async (funderKey: string) => {
    const row = funderRows.find((r) => r.funderKey === funderKey);
    if (!row) return;
    const text = buildFunderShareSummaryText(row);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Résumé copié — prêt à partager au financeur.");
    } catch {
      toast.error("Impossible de copier dans le presse-papiers.");
    }
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
        eyebrow="Finance"
        title={
          <>
            Facturation <GradientAccent>complète</GradientAccent>
          </>
        }
        description="Suivi des factures, montants HT et partage financier avec les financeurs (OPCO, employeurs…)."
        actions={
          <Link
            href="/admin"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Admin
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription>Facturé HT</CardDescription>
            <CardTitle className="font-heading text-2xl">
              {formatAmountHt(summary.totalInvoicedHt)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription>Encaissé HT</CardDescription>
            <CardTitle className="font-heading text-2xl text-emerald-700 dark:text-emerald-400">
              {formatAmountHt(summary.totalPaidHt)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/60 bg-card/60">
          <CardHeader className="pb-2">
            <CardDescription>En attente HT</CardDescription>
            <CardTitle className="font-heading text-2xl text-amber-700 dark:text-amber-400">
              {formatAmountHt(summary.totalPendingHt)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs
        value={mainTab}
        onValueChange={(v) => setMainTab(v as "billing" | "sharing")}
      >
        <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 dark:border-white/10">
          <TabsTrigger value="billing" className="gap-2 rounded-lg px-4 py-2">
            <Banknote className="size-4" />
            Suivi factures
          </TabsTrigger>
          <TabsTrigger value="sharing" className="gap-2 rounded-lg px-4 py-2">
            <Share2 className="size-4" />
            Partage financeurs
            <Badge variant="secondary" className="rounded-full">
              {funderRows.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="billing" className="mt-0 space-y-4">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as AccountingCategory)}
          >
            <TabsList className="mb-4 flex h-auto w-full flex-wrap justify-start gap-1 rounded-xl border border-border/60 bg-muted/40 p-1 dark:border-white/10">
              {TAB_ORDER.map((category) => (
                <TabsTrigger
                  key={category}
                  value={category}
                  className="gap-2 rounded-lg px-3 py-2 text-xs sm:text-sm"
                >
                  {ACCOUNTING_CATEGORY_LABELS[category]}
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 rounded-full px-1.5 text-[10px]"
                  >
                    {summary.countByCategory[category]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {TAB_ORDER.map((category) => {
              const rows = listBillingRows(
                state.students,
                state.sessions,
                category,
              );
              return (
                <TabsContent key={category} value={category} className="mt-0">
                  {rows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                      Aucun dossier dans cette catégorie.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-border/60 dark:border-white/10">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Stagiaire</TableHead>
                            <TableHead>Session</TableHead>
                            <TableHead>N° facture</TableHead>
                            <TableHead>Montant HT</TableHead>
                            <TableHead>Date facture</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((row) => (
                            <TableRow key={`${row.sessionId}-${row.studentId}`}>
                              <TableCell>
                                <p className="font-medium">
                                  {row.student.firstName} {row.student.lastName}
                                </p>
                              </TableCell>
                              <TableCell>
                                <p>{row.session.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFrenchDateLong(row.session.date)}
                                </p>
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 min-w-[7rem] text-xs"
                                  defaultValue={row.invoiceNumber ?? ""}
                                  placeholder="FAC-2026-001"
                                  onBlur={(e) =>
                                    updateBillingField(
                                      row.sessionId,
                                      row.studentId,
                                      "invoiceNumber",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 w-24 text-xs"
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  defaultValue={row.amountHt ?? ""}
                                  placeholder="0"
                                  onBlur={(e) =>
                                    updateBillingField(
                                      row.sessionId,
                                      row.studentId,
                                      "amountHt",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  className="h-8 w-36 text-xs"
                                  type="date"
                                  defaultValue={row.invoiceDate ?? ""}
                                  onBlur={(e) =>
                                    updateBillingField(
                                      row.sessionId,
                                      row.studentId,
                                      "invoiceDate",
                                      e.target.value,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap justify-end gap-2">
                                  <Link
                                    href={`/eleves/${row.studentId}`}
                                    className={cn(
                                      buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                      }),
                                      "gap-1 rounded-full",
                                    )}
                                  >
                                    <ExternalLink className="size-3.5" />
                                    Fiche
                                  </Link>
                                  {row.category === "facture_a_envoyer" ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="gap-1 rounded-full"
                                      onClick={() =>
                                        markInvoiceSent(
                                          row.sessionId,
                                          row.studentId,
                                        )
                                      }
                                    >
                                      <FileText className="size-3.5" />
                                      Envoyée
                                    </Button>
                                  ) : null}
                                  {row.category === "en_attente_paiement" ? (
                                    <Button
                                      type="button"
                                      size="sm"
                                      className="gap-1 rounded-full"
                                      onClick={() =>
                                        markPaymentReceived(
                                          row.sessionId,
                                          row.studentId,
                                        )
                                      }
                                    >
                                      <CheckCircle2 className="size-3.5" />
                                      Payé
                                    </Button>
                                  ) : null}
                                  {row.accounting?.paymentReceivedAt ? (
                                    <span className="text-xs text-emerald-700 dark:text-emerald-400">
                                      {formatFrenchDateTimeShort(
                                        row.accounting.paymentReceivedAt,
                                      )}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>

        <TabsContent value="sharing" className="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-heading text-lg">
                <Share2 className="size-5" />
                Partage financier par financeur
              </CardTitle>
              <CardDescription>
                Vue consolidée pour transmettre aux OPCO et employeurs : stagiaires,
                conventions et montants HT associés.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {funderRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Aucun financeur renseigné sur les fiches stagiaires inscrites à
                  une session.
                </p>
              ) : (
                funderRows.map((row) => (
                  <div
                    key={row.funderKey}
                    className="rounded-xl border border-border/60 p-4 dark:border-white/10"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{row.funderName}</p>
                        {row.funderSiret ? (
                          <p className="text-xs text-muted-foreground">
                            SIRET {row.funderSiret}
                          </p>
                        ) : null}
                        {row.funderEmail ? (
                          <p className="text-xs text-muted-foreground">
                            {row.funderEmail}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm">
                          {row.studentCount} stagiaire
                          {row.studentCount > 1 ? "s" : ""} —{" "}
                          <span className="font-medium">
                            {formatAmountHt(row.totalAmountHt)} HT
                          </span>
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1 rounded-full"
                          onClick={() => copyFunderSummary(row.funderKey)}
                        >
                          <Copy className="size-3.5" />
                          Copier le résumé
                        </Button>
                        {row.funderEmail ? (
                          <a
                            href={`mailto:${encodeURIComponent(row.funderEmail)}?subject=${encodeURIComponent(`Suivi formation — ${row.funderName}`)}&body=${encodeURIComponent(buildFunderShareSummaryText(row))}`}
                            className={cn(
                              buttonVariants({ size: "sm" }),
                              "gap-1 rounded-full",
                            )}
                          >
                            <Mail className="size-3.5" />
                            E-mail
                          </a>
                        ) : null}
                      </div>
                    </div>
                    <ul className="mt-3 space-y-2 border-t border-border/40 pt-3 dark:border-white/5">
                      {row.students.map((item) => (
                        <li
                          key={item.student.id}
                          className="flex flex-wrap items-center justify-between gap-2 text-sm"
                        >
                          <Link
                            href={`/eleves/${item.student.id}`}
                            className="font-medium hover:text-indigo-600 dark:hover:text-violet-300"
                          >
                            {item.student.firstName} {item.student.lastName}
                          </Link>
                          <div className="flex flex-wrap items-center gap-2">
                            {item.conventionSigned ? (
                              <Badge
                                variant="secondary"
                                className="rounded-full text-xs"
                              >
                                Convention signée
                              </Badge>
                            ) : item.conventionCreated ? (
                              <Badge
                                variant="outline"
                                className="rounded-full text-xs"
                              >
                                Convention créée
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="rounded-full text-xs text-amber-700 dark:text-amber-400"
                              >
                                À créer
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {formatAmountHt(item.totalAmountHt)} HT
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
