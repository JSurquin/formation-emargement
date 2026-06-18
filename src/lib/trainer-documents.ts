import type { TrainerDocument } from "./types";

export const TRAINER_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export const TRAINER_DOCUMENT_PRESETS = [
  { value: "mission_order", label: "Ordre de mission" },
  { value: "other", label: "Autre document" },
] as const;

export type TrainerDocumentKind =
  (typeof TRAINER_DOCUMENT_PRESETS)[number]["value"];

export function isTrainerDocumentKind(value: string): value is TrainerDocumentKind {
  return TRAINER_DOCUMENT_PRESETS.some((p) => p.value === value);
}

export function trainerDocumentLabel(
  kind: TrainerDocumentKind,
  customLabel?: string,
): string {
  if (kind === "other") return customLabel?.trim() || "Autre document";
  return (
    TRAINER_DOCUMENT_PRESETS.find((p) => p.value === kind)?.label ??
    "Document formateur"
  );
}

export function countTrainerDocuments(
  documents: TrainerDocument[] | undefined,
): number {
  return documents?.length ?? 0;
}
