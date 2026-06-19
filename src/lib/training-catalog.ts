import type { TrainingCatalogEntry } from "./types";

export const TRAINING_CATALOG_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export const TRAINING_CATALOG_DOCUMENT_PRESETS = [
  { value: "program", label: "Programme de formation" },
  { value: "brochure", label: "Brochure / plaquette" },
  { value: "other", label: "Autre document" },
] as const;

export type TrainingCatalogDocumentKind =
  (typeof TRAINING_CATALOG_DOCUMENT_PRESETS)[number]["value"];

export function isTrainingCatalogDocumentKind(
  value: string,
): value is TrainingCatalogDocumentKind {
  return TRAINING_CATALOG_DOCUMENT_PRESETS.some((p) => p.value === value);
}

export function trainingCatalogDocumentLabel(
  kind: TrainingCatalogDocumentKind,
  customLabel?: string,
): string {
  if (kind === "other") return customLabel?.trim() || "Autre document";
  return (
    TRAINING_CATALOG_DOCUMENT_PRESETS.find((p) => p.value === kind)?.label ??
    "Document"
  );
}

export function countTrainingCatalogDocuments(
  entry: Pick<TrainingCatalogEntry, "documents">,
): number {
  return entry.documents?.length ?? 0;
}

export function filterTrainingCatalogByQuery(
  entries: TrainingCatalogEntry[],
  query: string,
): TrainingCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((entry) => {
    const haystack = [
      entry.title,
      entry.description,
      entry.duration,
      entry.reference,
      ...(entry.documents?.map((d) => `${d.label} ${d.fileName}`) ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}
