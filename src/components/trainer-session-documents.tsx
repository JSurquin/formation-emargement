"use client";

import * as React from "react";
import {
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { newId } from "@/lib/id";
import type { TrainerDocument } from "@/lib/types";
import {
  TRAINER_DOCUMENT_MAX_BYTES,
  TRAINER_DOCUMENT_PRESETS,
  type TrainerDocumentKind,
  trainerDocumentLabel,
} from "@/lib/trainer-documents";

type TrainerSessionDocumentsProps = {
  documents: TrainerDocument[];
  readOnly?: boolean;
  onChange?: (documents: TrainerDocument[]) => void;
  title?: string;
  description?: string;
  compact?: boolean;
};

export function TrainerSessionDocuments({
  documents,
  readOnly = false,
  onChange,
  title = "Documents formateur",
  description = "Ordre de mission et pièces utiles pour l'intervenant (images ou PDF, 4 Mo max).",
  compact = false,
}: TrainerSessionDocumentsProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [docKind, setDocKind] =
    React.useState<TrainerDocumentKind>("mission_order");
  const [docLabel, setDocLabel] = React.useState("");

  const onPickDocument = () => fileInputRef.current?.click();

  const onDocumentSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !onChange) return;

    if (file.size > TRAINER_DOCUMENT_MAX_BYTES) {
      toast.error("Fichier trop volumineux (4 Mo maximum par document).");
      return;
    }

    const allowed =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!allowed) {
      toast.error("Formats acceptés : images (JPG, PNG…) ou PDF.");
      return;
    }

    const label = trainerDocumentLabel(docKind, docLabel);

    const reader = new FileReader();
    reader.onload = () => {
      const doc: TrainerDocument = {
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
      toast.success("Document ajouté pour le formateur.");
    };
    reader.onerror = () => toast.error("Impossible de lire ce fichier.");
    reader.readAsDataURL(file);
  };

  const removeDocument = (docId: string) => {
    if (!onChange) return;
    onChange(documents.filter((d) => d.id !== docId));
    toast.success("Document retiré.");
  };

  const list = (
    <>
      {documents.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          {readOnly
            ? "Aucun document disponible pour le moment."
            : "Aucun document formateur pour cette session."}
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
                {!readOnly ? (
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
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );

  if (compact) {
    return <div className="space-y-3">{list}</div>;
  }

  return (
    <Card className="dg-surface ring-0">
      <CardHeader className="border-b border-border/50 pb-4 dark:border-white/10">
        <CardTitle className="flex items-center gap-2 font-heading text-lg">
          <FolderOpen className="size-5 text-indigo-600 dark:text-violet-300" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {list}
        {!readOnly ? (
          <div className="rounded-xl border border-border/70 bg-muted/15 p-4 dark:border-white/10">
            <p className="mb-3 font-heading text-sm font-semibold">
              Ajouter un document
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="trainer-doc-kind">Type de document</Label>
                <Select
                  value={docKind}
                  onValueChange={(v) => {
                    if (v === "mission_order" || v === "other") setDocKind(v);
                  }}
                >
                  <SelectTrigger id="trainer-doc-kind">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TRAINER_DOCUMENT_PRESETS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {docKind === "other" ? (
                <div className="grid gap-2">
                  <Label htmlFor="trainer-doc-label">Libellé</Label>
                  <Input
                    id="trainer-doc-label"
                    value={docLabel}
                    onChange={(e) => setDocLabel(e.target.value)}
                    placeholder="ex. Convocation formateur"
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
        ) : null}
      </CardContent>
    </Card>
  );
}
