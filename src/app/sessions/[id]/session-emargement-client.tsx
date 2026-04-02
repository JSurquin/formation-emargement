"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  FileDown,
  FileJson,
  Mail,
  PenLine,
  Printer,
  UserMinus,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import type { HalfDay, Student } from "@/lib/types";
import { SignaturePad } from "@/components/signature-pad";
import { GradientAccent } from "@/components/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { SessionPrintSummary } from "@/components/session-print-summary";
import { NoteSnippetsControls } from "@/components/note-snippets-controls";
import { filterStudentsByQuery } from "@/lib/student-search";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import { exportSessionAttendanceCsv } from "@/lib/export-csv";
import { downloadSessionJsonBundle } from "@/lib/export-session-json";
import { getSessionSignatureSummary } from "@/lib/session-signature";
import { buildSessionEmailsList } from "@/lib/session-emails-text";
import { buildSessionSummaryPlainText } from "@/lib/session-summary-text";
import { downloadSessionIcs } from "@/lib/session-ics";
import { formatFrenchDateLong } from "@/lib/date-format";
import { EmargementBulkActions } from "@/features/emargement/emargement-bulk-actions";
import { recordRecentSessionOpened } from "@/lib/recent-sessions-storage";

const halfLabels: Record<HalfDay, string> = {
  morning: "Matin",
  afternoon: "Après-midi",
};

type SignTarget = { studentId: string; half: HalfDay } | null;

const tabActiveClass =
  "data-active:bg-gradient-to-r data-active:from-indigo-600 data-active:to-violet-600 data-active:text-white data-active:shadow-md data-active:shadow-indigo-600/25 dark:data-active:from-indigo-500 dark:data-active:to-violet-500";

