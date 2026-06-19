"use client";

import * as React from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/id";
import type { TrainingCatalogDocument } from "@/lib/types";
import {
  TRAINING_CATALOG_DOCUMENT_MAX_BYTES,
  TRAINING_CATALOG_DOCUMENT_PRESETS,
  type TrainingCatalogDocumentKind,
  trainingCatalogDocumentLabel,
} from "@/lib/training-catalog";

type TrainingCatalogDocumentsProps = {
  documents: TrainingCatalogDocument[];
  onChange: (documents: TrainingCatalogDocument[]) => void;
};

export function TrainingCatalogDocuments({
  documents,
  onChange,
}: TrainingCatalogDocumentsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [docKind, setDocKind] =
    React.useState<TrainingCatalogDocumentKind>("program");
  const [docLabel, setDocLabel] = React.useState("");

  const onPickDocument = () => fileInputRef.current?.click();

  const onDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (file.size > TRAINING_CATALOG_DOCUMENT_MAX_BYTES) {
      toast.error("Fichier trop volumineux (4 Mo maximum par document).");
      return;
    }

    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) {
      toast.error("Formats acceptés : images (JPG, PNG…) ou PDF.");
      return;
    }

    const label = trainingCatalogDocumentLabel(docKind, docLabel);
    const reader = new FileReader();
    reader.onload = () => {
      const doc: TrainingCatalogDocument = {
        id: newId(),
        label,
        kind: docKind,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        dataUrl: String(reader.result),
        uploadedAt: new Date().toISOString(),
      };
      onChange([...documents, doc]);
      setDocLabel("");
      toast.success("Document ajouté à la fiche formation.");
    };
    reader.onerror = () => toast.error("Impossible de lire ce fichier.");
    reader.readAsDataURL(file);
  };

  const removeDocument = (docId: string) => {
    onChange(documents.filter((d) => d.id !== docId));
    toast.success("Document retiré.");
  };

  return (
    <div className="space-y-4">
      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
          Aucun document pour cette formation (programme, brochure…).
        </p>
      ) : (
        <ul className="space-y-3">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10 dark:bg-white/5"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 font-medium">
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  {doc.label}
                </p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {doc.fileName} ·{" "}
                  {new Date(doc.uploadedAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <a
                  href={doc.dataUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 rounded-full",
                  )}
                >
                  <ExternalLink className="size-3.5" />
                  Ouvrir
                </a>
                <a
                  href={doc.dataUrl}
                  download={doc.fileName}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-1.5 rounded-full",
                  )}
                >
                  <Download className="size-3.5" />
                  Télécharger
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => removeDocument(doc.id)}
                >
                  <Trash2 className="size-3.5" />
                  Retirer
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-border/70 bg-muted/15 p-4 dark:border-white/10">
        <p className="mb-3 font-heading text-sm font-semibold">
          Ajouter un document
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="catalog-doc-kind">Type de document</Label>
            <Select
              value={docKind}
              onValueChange={(v) => {
                if (
                  v === "program" ||
                  v === "brochure" ||
                  v === "other"
                ) {
                  setDocKind(v);
                }
              }}
            >
              <SelectTrigger id="catalog-doc-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRAINING_CATALOG_DOCUMENT_PRESETS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {docKind === "other" ? (
            <div className="grid gap-2">
              <Label htmlFor="catalog-doc-label">Libellé</Label>
              <Input
                id="catalog-doc-label"
                value={docLabel}
                onChange={(e) => setDocLabel(e.target.value)}
                placeholder="ex. Fiche France Travail"
                className="bg-background/80"
              />
            </div>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={onDocumentSelected}
        />
        <Button
          type="button"
          variant="outline"
          className="mt-4 gap-2 rounded-full"
          onClick={onPickDocument}
        >
          <Upload className="size-4" />
          Choisir un fichier
        </Button>
      </div>
    </div>
  );
}
