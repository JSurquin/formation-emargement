import type { Student } from "./types";

function isStudentLike(x: unknown): x is Omit<Student, "id"> {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.firstName === "string" &&
    typeof o.lastName === "string" &&
    o.firstName.trim().length > 0 &&
    o.lastName.trim().length > 0 &&
    (o.email === undefined || typeof o.email === "string") &&
    (o.phone === undefined || typeof o.phone === "string") &&
    (o.company === undefined || typeof o.company === "string")
  );
}

/**
 * Import annuaire : tableau de fiches ou objet `{ "students": [...] }`.
 * Chaque entrée devient une nouvelle fiche (nouveaux ids à la création).
 */
export function parseStudentsJsonArray(raw: unknown): Omit<Student, "id">[] | null {
  let arr: unknown[];
  if (Array.isArray(raw)) {
    arr = raw;
  } else if (
    raw &&
    typeof raw === "object" &&
    Array.isArray((raw as Record<string, unknown>).students)
  ) {
    arr = (raw as { students: unknown[] }).students;
  } else {
    return null;
  }
  const out: Omit<Student, "id">[] = [];
  for (const item of arr) {
    if (!isStudentLike(item)) continue;
    out.push({
      firstName: item.firstName.trim(),
      lastName: item.lastName.trim(),
      email: item.email?.trim() || undefined,
      phone: item.phone?.trim() || undefined,
      company: item.company?.trim() || undefined,
    });
  }
  return out.length ? out : null;
}
