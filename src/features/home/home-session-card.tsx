"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  Calendar,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileDown,
  Link2,
  Mail,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import { useConfirm } from "@/components/confirm-provider";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { TrainingSession } from "@/lib/types";
import { exportSessionAttendanceCsv } from "@/lib/export-csv";
import { downloadSessionJsonBundle } from "@/lib/export-session-json";
import { downloadSessionIcs } from "@/lib/session-ics";
import { getSessionSignatureSummary } from "@/lib/session-signature";
import { buildSessionSummaryPlainText } from "@/lib/session-summary-text";
import {
  formatFrenchDateShort,
  formatFrenchDateTimeShort,
} from "@/lib/date-format";
import {
  formatSessionRelativeDay,
  getSessionDateProximity,
} from "@/lib/session-relative-day";
import { buildSessionEmailsList } from "@/lib/session-emails-text";

type Props = {
  session: TrainingSession;
  onEdit: (id: string) => void;
};

export function HomeSessionCard({ session: sess, onEdit }: Props) {
  const {
    state,
    toggleSessionFavorite,
    duplicateSession,
    updateSession,
    removeSession,
  } = useFormation();
  const confirm = useConfirm();
  const sig = getSessionSignatureSummary(sess);
  const { n, signedM, signedA } = sig;
  const relDay = formatSessionRelativeDay(sess.date);
  const dateProximity = getSessionDateProximity(sess.date);

  return (
    <li>
      <Card
        className={cn(
          "dg-surface transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 dark:hover:shadow-violet-950/40",
          "ring-0",
          sess.archived &&
            "border-dashed border-muted-foreground/25 opacity-[0.92]",
        )}
      >
        <CardContent className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className={cn(
                  "size-9 shrink-0 rounded-full",
                  sess.favorited
                    ? "text-amber-600 hover:text-amber-700 dark:text-amber-400"
                    : "text-muted-foreground hover:text-amber-600",
                )}
                aria-label={
                  sess.favorited
                    ? "Retirer des favoris"
                    : "Ajouter aux favoris"
                }
                onClick={() => toggleSessionFavorite(sess.id)}
              >
                <Star
                  className={cn("size-4", sess.favorited && "fill-current")}
                />
              </Button>
              <h2 className="min-w-0 max-w-full break-words font-heading text-lg font-semibold tracking-tight">
                {sess.title}
              </h2>
              <Badge
                variant="secondary"
                className="rounded-full border-0 bg-indigo-100/90 font-medium text-indigo-900 dark:bg-violet-500/20 dark:text-violet-100"
              >
                {formatFrenchDateShort(sess.date)}
              </Badge>
              {relDay ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-full text-xs font-medium",
                    dateProximity === "today" &&
                      "border-emerald-500/45 text-emerald-900 dark:border-emerald-400/40 dark:text-emerald-200",
                    dateProximity === "future" &&
                      "border-sky-500/40 text-sky-900 dark:border-sky-400/35 dark:text-sky-100",
                    dateProximity === "past" &&
                      "border-muted-foreground/35 text-muted-foreground",
                  )}
                >
                  {relDay}
                </Badge>
              ) : null}
              {sess.archived ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-slate-400/60 text-xs font-medium text-slate-700 dark:border-slate-500/50 dark:text-slate-200"
                >
                  <Archive className="mr-1 size-3" aria-hidden />
                  Archivée
                </Badge>
              ) : null}
              {sig.incompleteSignatures && n > 0 ? (
                <Badge
                  variant="outline"
                  className="rounded-full border-amber-500/50 text-xs font-medium text-amber-900 dark:border-amber-400/40 dark:text-amber-200"
                >
                  Signatures incomplètes
                </Badge>
              ) : null}
            </div>
            {sess.tags && sess.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {sess.tags.map((tg) => (
                  <Badge
                    key={tg}
                    variant="outline"
                    className="rounded-full border-violet-200/80 text-xs font-normal text-violet-900 dark:border-violet-500/40 dark:text-violet-100"
                  >
                    {tg}
                  </Badge>
                ))}
              </div>
            ) : null}
            {sess.notes?.trim() ? (
              <p className="line-clamp-2 text-xs italic leading-snug text-muted-foreground">
                {sess.notes.trim()}
              </p>
            ) : null}
            {sess.location?.trim() || sess.trainer?.trim() ? (
              <p className="text-xs text-muted-foreground">
                {[sess.location?.trim(), sess.trainer?.trim()]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            ) : null}
            {sess.lastActivityAt ? (
              <p className="text-xs text-muted-foreground">
                Dernière activité :{" "}
                {formatFrenchDateTimeShort(sess.lastActivityAt)}
              </p>
            ) : sess.createdAt ? (
              <p className="text-xs text-muted-foreground">
                Créée le {formatFrenchDateTimeShort(sess.createdAt)}
              </p>
            ) : null}
            <p className="text-sm leading-relaxed text-muted-foreground">
              {n === 0 ? (
                <>
                  <span className="font-medium text-amber-700 dark:text-amber-300">
                    Aucun élève
                  </span>{" "}
                  sur cette feuille — ouvrez l&apos;émargement pour les ajouter
                  depuis l&apos;annuaire.
                </>
              ) : (
                <>
                  <span className="font-medium text-foreground/80">{n}</span>{" "}
                  élève{n > 1 ? "s" : ""} — signatures :{" "}
                  <span className="text-indigo-700 dark:text-violet-300">
                    matin {signedM}/{n}
                  </span>
                  ,{" "}
                  <span className="text-violet-700 dark:text-fuchsia-300">
                    après-midi {signedA}/{n}
                  </span>
                </>
              )}
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "rounded-full text-muted-foreground hover:bg-muted",
                )}
                aria-label="Plus d’actions"
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuItem onClick={() => onEdit(sess.id)}>
                  <Pencil className="size-4" />
                  Modifier…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    duplicateSession(sess.id);
                    toast.success(
                      "Session dupliquée (nouvelle feuille, présences vides).",
                    );
                  }}
                >
                  <Copy className="size-4" />
                  Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const url = `${window.location.origin}/sessions/${sess.id}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      toast.success("Lien copié dans le presse-papiers.");
                    } catch {
                      toast.error("Impossible de copier le lien.");
                    }
                  }}
                >
                  <Link2 className="size-4" />
                  Copier le lien
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const text = buildSessionSummaryPlainText(
                      sess,
                      state.students,
                      state.organizationName,
                    );
                    try {
                      await navigator.clipboard.writeText(text);
                      toast.success("Résumé copié dans le presse-papiers.");
                    } catch {
                      toast.error("Impossible de copier le texte.");
                    }
                  }}
                >
                  <ClipboardList className="size-4" />
                  Copier le résumé (texte)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={async () => {
                    const list = buildSessionEmailsList(sess, state.students);
                    if (!list.trim()) {
                      toast.error(
                        "Aucun e-mail renseigné pour les inscrits de cette feuille.",
                      );
                      return;
                    }
                    try {
                      await navigator.clipboard.writeText(list);
                      toast.success("Liste d’e-mails copiée (séparateur ;).");
                    } catch {
                      toast.error("Impossible de copier.");
                    }
                  }}
                >
                  <Mail className="size-4" />
                  Copier les e-mails des inscrits
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    exportSessionAttendanceCsv(
                      sess,
                      state.students,
                      `emargement-${sess.title.replace(/\s+/g, "_").slice(0, 40)}-${sess.date}.csv`,
                    );
                    toast.success("Export CSV téléchargé.");
                  }}
                >
                  <FileDown className="size-4" />
                  Exporter CSV (feuille)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadSessionJsonBundle(sess, state.students);
                    toast.success("Export JSON de la session téléchargé.");
                  }}
                >
                  <Download className="size-4" />
                  Exporter JSON (session)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    downloadSessionIcs(sess, state.organizationName);
                    toast.success(
                      "Fichier agenda (.ics) téléchargé — ouvrez-le dans votre calendrier.",
                    );
                  }}
                >
                  <Calendar className="size-4" />
                  Exporter iCal (.ics)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    updateSession(sess.id, { archived: !sess.archived });
                    toast.success(
                      sess.archived
                        ? "Session désarchivée."
                        : "Session archivée.",
                    );
                  }}
                >
                  {sess.archived ? (
                    <ArchiveRestore className="size-4" />
                  ) : (
                    <Archive className="size-4" />
                  )}
                  {sess.archived ? "Désarchiver" : "Archiver"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={async () => {
                    const ok = await confirm({
                      title: "Supprimer la session ?",
                      description: `Supprimer définitivement « ${sess.title} » ? Vous pourrez annuler depuis la notification.`,
                      confirmLabel: "Supprimer",
                      variant: "destructive",
                    });
                    if (!ok) return;
                    removeSession(sess.id);
                  }}
                >
                  <Trash2 className="size-4" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link
              href={`/sessions/${sess.id}`}
              className={cn(
                buttonVariants(),
                "btn-gradient gap-2 rounded-full px-5",
              )}
            >
              Feuille d&apos;émargement
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}
