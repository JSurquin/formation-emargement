import type { Student } from "./types";

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        q = !q;
      }
    } else if ((c === "," || c === ";") && !q) {
      out.push(cur.trim());
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Détecte la colonne par libellés possibles (fr / en). */
function pickColumn(
  headers: string[],
  keys: string[],
): number {
  const lowered = headers.map(normHeader);
  for (const k of keys) {
    const i = lowered.indexOf(k);
    if (i >= 0) return i;
  }
  for (let i = 0; i < lowered.length; i++) {
    for (const k of keys) {
      if (lowered[i].includes(k)) return i;
    }
  }
  return -1;
}

export type ParsedStudentRow = Omit<Student, "id">;

/**
 * Import simple CSV / séparateur ; ou , avec en-têtes.
 * Colonnes reconnues : prénom/firstname, nom/lastname, email, téléphone/phone, société/company.
 */
export function parseStudentsCsv(text: string): ParsedStudentRow[] | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) return null;

  const headers = splitCsvLine(lines[0]);
  const iFn = pickColumn(headers, [
    "prenom",
    "firstname",
    "first name",
    "first_name",
  ]);
  const iLn = pickColumn(headers, [
    "nom",
    "lastname",
    "last name",
    "last_name",
    "name",
    "nom de famille",
  ]);
  if (iFn < 0 || iLn < 0) return null;

  const iEm = pickColumn(headers, ["email", "e-mail", "courriel", "mail"]);
  const iPh = pickColumn(headers, ["telephone", "tel", "phone", "mobile"]);
  const iCo = pickColumn(headers, ["societe", "company", "employeur", "structure"]);

  const out: ParsedStudentRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cells = splitCsvLine(lines[r]);
    const firstName = (cells[iFn] ?? "").trim();
    const lastName = (cells[iLn] ?? "").trim();
    if (!firstName || !lastName) continue;
    const row: ParsedStudentRow = { firstName, lastName };
    if (iEm >= 0) {
      const em = (cells[iEm] ?? "").trim();
      if (em) row.email = em;
    }
    if (iPh >= 0) {
      const ph = (cells[iPh] ?? "").trim();
      if (ph) row.phone = ph;
    }
    if (iCo >= 0) {
      const co = (cells[iCo] ?? "").trim();
      if (co) row.company = co;
    }
    out.push(row);
  }
  return out.length ? out : null;
}
