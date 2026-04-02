"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import { toast } from "sonner";
import { useFormation } from "@/components/providers/formation-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { filterStudentsByQuery } from "@/lib/student-search";
import { todayInputValue } from "./today-input-value";

export function NewSessionDialog() {
  const { state, addSession, addSessionTemplate } = useFormation();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [date, setDate] = React.useState(() => todayInputValue());
  const [pickedIds, setPickedIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const [participantSearch, setParticipantSearch] = React.useState("");
  const [newTagsRaw, setNewTagsRaw] = React.useState("");
  const [newLocation, setNewLocation] = React.useState("");
  const [newTrainer, setNewTrainer] = React.useState("");
  const [templateName, setTemplateName] = React.useState("");

  React.useEffect(() => {
    const openEv = () => {
      setOpen(true);
      setPickedIds(new Set());
      setParticipantSearch("");
      setNewTagsRaw("");
      setTemplateName("");
    };
    window.addEventListener("digiforma:open-new-session", openEv);
    return () => window.removeEventListener("digiforma:open-new-session", openEv);
  }, []);

  const studentsInDialog = React.useMemo(
    () => filterStudentsByQuery(state.students, participantSearch),
    [state.students, participantSearch],
  );

  const selectBulkInDialog = () => {
    const list = participantSearch.trim()
      ? studentsInDialog
      : state.students;
    setPickedIds(new Set(list.map((s) => s.id)));
  };

  const clearPicksInDialog = () => {
    setPickedIds(new Set());
  };

  const onCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Indiquez un intitulé de session.");
      return;
    }
    const ids = [...pickedIds];
    const tagParts = newTagsRaw
      .split(/[,;]/)
      .map((x) => x.trim())
      .filter(Boolean);
    addSession({
      title: title.trim(),
      date,
      studentIds: ids,
      tags: tagParts.length ? tagParts : undefined,
      location: newLocation.trim() || undefined,
      trainer: newTrainer.trim() || undefined,
    });
    setTitle("");
    setDate(todayInputValue());
    setPickedIds(new Set());
    setNewTagsRaw("");
    setNewLocation("");
    setNewTrainer("");
    setTemplateName("");
    setOpen(false);
    if (state.students.length === 0) {
      toast.success(
        "Session créée. Renseignez l’annuaire, puis ajoutez les élèves sur la feuille.",
      );
    } else if (ids.length === 0) {
      toast.success(
        "Session créée. Aucun élève coché — ajoutez-les depuis l’émargement.",
      );
    } else {
      toast.success("Session créée.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPickedIds(new Set());
          setParticipantSearch("");
          setNewTagsRaw("");
          setNewLocation("");
          setNewTrainer("");
          setTemplateName("");
        }
      }}
    >
      <Button
        type="button"
        className="btn-gradient w-full gap-2 sm:w-auto"
        onClick={() => setOpen(true)}
      >
        <CalendarPlus className="size-4" />
        Nouvelle session
      </Button>
      <DialogContent className="max-h-[min(90dvh,calc(100dvh-1rem))] border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-lg">
        <form onSubmit={onCreate}>
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Nouvelle session
            </DialogTitle>
            <DialogDescription>
              Choisissez quels élèves de l&apos;annuaire figurent sur cette
              feuille. Rien n&apos;est ajouté automatiquement : vous pouvez aussi
              laisser vide et compléter plus tard depuis l&apos;émargement.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-title">Intitulé</Label>
              <Input
                id="session-title"
                placeholder="ex. Module sécurité au travail"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-date">Date</Label>
              <Input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="session-tags">Étiquettes (optionnel)</Label>
              <Input
                id="session-tags"
                placeholder="ex. SST, Paris — séparées par des virgules"
                value={newTagsRaw}
                onChange={(e) => setNewTagsRaw(e.target.value)}
                className="bg-background/80"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="session-location">Lieu (optionnel)</Label>
                <Input
                  id="session-location"
                  placeholder="Salle, adresse…"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="bg-background/80"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="session-trainer">Intervenant (optionnel)</Label>
                <Input
                  id="session-trainer"
                  placeholder="Nom du formateur"
                  value={newTrainer}
                  onChange={(e) => setNewTrainer(e.target.value)}
                  className="bg-background/80"
                />
              </div>
            </div>
            {(state.sessionTemplates ?? []).length > 0 ? (
              <div className="grid gap-2">
                <Label htmlFor="apply-template">Modèle de groupe</Label>
                <select
                  id="apply-template"
                  className="h-10 w-full rounded-md border border-input bg-background/80 px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    e.target.value = "";
                    const tpl = (state.sessionTemplates ?? []).find(
                      (t) => t.id === id,
                    );
                    if (tpl) setPickedIds(new Set(tpl.studentIds));
                  }}
                >
                  <option value="">Appliquer un modèle…</option>
                  {(state.sessionTemplates ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.studentIds.length} élève
                      {t.studentIds.length > 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-foreground">
                  Élèves sur cette session
                </Label>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={selectBulkInDialog}
                    disabled={
                      state.students.length === 0 ||
                      (participantSearch.trim().length > 0 &&
                        studentsInDialog.length === 0)
                    }
                  >
                    {participantSearch.trim()
                      ? `Cocher les résultats (${studentsInDialog.length})`
                      : "Tout sélectionner"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={clearPicksInDialog}
                  >
                    Aucun
                  </Button>
                </div>
              </div>
              {state.students.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                  L&apos;annuaire est vide.{" "}
                  <Link
                    href="/eleves"
                    className="font-medium text-indigo-600 underline underline-offset-2 dark:text-violet-300"
                    onClick={() => setOpen(false)}
                  >
                    Créer des élèves
                  </Link>{" "}
                  puis ouvrez à nouveau cette fenêtre, ou créez la session et
                  ajoutez-les depuis la feuille.
                </p>
              ) : (
                <>
                  <ParticipantSearchInput
                    id="dialog-participant-search"
                    value={participantSearch}
                    onChange={setParticipantSearch}
                    placeholder="Filtrer prénom, nom, e-mail…"
                    aria-label="Rechercher dans l’annuaire pour la session"
                  />
                  <ScrollArea className="h-52 rounded-xl border border-border/80 bg-muted/20 px-3 py-2">
                    {studentsInDialog.length === 0 ? (
                      <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                        Aucun élève ne correspond à votre recherche.
                      </p>
                    ) : (
                      <ul className="space-y-1 pr-3">
                        {studentsInDialog.map((s) => (
                          <li key={s.id}>
                            <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-background/80">
                              <Checkbox
                                checked={pickedIds.has(s.id)}
                                onCheckedChange={(v) => {
                                  setPickedIds((prev) => {
                                    const next = new Set(prev);
                                    if (v === true) next.add(s.id);
                                    else next.delete(s.id);
                                    return next;
                                  });
                                }}
                              />
                              <span className="min-w-0 flex-1 text-sm font-medium leading-tight">
                                <span className="block">
                                  {s.firstName} {s.lastName}
                                </span>
                                {s.email ? (
                                  <span className="block truncate text-xs font-normal text-muted-foreground">
                                    {s.email}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    )}
                  </ScrollArea>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                {participantSearch.trim() ? (
                  <>
                    Affichage : {studentsInDialog.length} /{" "}
                    {state.students.length} —{" "}
                  </>
                ) : null}
                {pickedIds.size === 0
                  ? "Aucune sélection pour l’instant."
                  : `${pickedIds.size} élève${pickedIds.size > 1 ? "s" : ""} sélectionné${pickedIds.size > 1 ? "s" : ""}.`}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="grid min-w-0 flex-1 gap-2">
                  <Label htmlFor="save-template-name">
                    Enregistrer la sélection comme modèle
                  </Label>
                  <Input
                    id="save-template-name"
                    placeholder="Nom du modèle (ex. Équipe A)"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="bg-background/80"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  disabled={pickedIds.size === 0}
                  onClick={() => {
                    const n = templateName.trim();
                    if (!n) {
                      toast.error("Indiquez un nom pour le modèle.");
                      return;
                    }
                    addSessionTemplate(n, [...pickedIds]);
                    setTemplateName("");
                    toast.success("Modèle enregistré.");
                  }}
                >
                  Enregistrer le modèle
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="btn-gradient">
              Créer la session
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
