"use client";

import * as React from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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

type NoteSnippetsControlsProps = {
  snippets: string[];
  onAdd: (text: string) => void;
  onRemove: (index: number) => void;
  onInsert: (text: string) => void;
};

export function NoteSnippetsControls({
  snippets,
  onAdd,
  onRemove,
  onInsert,
}: NoteSnippetsControlsProps) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState("");

  const submitNew = () => {
    const t = draft.trim();
    if (!t) {
      toast.error("Texte vide.");
      return;
    }
    onAdd(t);
    setDraft("");
    toast.success("Modèle enregistré.");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-full"
          onClick={() => setOpen(true)}
        >
          <FileText className="size-4" />
          Gérer les modèles
        </Button>
        {snippets.length === 0 ? (
          <span className="text-xs text-muted-foreground">
            Aucun modèle — créez-en pour les réinsérer en un clic.
          </span>
        ) : null}
      </div>
      {snippets.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {snippets.map((s, i) => (
            <Button
              key={`${i}-${s.slice(0, 24)}`}
              type="button"
              variant="secondary"
              size="sm"
              className="max-w-full truncate rounded-full text-left font-normal"
              title={s}
              onClick={() => {
                onInsert(s);
                toast.message("Texte inséré dans les notes.");
              }}
            >
              {s.length > 42 ? `${s.slice(0, 40)}…` : s}
            </Button>
          ))}
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              Modèles de notes
            </DialogTitle>
            <DialogDescription>
              Phrases ou blocs réutilisables (lieu, formateur, horaires…). Un
              clic sous la zone de notes les insère.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="flex gap-2">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Nouveau modèle…"
                className="bg-background/80"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    submitNew();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                className="shrink-0 gap-1"
                onClick={submitNew}
              >
                <Plus className="size-4" />
                Ajouter
              </Button>
            </div>
            <Label className="text-muted-foreground">Enregistrés</Label>
            <ScrollArea className="h-48 rounded-lg border border-border/80">
              <ul className="divide-y divide-border/60 p-1">
                {snippets.length === 0 ? (
                  <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                    Liste vide.
                  </li>
                ) : (
                  snippets.map((s, i) => (
                    <li
                      key={`${i}-${s.slice(0, 20)}`}
                      className="flex items-start gap-2 py-2 pr-1"
                    >
                      <p className="min-w-0 flex-1 whitespace-pre-wrap text-sm">
                        {s}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        aria-label="Supprimer ce modèle"
                        onClick={() => {
                          onRemove(i);
                          toast.success("Modèle supprimé.");
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))
                )}
              </ul>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
