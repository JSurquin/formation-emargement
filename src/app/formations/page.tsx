"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { ParticipantSearchInput } from "@/components/participant-search-input";
import { TrainingCatalogDocuments } from "@/components/training-catalog-documents";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useSlashFocus } from "@/hooks/use-slash-focus";
import {
  countTrainingCatalogDocuments,
  filterTrainingCatalogByQuery,
} from "@/lib/training-catalog";
import type { TrainingCatalogEntry } from "@/lib/types";

export default function FormationsPage() {
  const {
    state,
    hydrated,
    addTrainingCatalogEntry,
    updateTrainingCatalogEntry,
    removeTrainingCatalogEntry,
  } = useFormation();

  const [q, setQ] = React.useState("");
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [editEntry, setEditEntry] = React.useState<TrainingCatalogEntry | null>(
    null,
  );

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [reference, setReference] = React.useState("");

  const entries = React.useMemo(
    () =>
      [...(state.trainingCatalog ?? [])].sort((a, b) =>
        a.title.localeCompare(b.title, "fr"),
      ),
    [state.trainingCatalog],
  );

  const filtered = React.useMemo(
    () => filterTrainingCatalogByQuery(entries, q),
    [entries, q],
  );

  useSlashFocus("formations-search", hydrated);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDuration("");
    setReference("");
  };

  const openCreate = () => {
    resetForm();
    setCreateOpen(true);
  };

  const openEdit = (entry: TrainingCatalogEntry) => {
    setEditEntry(entry);
    setTitle(entry.title);
    setDescription(entry.description ?? "");
    setDuration(entry.duration ?? "");
    setReference(entry.reference ?? "");
  };

  const submitCreate = () => {
    const t = title.trim();
    if (!t) {
      toast.error("Indiquez un intitulé de formation.");
      return;
    }
    addTrainingCatalogEntry({
      title: t,
      description,
      duration,
      reference,
    });
    resetForm();
    setCreateOpen(false);
    toast.success("Formation ajoutée au catalogue.");
  };

  const submitEdit = () => {
    if (!editEntry) return;
    const t = title.trim();
    if (!t) {
      toast.error("Indiquez un intitulé de formation.");
      return;
    }
    updateTrainingCatalogEntry(editEntry.id, {
      title: t,
      description,
      duration,
      reference,
    });
    setEditEntry(null);
    resetForm();
    toast.success("Fiche formation mise à jour.");
  };

  const removeEntry = (entry: TrainingCatalogEntry) => {
    if (
      !window.confirm(
        `Retirer « ${entry.title} » du catalogue ? Les documents associés seront supprimés.`,
      )
    ) {
      return;
    }
    removeTrainingCatalogEntry(entry.id);
    if (expandedId === entry.id) setExpandedId(null);
    toast.success("Formation retirée du catalogue.");
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
        eyebrow="Catalogue"
        title={
          <>
            Annuaire des <GradientAccent>formations</GradientAccent>
          </>
        }
        description="Retrouvez ici toutes vos offres de formation et leurs documents (programmes pour France Travail, brochures, pièces à transmettre aux financeurs)."
        actions={
          <Button
            type="button"
            className="gap-2 rounded-full"
            onClick={openCreate}
          >
            <Plus className="size-4" />
            Nouvelle formation
          </Button>
        }
      />

      <Card className="dg-surface ring-0">
        <CardHeader className="space-y-4 border-b border-border/50 dark:border-white/10">
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <BookOpen className="size-4" />
            </span>
            {entries.length}{" "}
            {entries.length > 1 ? "formations référencées" : "formation référencée"}
          </CardTitle>
          <CardDescription>
            Chaque fiche peut contenir des programmes PDF ou images à envoyer aux
            organismes de financement. Touche / pour filtrer la liste.
          </CardDescription>
          {entries.length > 0 ? (
            <ParticipantSearchInput
              id="formations-search"
              value={q}
              onChange={setQ}
              placeholder="Rechercher une formation, une référence, un document…"
            />
          ) : null}
        </CardHeader>
        <CardContent className="pt-6">
          {entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-6 py-10 text-center">
              <FolderOpen className="mx-auto size-10 text-muted-foreground/70" />
              <p className="mt-4 font-medium">Aucune formation dans le catalogue</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Ajoutez vos formations pour centraliser les programmes et pièces
                à transmettre (France Travail, OPCO, etc.).
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-6 gap-2 rounded-full"
                onClick={openCreate}
              >
                <Plus className="size-4" />
                Créer la première fiche
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Aucune formation ne correspond à votre recherche.
            </p>
          ) : (
            <ul className="space-y-4">
              {filtered.map((entry) => {
                const expanded = expandedId === entry.id;
                const docCount = countTrainingCatalogDocuments(entry);
                return (
                  <li
                    key={entry.id}
                    className="overflow-hidden rounded-2xl border border-border/70 bg-muted/15 dark:border-white/10 dark:bg-white/5"
                  >
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="font-heading text-base font-semibold">
                          {entry.title}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          {entry.reference ? (
                            <span>Réf. {entry.reference}</span>
                          ) : null}
                          {entry.duration ? (
                            <span>Durée {entry.duration}</span>
                          ) : null}
                          <span>
                            {docCount}{" "}
                            {docCount > 1 ? "documents" : "document"}
                          </span>
                        </div>
                        {entry.description ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-full"
                          onClick={() =>
                            setExpandedId(expanded ? null : entry.id)
                          }
                        >
                          {expanded ? (
                            <ChevronUp className="size-3.5" />
                          ) : (
                            <ChevronDown className="size-3.5" />
                          )}
                          Documents
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="gap-1.5 rounded-full"
                          onClick={() => openEdit(entry)}
                        >
                          <Pencil className="size-3.5" />
                          Modifier
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => removeEntry(entry)}
                        >
                          <Trash2 className="size-3.5" />
                          Retirer
                        </Button>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="border-t border-border/60 px-4 py-5 dark:border-white/10">
                        <TrainingCatalogDocuments
                          documents={entry.documents ?? []}
                          onChange={(documents) =>
                            updateTrainingCatalogEntry(entry.id, { documents })
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Nouvelle formation</DialogTitle>
            <DialogDescription>
              Créez une fiche dans le catalogue. Vous pourrez ensuite y joindre
              le programme et les pièces utiles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="create-title">Intitulé</Label>
              <Input
                id="create-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Excel avancé — bureautique"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="create-reference">Référence (optionnel)</Label>
                <Input
                  id="create-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="ex. FORM-2026-01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-duration">Durée (optionnel)</Label>
                <Input
                  id="create-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="ex. 14 h"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create-description">Description (optionnel)</Label>
              <Textarea
                id="create-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Notes internes, public visé, modalité…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setCreateOpen(false)}
            >
              Annuler
            </Button>
            <Button type="button" className="rounded-full" onClick={submitCreate}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editEntry !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditEntry(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">
              Modifier la fiche formation
            </DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de cette formation du catalogue.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Intitulé</Label>
              <Input
                id="edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-reference">Référence</Label>
                <Input
                  id="edit-reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-duration">Durée</Label>
                <Input
                  id="edit-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => {
                setEditEntry(null);
                resetForm();
              }}
            >
              Annuler
            </Button>
            <Button type="button" className="rounded-full" onClick={submitEdit}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
