"use client";

import * as React from "react";
import Link from "next/link";
import {
  Banknote,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
  countAccountingByCategory,
  listAccountingRows,
  type AccountingCategory,
} from "@/lib/accounting";
import {
  countPendingCpfNotifications,
  listCpfAccountingRows,
  type CpfNotificationStatus,
} from "@/lib/cpf-accounting";
import { formatFrenchDateLong, formatFrenchDateTimeShort } from "@/lib/date-format";
import { cn } from "@/lib/utils";

const TAB_ORDER: AccountingCategory[] = [
  "relance",
  "facture_a_envoyer",
  "en_attente_paiement",
  "paye",
];

const CPF_PORTAL_URL = "https://www.moncompteformation.gouv.fr/";

function cpfStatusLabel(
  kind: "entry" | "exit",
  status: CpfNotificationStatus,
  notifiedAt?: string,
): React.ReactNode {
  if (status === "done" && notifiedAt) {
    return (
      <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="size-3.5 shrink-0" />
        Déclarée le {formatFrenchDateTimeShort(notifiedAt)}
      </p>
    );
  }
  if (status === "pending") {
    return (
      <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
        {kind === "entry"
          ? "Entrée à déclarer sur Mon Compte Formation"
          : "Sortie à déclarer sur Mon Compte Formation"}
      </p>
    );
  }
  return (
    <p className="text-xs text-muted-foreground">
      {kind === "entry" ? "Avant le début" : "Après la formation"}
    </p>
  );
}

