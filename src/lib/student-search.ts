import type { Student } from "./types";

function fold(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .trim();
}

/** Filtre sur prénom, nom, e-mail et nom complet (insensible à la casse / accents). */
export function filterStudentsByQuery(
  students: Student[],
  rawQuery: string,
): Student[] {
  const q = fold(rawQuery);
  if (!q) return students;
  const tokens = q.split(/\s+/).filter(Boolean);
  return students.filter((s) => {
    const blob = fold(
      [
        s.firstName,
        s.lastName,
        s.email ?? "",
        s.phone ?? "",
        s.company ?? "",
        `${s.firstName} ${s.lastName}`,
      ].join(" "),
    );
    return tokens.every((t) => blob.includes(t));
  });
}
