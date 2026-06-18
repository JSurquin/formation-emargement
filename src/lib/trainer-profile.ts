import type { TrainerProfileDocument } from "./types";

export const TRAINER_PROFILE_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export const TRAINER_PROFILE_DOCUMENT_PRESETS = [
  { value: "kbis", label: "Extrait Kbis" },
  { value: "urssaf", label: "Attestation URSSAF / vigilance" },
  { value: "insurance", label: "Assurance RC Pro" },
  { value: "other", label: "Autre document" },
] as const;

export type TrainerProfileDocumentKind =
  (typeof TRAINER_PROFILE_DOCUMENT_PRESETS)[number]["value"];

export type TrainerProfileInput = {
  phone?: string;
  dateOfBirth?: string;
  company?: string;
  companySiret?: string;
  documents?: TrainerProfileDocument[];
};

export function normalizeCompanySiret(raw: string | undefined): string | undefined {
  const n = raw?.replace(/\s/g, "").trim();
  return n || undefined;
}

export function isTrainerProfileDocumentKind(
  value: string,
): value is TrainerProfileDocumentKind {
  return TRAINER_PROFILE_DOCUMENT_PRESETS.some((p) => p.value === value);
}

export function trainerProfileDocumentLabel(
  kind: TrainerProfileDocumentKind,
  customLabel?: string,
): string {
  if (kind === "other") return customLabel?.trim() || "Autre document";
  return (
    TRAINER_PROFILE_DOCUMENT_PRESETS.find((p) => p.value === kind)?.label ??
    "Document formateur"
  );
}

export function isValidTrainerProfileDocument(
  value: unknown,
): value is TrainerProfileDocument {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const doc = value as TrainerProfileDocument;
  return (
    typeof doc.id === "string" &&
    typeof doc.label === "string" &&
    isTrainerProfileDocumentKind(doc.kind) &&
    typeof doc.fileName === "string" &&
    typeof doc.mimeType === "string" &&
    typeof doc.dataUrl === "string" &&
    typeof doc.uploadedAt === "string"
  );
}

export function parseTrainerProfileDocuments(
  value: unknown,
): TrainerProfileDocument[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const out: TrainerProfileDocument[] = [];
  for (const item of value) {
    if (isValidTrainerProfileDocument(item)) out.push(item);
  }
  return out.length > 0 ? out : undefined;
}

export function normalizeTrainerProfileInput(input: TrainerProfileInput): {
  phone?: string;
  dateOfBirth?: string;
  company?: string;
  companySiret?: string;
  documents?: TrainerProfileDocument[];
} {
  return {
    phone: input.phone?.trim() || undefined,
    dateOfBirth: input.dateOfBirth?.trim() || undefined,
    company: input.company?.trim() || undefined,
    companySiret: normalizeCompanySiret(input.companySiret),
    documents: input.documents,
  };
}
