export type Funder = {
  id: string;
  name: string;
  siret?: string;
  email?: string;
};

export type FunderInput = {
  name?: string;
  siret?: string;
  email?: string;
};

export function normalizeFunderSiret(raw: string | undefined): string | undefined {
  const n = raw?.replace(/\s/g, "").trim();
  return n || undefined;
}

export function normalizeFunderInput(input: FunderInput): {
  name: string;
  siret?: string;
  email?: string;
} | null {
  const name = input.name?.trim();
  if (!name) return null;
  return {
    name,
    siret: normalizeFunderSiret(input.siret),
    email: input.email?.trim() || undefined,
  };
}
