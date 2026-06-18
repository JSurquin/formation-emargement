export type FundingMethod =
  | "cpf"
  | "opco"
  | "employeur"
  | "france_travail"
  | "personnel"
  | "autre";

export const FUNDING_METHOD_OPTIONS: ReadonlyArray<{
  value: FundingMethod;
  label: string;
}> = [
  { value: "cpf", label: "CPF" },
  { value: "opco", label: "OPCO / financeur de compétences" },
  { value: "employeur", label: "Plan de formation (employeur)" },
  { value: "france_travail", label: "France Travail" },
  { value: "personnel", label: "Personnel / à titre individuel" },
  { value: "autre", label: "Autre" },
];

export function getFundingMethodLabel(
  value: FundingMethod | string | undefined,
): string | undefined {
  if (!value) return undefined;
  return FUNDING_METHOD_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function isFundingMethod(value: string): value is FundingMethod {
  return FUNDING_METHOD_OPTIONS.some((o) => o.value === value);
}

/** Relance documents : financeur pour plan employeur, candidat sinon. */
export function usesFunderEmailForDocumentReminder(
  fundingMethod: FundingMethod | undefined,
): boolean {
  return fundingMethod === "employeur";
}

export function normalizeFundingMethodFromImport(
  raw: string,
): FundingMethod | undefined {
  const v = raw.trim().toLowerCase();
  if (!v) return undefined;
  if (isFundingMethod(v)) return v;
  if (v.includes("cpf")) return "cpf";
  if (v.includes("opco") || v.includes("compétence") || v.includes("competence")) {
    return "opco";
  }
  if (v.includes("employ") || v.includes("entreprise")) return "employeur";
  if (v.includes("france travail") || v.includes("pôle emploi") || v.includes("pole emploi")) {
    return "france_travail";
  }
  if (v.includes("personnel") || v.includes("individuel")) return "personnel";
  return "autre";
}