export function AdminAccountingSection() {
  const { state, hydrated, setSessionAccounting } = useFormation();
  const [tab, setTab] = React.useState<AccountingCategory>("relance");

  const counts = React.useMemo(
    () => countAccountingByCategory(state.students, state.sessions),
    [state.students, state.sessions],
  );

  const cpfRows = React.useMemo(
    () => listCpfAccountingRows(state.students, state.sessions),
    [state.students, state.sessions],
  );

  const pendingCpfCount = React.useMemo(
    () => countPendingCpfNotifications(state.students, state.sessions),
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

  const resetPayment = (sessionId: string, studentId: string) => {
    const existing = state.sessions
      .find((s) => s.id === sessionId)
      ?.sessionAccounting?.[studentId];
    if (!existing?.invoiceSentAt) return;
    setSessionAccounting(sessionId, studentId, {
      invoiceSentAt: existing.invoiceSentAt,
      paymentReceivedAt: undefined,
    });
    toast.success("Paiement réinitialisé.");
  };

  const markCpfEntryNotified = (sessionId: string, studentId: string) => {
    setSessionAccounting(sessionId, studentId, {
      cpfEntryNotifiedAt: new Date().toISOString(),
    });
    toast.success("Entrée CPF enregistrée.");
  };

  const markCpfExitNotified = (sessionId: string, studentId: string) => {
    setSessionAccounting(sessionId, studentId, {
      cpfExitNotifiedAt: new Date().toISOString(),
    });
    toast.success("Sortie CPF enregistrée.");
  };

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="size-5" />
          Comptabilité &amp; suivi
        </CardTitle>
        <CardDescription>
          Relances dossier, factures à envoyer après formation et suivi des
          paiements financeurs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : (
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
                    {counts[category]}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {TAB_ORDER.map((category) => {
              const rows = listAccountingRows(
                state.students,
                state.sessions,
                category,
              );
              return (
              <TabsContent key={category} value={category} className="mt-0">
                {rows.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
                    Aucun dossier dans cette catégorie pour le moment.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border/60 dark:border-white/10">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Stagiaire</TableHead>
                          <TableHead>Formation</TableHead>
                          <TableHead>Financeur</TableHead>
                          <TableHead>Statut</TableHead>
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
                              {row.student.email ? (
                                <p className="text-xs text-muted-foreground">
                                  {row.student.email}
                                </p>
                              ) : null}
                            </TableCell>
                            <TableCell>
                              <p>{row.session.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFrenchDateLong(row.session.date)}
                              </p>
                            </TableCell>
                            <TableCell>
                              {row.student.funderName ? (
                                <div>
                                  <p>{row.student.funderName}</p>
                                  {row.student.funderEmail ? (
                                    <p className="text-xs text-muted-foreground">
                                      {row.student.funderEmail}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground">
                                  Non renseigné
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {row.category === "relance" ? (
                                <ul className="space-y-1 text-xs text-muted-foreground">
                                  {row.followUpLabels.map((label) => (
                                    <li key={label}>• {label}</li>
                                  ))}
                                </ul>
                              ) : null}
                              {row.accounting?.invoiceSentAt ? (
                                <p className="text-xs text-muted-foreground">
                                  Facture envoyée le{" "}
                                  {formatFrenchDateTimeShort(
                                    row.accounting.invoiceSentAt,
                                  )}
                                </p>
                              ) : null}
                              {row.accounting?.paymentReceivedAt ? (
                                <p className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
                                  <CheckCircle2 className="size-3.5 shrink-0" />
                                  Payé le{" "}
                                  {formatFrenchDateTimeShort(
                                    row.accounting.paymentReceivedAt,
                                  )}
                                </p>
                              ) : null}
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
                                {row.category === "relance" &&
                                row.student.funderEmail ? (
                                  <a
                                    href={`mailto:${encodeURIComponent(row.student.funderEmail)}`}
                                    className={cn(
                                      buttonVariants({
                                        variant: "outline",
                                        size: "sm",
                                      }),
                                      "gap-1 rounded-full",
                                    )}
                                  >
                                    <Mail className="size-3.5" />
                                    Financeur
                                  </a>
                                ) : null}
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
                                    Facture envoyée
                                  </Button>
                                ) : null}
                                {row.category === "en_attente_paiement" ? (
                                  <>
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
                                      Paiement reçu
                                    </Button>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      className="rounded-full"
                                      onClick={() =>
                                        setSessionAccounting(
                                          row.sessionId,
                                          row.studentId,
                                          { invoiceSentAt: undefined },
                                        )
                                      }
                                    >
                                      Annuler envoi
                                    </Button>
                                  </>
                                ) : null}
                                {row.category === "paye" ? (
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() =>
                                      resetPayment(
                                        row.sessionId,
                                        row.studentId,
                                      )
                                    }
                                  >
                                    Réouvrir
                                  </Button>
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
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-5" />
          Suivi CPF
          {pendingCpfCount > 0 ? (
            <Badge variant="secondary" className="rounded-full">
              {pendingCpfCount} à faire
            </Badge>
          ) : null}
        </CardTitle>
        <CardDescription>
          Stagiaires financés par le CPF : déclarez l&apos;entrée en formation
          avant le début, puis la sortie après la session, sur{" "}
          <a
            href={CPF_PORTAL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-2"
          >
            Mon Compte Formation
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hydrated ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : cpfRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-4 py-8 text-center text-sm text-muted-foreground dark:border-white/10">
            Aucun stagiaire financé par le CPF pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60 dark:border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Entrée CPF</TableHead>
                  <TableHead>Sortie CPF</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cpfRows.map((row) => (
                  <TableRow key={`cpf-${row.sessionId}-${row.studentId}`}>
                    <TableCell>
                      <p className="font-medium">
                        {row.student.firstName} {row.student.lastName}
                      </p>
                      {row.student.email ? (
                        <p className="text-xs text-muted-foreground">
                          {row.student.email}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <p>{row.session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFrenchDateLong(row.session.date)}
                      </p>
                    </TableCell>
                    <TableCell>
                      {cpfStatusLabel(
                        "entry",
                        row.entryStatus,
                        row.accounting?.cpfEntryNotifiedAt,
                      )}
                    </TableCell>
                    <TableCell>
                      {cpfStatusLabel(
                        "exit",
                        row.exitStatus,
                        row.accounting?.cpfExitNotifiedAt,
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-2">
                        <a
                          href={CPF_PORTAL_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({
                              variant: "outline",
                              size: "sm",
                            }),
                            "gap-1 rounded-full",
                          )}
                        >
                          <ExternalLink className="size-3.5" />
                          Portail CPF
                        </a>
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
                        {row.entryStatus === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1 rounded-full"
                            onClick={() =>
                              markCpfEntryNotified(row.sessionId, row.studentId)
                            }
                          >
                            <CheckCircle2 className="size-3.5" />
                            Entrée faite
                          </Button>
                        ) : row.entryStatus === "done" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() =>
                              setSessionAccounting(row.sessionId, row.studentId, {
                                cpfEntryNotifiedAt: undefined,
                              })
                            }
                          >
                            Annuler entrée
                          </Button>
                        ) : null}
                        {row.exitStatus === "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            className="gap-1 rounded-full"
                            onClick={() =>
                              markCpfExitNotified(row.sessionId, row.studentId)
                            }
                          >
                            <CheckCircle2 className="size-3.5" />
                            Sortie faite
                          </Button>
                        ) : row.exitStatus === "done" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="rounded-full"
                            onClick={() =>
                              setSessionAccounting(row.sessionId, row.studentId, {
                                cpfExitNotifiedAt: undefined,
                              })
                            }
                          >
                            Annuler sortie
                          </Button>
                        ) : null}
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
    </div>
  );
}
