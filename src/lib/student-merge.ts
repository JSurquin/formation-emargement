import type { Student } from "./types";

/**
 * Fusionne une liste d’élèves « entrants » dans l’annuaire local (clé = id).
 * Même règle que la fusion d’export global : champs optionnels entrants
 * n’écrasent pas l’existant s’ils sont absents.
 */
export function mergeStudentsIntoLocal(
  local: Student[],
  incoming: Student[],
): Student[] {
  const studentById = new Map(local.map((s) => [s.id, { ...s }]));

  for (const s of incoming) {
    const cur = studentById.get(s.id);
    if (cur) {
      studentById.set(s.id, {
        ...cur,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email !== undefined ? s.email : cur.email,
        phone: s.phone !== undefined ? s.phone : cur.phone,
        company: s.company !== undefined ? s.company : cur.company,
      });
    } else {
      studentById.set(s.id, { ...s });
    }
  }

  return Array.from(studentById.values());
}
