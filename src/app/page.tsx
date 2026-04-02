"use client";

import * as React from "react";
import Link from "next/link";
import { useFormation } from "@/components/providers/formation-provider";
import { useConfirm } from "@/components/confirm-provider";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { computeDashboardStats } from "@/lib/dashboard-stats";
import { DashboardStats } from "@/components/dashboard-stats";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import { useHomeSessionList } from "@/features/home/use-home-session-list";
import { OrganismeSaveCard } from "@/features/home/organisme-save-card";
import { NewSessionDialog } from "@/features/home/new-session-dialog";
import { SessionListToolbar } from "@/features/home/session-list-toolbar";
import { HomeSessionCard } from "@/features/home/home-session-card";
import { RecentSessionsStrip } from "@/features/home/recent-sessions-strip";
import {
  postponeBackupNudge,
  shouldShowBackupNudge,
} from "@/lib/backup-nudge";
import { toast } from "sonner";

export default function HomePage() {
  const { state, hydrated, updateSession, bulkSetSessionsArchived } =
    useFormation();
  const confirm = useConfirm();

  const {
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
    archiveScopeCount,
    sessionsDisplayed,
    idsToArchiveInList,
    idsToUnarchiveInList,
  } = useHomeSessionList(state.sessions, hydrated);

  const [editOpen, setEditOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editTagsRaw, setEditTagsRaw] = React.useState("");
  const [editLocation, setEditLocation] = React.useState("");
  const [editTrainer, setEditTrainer] = React.useState("");
  const [editFavorited, setEditFavorited] = React.useState(false);
  const [editArchived, setEditArchived] = React.useState(false);

  const openSessionEdit = React.useCallback(
    (id: string) => {
      const s = state.sessions.find((x) => x.id === id);
      if (!s) return;
      setEditId(id);
      setEditTitle(s.title);
      setEditDate(s.date);
      setEditTagsRaw((s.tags ?? []).join(", "));
      setEditLocation(s.location ?? "");
      setEditTrainer(s.trainer ?? "");
      setEditFavorited(Boolean(s.favorited));
      setEditArchived(Boolean(s.archived));
      setEditOpen(true);
    },
    [state.sessions],
  );

  const dashboardStats = React.useMemo(
    () => computeDashboardStats(state),
    [state],
  );

  useSlashFocus("session-search", hydrated);

  const hasExportableData =
    state.sessions.length > 0 || state.students.length > 0;

  React.useEffect(() => {
    if (!hydrated || !hasExportableData) return;
    if (!shouldShowBackupNudge()) return;
    const t = window.setTimeout(() => {
      toast.message("Sauvegarde locale", {
        id: "digiforma-backup-nudge",
        description:
          "Rien n’est envoyé sur un serveur : exportez un JSON de temps en temps pour ne rien perdre.",
        duration: 14_000,
        action: {
          label: "Aller à l’export",
          onClick: () => {
            postponeBackupNudge();
            document
              .getElementById("sauvegarde-donnees")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          },
        },
        onDismiss: () => postponeBackupNudge(),
        onAutoClose: () => postponeBackupNudge(),
      });
    }, 1600);
    return () => window.clearTimeout(t);
  }, [hydrated, hasExportableData]);

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-40 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Tableau de bord"
        title={
          <>
            Vos <GradientAccent>sessions</GradientAccent> de formation
          </>
        }
        description="Une session = une feuille (jour ou bloc) avec matin et après-midi. Raccourcis : / recherche, h accueil, n nouvelle session, e annuaire, s stats, ? aide."
        actions={<NewSessionDialog />}
      />

      <DashboardStats stats={dashboardStats} />

      <RecentSessionsStrip sessions={state.sessions} />

      <OrganismeSaveCard />

      {state.students.length === 0 && (
        <Card className="dg-surface-dashed ring-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Aucun élève pour l’instant
            </CardTitle>
            <CardDescription className="text-base">
              Enrichissez l&apos;annuaire pour pouvoir les cocher lors de la
              création d&apos;une session, ou les ajouter ensuite sur chaque
              feuille d&apos;émargement.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/eleves"
              className={cn(
                buttonVariants({ variant: "secondary" }),
                "h-10 rounded-full px-6 font-medium shadow-sm",
              )}
            >
              Gérer les élèves
            </Link>
          </CardContent>
        </Card>
      )}

      {state.sessions.length === 0 && state.students.length > 0 ? (
        <Card className="dg-surface-dashed ring-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Prêt pour la première session
            </CardTitle>
            <CardDescription className="text-base">
              Créez une session pour ouvrir les demi-journées et collecter les
              signatures.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : state.sessions.length === 0 ? null : sessionsDisplayed.length ===
        0 ? (
        <div className="space-y-4">
          <ParticipantSearchInput
            id="session-search"
            value={sessionListSearch}
            onChange={setSessionListSearch}
            placeholder="Rechercher une session (titre, date, notes…)…"
            aria-label="Filtrer la liste des sessions"
          />
          <Card className="dg-surface-dashed ring-0">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {archiveScopeCount === 0
                ? "Aucune session dans cette vue. Essayez « Toutes » ou changez le filtre actives / archives."
                : "Aucune session ne correspond à cette recherche ou aux filtres."}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          <ParticipantSearchInput
            id="session-search"
            value={sessionListSearch}
            onChange={setSessionListSearch}
            placeholder="Rechercher une session (titre, date, notes, étiquettes…)…"
            aria-label="Filtrer la liste des sessions"
            className="max-w-xl"
          />
          <SessionListToolbar
            archiveListFilter={archiveListFilter}
            setArchiveListFilter={setArchiveListFilter}
            sortMode={sortMode}
            setSortMode={setSortMode}
            tagFilter={tagFilter}
            setTagFilter={setTagFilter}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            favoritesOnly={favoritesOnly}
            setFavoritesOnly={setFavoritesOnly}
            incompleteOnly={incompleteOnly}
            setIncompleteOnly={setIncompleteOnly}
            idsToArchiveInList={idsToArchiveInList}
            idsToUnarchiveInList={idsToUnarchiveInList}
            bulkSetSessionsArchived={bulkSetSessionsArchived}
            onConfirmBulk={(opts) =>
              confirm({
                title: opts.title,
                description: opts.description,
                confirmLabel: opts.confirmLabel,
              })
            }
          />
          {sessionListSearch.trim() ||
          favoritesOnly ||
          tagFilter.trim() ||
          archiveListFilter !== "all" ||
          incompleteOnly ||
          dateFrom.trim() ||
          dateTo.trim() ? (
            <p className="text-xs text-muted-foreground">
              {sessionsDisplayed.length} / {archiveScopeCount} session
              {archiveScopeCount > 1 ? "s" : ""}
              {archiveListFilter !== "all" ||
              incompleteOnly ||
              dateFrom.trim() ||
              dateTo.trim()
                ? " dans cette vue"
                : ""}
            </p>
          ) : null}
          <ul className="space-y-4">
            {sessionsDisplayed.map((sess) => (
              <HomeSessionCard
                key={sess.id}
                session={sess}
                onEdit={openSessionEdit}
              />
            ))}
          </ul>
        </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) setEditId(null);
        }}
      >
        <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!editId || !editTitle.trim()) {
                toast.error("Indiquez un intitulé.");
                return;
              }
              const tagParts = editTagsRaw
                .split(/[,;]/)
                .map((x) => x.trim())
                .filter(Boolean);
              updateSession(editId, {
                title: editTitle.trim(),
                date: editDate,
                tags: tagParts,
                favorited: editFavorited,
                archived: editArchived,
                location: editLocation.trim() || undefined,
                trainer: editTrainer.trim() || undefined,
              });
              setEditOpen(false);
              setEditId(null);
              toast.success("Session mise à jour.");
            }}
          >
            <DialogHeader>
              <DialogTitle className="font-heading text-lg">
                Modifier la session
              </DialogTitle>
              <DialogDescription>
                Intitulé, date, lieu, intervenant, étiquettes, favori et
                archivage — la liste des élèves et les signatures restent sur la
                feuille d’émargement.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Intitulé</Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-location">Lieu</Label>
                  <Input
                    id="edit-location"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="bg-background/80"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-trainer">Intervenant</Label>
                  <Input
                    id="edit-trainer"
                    value={editTrainer}
                    onChange={(e) => setEditTrainer(e.target.value)}
                    className="bg-background/80"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-tags">Étiquettes (virgules)</Label>
                <Input
                  id="edit-tags"
                  value={editTagsRaw}
                  onChange={(e) => setEditTagsRaw(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={editFavorited}
                  onCheckedChange={(v) => setEditFavorited(v === true)}
                />
                Session favorite
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={editArchived}
                  onCheckedChange={(v) => setEditArchived(v === true)}
                />
                Session archivée (historique, masquée du filtre « Actives »)
              </label>
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-gradient">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