export function SessionEmargementClient({ sessionId }: { sessionId: string }) {
  const {
    state,
    hydrated,
    setPresent,
    setSignature,
    addStudentsToSession,
    removeStudentFromSession,
    updateSessionNotes,
    updateSession,
    addNoteSnippet,
    removeNoteSnippet,
    setAllPresentForHalf,
    clearSignaturesForHalf,
  } = useFormation();
  const [signTarget, setSignTarget] = React.useState<SignTarget>(null);
  const [qOnSheet, setQOnSheet] = React.useState("");
  const [qRoster, setQRoster] = React.useState("");
  const [qTable, setQTable] = React.useState("");
  const [notesDraft, setNotesDraft] = React.useState("");
  const [tagsDraft, setTagsDraft] = React.useState("");
  const [metaTitle, setMetaTitle] = React.useState("");
  const [metaDate, setMetaDate] = React.useState("");
  const [metaLocation, setMetaLocation] = React.useState("");
  const [metaTrainer, setMetaTrainer] = React.useState("");

  const session = state.sessions.find((s) => s.id === sessionId);
  const signatureSummary = session
    ? getSessionSignatureSummary(session)
    : null;
  const students: Student[] = session
    ? session.studentIds
        .map((id) => state.students.find((s) => s.id === id))
        .filter((s): s is Student => Boolean(s))
    : [];
  const rosterNotOnSheet: Student[] = session
    ? state.students.filter((s) => !session.studentIds.includes(s.id))
    : [];

  const studentsOnSheetFiltered = React.useMemo(
    () => filterStudentsByQuery(students, qOnSheet),
    [students, qOnSheet],
  );
  const rosterFiltered = React.useMemo(
    () => filterStudentsByQuery(rosterNotOnSheet, qRoster),
    [rosterNotOnSheet, qRoster],
  );
  const studentsForTable = React.useMemo(
    () => filterStudentsByQuery(students, qTable),
    [students, qTable],
  );

  React.useEffect(() => {
    if (session) setNotesDraft(session.notes ?? "");
  }, [session?.id, session?.notes]);

  React.useEffect(() => {
    if (session) setTagsDraft((session.tags ?? []).join(", "));
  }, [session?.id, (session?.tags ?? []).join("|")]);

  React.useEffect(() => {
    if (!session) return;
    setMetaTitle(session.title);
    setMetaDate(session.date);
    setMetaLocation(session.location ?? "");
    setMetaTrainer(session.trainer ?? "");
  }, [
    session?.id,
    session?.title,
    session?.date,
    session?.location,
    session?.trainer,
  ]);

  React.useEffect(() => {
    if (!session) return;
    recordRecentSessionOpened(session.id);
  }, [session?.id]);

  React.useEffect(() => {
    if (!session) return;
    const id = session.id;
    const saved = session.notes ?? "";
    const t = setTimeout(() => {
      if (notesDraft !== saved) {
        updateSessionNotes(id, notesDraft);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [notesDraft, session?.id, session?.notes, updateSessionNotes]);

  useSlashFocus("search-table", hydrated && Boolean(session));

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="dg-surface ring-0">
        <CardHeader>
          <CardTitle className="font-heading text-xl">
            Session introuvable
          </CardTitle>
          <CardDescription className="text-base">
            Ce lien ne correspond à aucune session enregistrée sur cet
            appareil.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "secondary" }),
              "gap-2 rounded-full px-6",
            )}
          >
            <ArrowLeft className="size-4" />
            Retour aux sessions
          </Link>
        </CardContent>
      </Card>
    );
  }

  const HalfTable = ({
    half,
    rows,
  }: {
    half: HalfDay;
    rows: Student[];
  }) => (
    <div className="dg-table-wrap">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 hover:bg-transparent dark:border-white/10">
              <TableHead className="min-w-[160px] pl-4 font-heading sm:pl-6">
                Élève
              </TableHead>
              <TableHead className="w-[100px] text-center font-heading">
                Présent
              </TableHead>
              <TableHead className="min-w-[160px] font-heading">
                Signature
              </TableHead>
              <TableHead className="hidden w-[168px] font-heading text-muted-foreground md:table-cell">
                Horodatage
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-muted-foreground"
                >
                  Personne sur cette feuille. Ajoutez des élèves depuis
                  l&apos;annuaire ci-dessus.
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-muted-foreground"
                >
                  Aucun résultat pour « {qTable.trim() || "…"} » sur cette
                  feuille.
                </TableCell>
              </TableRow>
            ) : null}
            {rows.map((st) => {
              const slot = session.attendance[half][st.id] ?? {
                present: false,
                signatureDataUrl: null,
                signedAt: null,
              };
              return (
                <TableRow
                  key={st.id}
                  className="border-border/50 transition-colors hover:bg-muted/30 dark:border-white/5 dark:hover:bg-white/5"
                >
                  <TableCell className="pl-4 font-medium sm:pl-6">
                    {st.firstName} {st.lastName}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Checkbox
                        checked={slot.present}
                        onCheckedChange={(v) => {
                          setPresent(session.id, st.id, half, v === true);
                          if (v !== true) {
                            toast.message(
                              "Présence retirée — signature effacée.",
                            );
                          }
                        }}
                        aria-label={`Présent ${halfLabels[half]} — ${st.firstName} ${st.lastName}`}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {slot.signatureDataUrl ? (
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={slot.signatureDataUrl}
                          alt=""
                          className="h-14 max-w-[200px] rounded-lg border border-border/80 bg-white object-contain shadow-sm dark:bg-zinc-100"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={!slot.present}
                          onClick={() =>
                            setSignTarget({ studentId: st.id, half })
                          }
                        >
                          Refaire
                        </Button>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full border-indigo-200/80 bg-indigo-50/90 text-indigo-900 hover:bg-indigo-100 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-100 dark:hover:bg-violet-500/25"
                        disabled={!slot.present}
                        onClick={() =>
                          setSignTarget({ studentId: st.id, half })
                        }
                      >
                        <PenLine className="size-4" />
                        Signer
                      </Button>
                    )}
                  </TableCell>
                  <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                    {slot.signedAt
                      ? new Date(slot.signedAt).toLocaleString("fr-FR")
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );

  return (
    <div>
      <div className="print:hidden space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 w-fit min-w-0 gap-2 rounded-full text-muted-foreground hover:text-foreground",
            )}
          >
            <ArrowLeft className="size-4 shrink-0" />
            Sessions
          </Link>
          <div className="-mx-1 flex max-w-full gap-2 self-stretch overflow-x-auto overflow-y-hidden overscroll-x-contain pb-1 [-webkit-overflow-scrolling:touch] sm:mx-0 sm:max-w-none sm:flex-wrap sm:overflow-visible sm:pb-0">
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={() => window.print()}
            >
              <Printer className="size-4 shrink-0" />
              <span className="whitespace-nowrap">Imprimer / PDF</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={() => {
                exportSessionAttendanceCsv(
                  session,
                  state.students,
                  `emargement-${session.title.replace(/\s+/g, "_").slice(0, 40)}-${session.date}.csv`,
                );
                toast.success("Export CSV téléchargé.");
              }}
            >
              <FileDown className="size-4 shrink-0" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={() => {
                downloadSessionJsonBundle(session, state.students);
                toast.success("Export JSON de la session téléchargé.");
              }}
            >
              <FileJson className="size-4 shrink-0" />
              JSON
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={async () => {
                const text = buildSessionSummaryPlainText(
                  session,
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
              <ClipboardList className="size-4 shrink-0" />
              <span className="whitespace-nowrap">Copier résumé</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={async () => {
                const list = buildSessionEmailsList(session, state.students);
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
              <Mail className="size-4 shrink-0" />
              <span className="whitespace-nowrap">E-mails inscrits</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shrink-0 gap-2 rounded-full border-border/80"
              onClick={() => {
                downloadSessionIcs(session, state.organizationName);
                toast.success(
                  "Fichier agenda (.ics) téléchargé — ouvrez-le dans votre calendrier.",
                );
              }}
            >
              <Calendar className="size-4 shrink-0" />
              iCal
            </Button>
          </div>
        </div>
        <div className="min-w-0 space-y-3">
          <h1 className="break-words font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
            {session.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Badge
              variant="outline"
              className="rounded-full border-indigo-200/80 bg-indigo-50/80 px-3 py-1 text-xs font-medium text-indigo-900 dark:border-violet-500/40 dark:bg-violet-500/15 dark:text-violet-100"
            >
              {formatFrenchDateLong(session.date)}
            </Badge>
            {session.archived ? (
              <Badge
                variant="outline"
                className="rounded-full border-slate-400/60 px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-500/50 dark:text-slate-200"
              >
                Archivée
              </Badge>
            ) : null}
            {signatureSummary?.incompleteSignatures &&
            signatureSummary.n > 0 ? (
              <Badge
                variant="outline"
                className="rounded-full border-amber-500/50 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-400/40 dark:text-amber-200"
              >
                Signatures incomplètes
              </Badge>
            ) : null}
            <span className="text-sm text-muted-foreground">
              Feuille d&apos;<GradientAccent>émargement</GradientAccent> — 2
              demi-journées
            </span>
          </div>
        </div>
      </div>

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Informations
          </CardTitle>
          <CardDescription>
            Intitulé, date, lieu et intervenant — enregistrés lorsque vous quittez
            le champ (clic ailleurs ou Tab).
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="meta-title">Intitulé</Label>
            <Input
              id="meta-title"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              onBlur={() => {
                const t = metaTitle.trim();
                if (t === session.title) return;
                if (!t) {
                  setMetaTitle(session.title);
                  toast.error("L’intitulé ne peut pas être vide.");
                  return;
                }
                updateSession(session.id, { title: t });
                toast.success("Intitulé mis à jour.");
              }}
              className="bg-background/80 font-heading text-lg font-semibold"
            />
          </div>
          <div className="grid gap-2 sm:col-span-2 sm:max-w-xs">
            <Label htmlFor="meta-date">Date</Label>
            <Input
              id="meta-date"
              type="date"
              value={metaDate}
              onChange={(e) => setMetaDate(e.target.value)}
              onBlur={() => {
                if (metaDate === session.date) return;
                updateSession(session.id, { date: metaDate });
                toast.success("Date mise à jour.");
              }}
              className="bg-background/80"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meta-location">Lieu</Label>
            <Input
              id="meta-location"
              value={metaLocation}
              onChange={(e) => setMetaLocation(e.target.value)}
              onBlur={() => {
                const v = metaLocation.trim();
                const cur = session.location?.trim() ?? "";
                if (v === cur) return;
                updateSession(session.id, { location: v || undefined });
                toast.success("Lieu enregistré.");
              }}
              placeholder="Salle, adresse…"
              className="bg-background/80"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="meta-trainer">Intervenant</Label>
            <Input
              id="meta-trainer"
              value={metaTrainer}
              onChange={(e) => setMetaTrainer(e.target.value)}
              onBlur={() => {
                const v = metaTrainer.trim();
                const cur = session.trainer?.trim() ?? "";
                if (v === cur) return;
                updateSession(session.id, { trainer: v || undefined });
                toast.success("Intervenant enregistré.");
              }}
              placeholder="Nom du formateur"
              className="bg-background/80"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Étiquettes
          </CardTitle>
          <CardDescription>
            Visible sur l’accueil, la recherche et l’impression. Séparées par des
            virgules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1">
              <Label htmlFor="session-tags-sheet" className="sr-only">
                Étiquettes
              </Label>
              <Input
                id="session-tags-sheet"
                value={tagsDraft}
                onChange={(e) => setTagsDraft(e.target.value)}
                onBlur={() => {
                  const parts = tagsDraft
                    .split(/[,;]/)
                    .map((x) => x.trim())
                    .filter(Boolean);
                  const cur = (session.tags ?? []).join(", ");
                  const next = parts.join(", ");
                  if (cur === next) return;
                  updateSession(session.id, { tags: parts });
                  toast.success("Étiquettes enregistrées.");
                }}
                placeholder="ex. SST, Paris"
                className="bg-background/80"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Notes de session
          </CardTitle>
          <CardDescription>
            Lieu, formateur, consignes… Enregistrées automatiquement (texte
            local). Visibles à l&apos;impression.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <NoteSnippetsControls
            snippets={state.noteSnippets ?? []}
            onAdd={addNoteSnippet}
            onRemove={removeNoteSnippet}
            onInsert={(text) => {
              setNotesDraft((prev) => {
                const p = prev.trimEnd();
                return p ? `${p}\n\n${text}` : text;
              });
            }}
          />
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            placeholder="ex. Salle B12 — Intervenant : M. Martin"
            rows={4}
            className="resize-y bg-background/80 text-base"
          />
          <p className="text-xs text-muted-foreground">
            Touche / : focus sur le filtre du tableau de présence (hors champs de
            saisie).
          </p>
        </CardContent>
      </Card>

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Élèves sur cette feuille
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            La session ne contient que les personnes que vous y mettez : retirez
            ou ajoutez depuis l&apos;annuaire global, sans toucher aux fiches
            élèves.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {state.students.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              L&apos;annuaire est vide.{" "}
              <Link
                href="/eleves"
                className="font-medium text-indigo-600 underline underline-offset-2 dark:text-violet-300"
              >
                Créer des élèves
              </Link>{" "}
              pour les rattacher à cette session.
            </p>
          ) : (
            <>
              <ParticipantSearchInput
                id="search-on-sheet"
                value={qOnSheet}
                onChange={setQOnSheet}
                placeholder="Rechercher parmi les élèves sur cette feuille…"
                aria-label="Filtrer les participants inscrits sur la session"
                className="max-w-xl"
              />
              <div>
                <p className="mb-3 font-heading text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Sur cette session ({students.length}
                  {qOnSheet.trim()
                    ? ` — ${studentsOnSheetFiltered.length} affiché${studentsOnSheetFiltered.length > 1 ? "s" : ""}`
                    : ""}
                  )
                </p>
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun élève pour l&apos;instant — utilisez la section
                    ci-dessous.
                  </p>
                ) : studentsOnSheetFiltered.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Aucun résultat pour votre recherche sur les inscrits.
                  </p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {studentsOnSheetFiltered.map((st) => (
                      <li
                        key={st.id}
                        className="flex items-center gap-0.5 rounded-full border border-border/80 bg-muted/40 py-1 pl-3 pr-0.5 dark:border-white/10 dark:bg-white/5"
                      >
                        <span className="text-sm font-medium">
                          {st.firstName} {st.lastName}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-8 shrink-0 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          aria-label={`Retirer ${st.firstName} de la session`}
                          onClick={() => {
                            removeStudentFromSession(session.id, st.id);
                            toast.success(
                              `${st.firstName} retiré(e) de cette feuille.`,
                            );
                          }}
                        >
                          <UserMinus className="size-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {rosterNotOnSheet.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Annuaire — pas encore sur cette feuille (
                    {rosterNotOnSheet.length})
                  </p>
                  <ParticipantSearchInput
                    id="search-roster"
                    value={qRoster}
                    onChange={setQRoster}
                    placeholder="Rechercher dans l’annuaire à ajouter…"
                    aria-label="Filtrer l’annuaire pour ajout à la session"
                    className="max-w-xl"
                  />
                  {rosterFiltered.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Aucun résultat — modifiez la recherche.
                    </p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {rosterFiltered.map((st) => (
                      <li key={st.id}>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5 rounded-full border-indigo-200/80 bg-background/80 dark:border-violet-500/35"
                          onClick={() => {
                            addStudentsToSession(session.id, [st.id]);
                            toast.success(
                              `${st.firstName} ajouté(e) à la feuille.`,
                            );
                          }}
                        >
                          <UserPlus className="size-4" />
                          {st.firstName} {st.lastName}
                        </Button>
                      </li>
                    ))}
                    </ul>
                  )}
                </div>
              ) : students.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Tous les élèves de l&apos;annuaire sont déjà sur cette feuille.
                </p>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="dg-surface ring-0">
        <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
          <CardTitle className="font-heading text-lg">
            Présences & signatures
          </CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Cochez la présence, puis faites signer chaque stagiaire pour la
            demi-journée — même logique qu&apos;une feuille papier passée en
            salle.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-md flex-1">
              <Label
                htmlFor="search-table"
                className="mb-2 block font-heading text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
              >
                Filtrer le tableau de présence
              </Label>
              <ParticipantSearchInput
                id="search-table"
                value={qTable}
                onChange={setQTable}
                placeholder="Prénom, nom ou e-mail…"
                aria-label="Rechercher dans le tableau de présence"
              />
            </div>
            {qTable.trim() ? (
              <p className="text-xs text-muted-foreground">
                {studentsForTable.length} / {students.length} ligne
                {students.length > 1 ? "s" : ""}
              </p>
            ) : null}
          </div>
          <EmargementBulkActions
            sessionId={session.id}
            studentCount={students.length}
            setAllPresentForHalf={setAllPresentForHalf}
            clearSignaturesForHalf={clearSignaturesForHalf}
          />
          <Tabs defaultValue="morning" className="w-full">
            <TabsList className="grid h-11 w-full max-w-md grid-cols-2 rounded-full border border-border/60 bg-muted/50 p-1 dark:border-white/10 dark:bg-black/25">
              <TabsTrigger
                value="morning"
                className={cn(
                  "rounded-full font-heading text-sm transition-all",
                  tabActiveClass,
                )}
              >
                Matin
              </TabsTrigger>
              <TabsTrigger
                value="afternoon"
                className={cn(
                  "rounded-full font-heading text-sm transition-all",
                  tabActiveClass,
                )}
              >
                Après-midi
              </TabsTrigger>
            </TabsList>
            <Separator className="my-6 bg-gradient-to-r from-transparent via-border to-transparent dark:via-white/15" />
            <TabsContent value="morning" className="mt-0 outline-none">
              <HalfTable half="morning" rows={studentsForTable} />
            </TabsContent>
            <TabsContent value="afternoon" className="mt-0 outline-none">
              <HalfTable half="afternoon" rows={studentsForTable} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog
        open={signTarget !== null}
        onOpenChange={(o) => {
          if (!o) setSignTarget(null);
        }}
      >
        <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Signature de l&apos;élève
            </DialogTitle>
            <DialogDescription className="text-base">
              {signTarget &&
                (() => {
                  const st = students.find((x) => x.id === signTarget.studentId);
                  return st ? (
                    <>
                      <span className="font-medium text-foreground">
                        {st.firstName} {st.lastName}
                      </span>
                      {" — "}
                      {halfLabels[signTarget.half]}
                    </>
                  ) : null;
                })()}
            </DialogDescription>
          </DialogHeader>
          {signTarget && (
            <div className="space-y-3 pt-1">
              <Label className="font-heading text-muted-foreground">
                Signez dans le cadre
              </Label>
              <SignaturePad
                onSave={(dataUrl) => {
                  setSignature(
                    session.id,
                    signTarget.studentId,
                    signTarget.half,
                    dataUrl,
                  );
                  setSignTarget(null);
                  toast.success("Signature enregistrée.");
                }}
                onCancel={() => setSignTarget(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>

      <SessionPrintSummary
        organizationName={state.organizationName}
        session={session}
        students={students}
        formatFrenchDate={formatFrenchDateLong}
      />
    </div>
  );
}
