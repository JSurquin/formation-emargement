import { getFundingMethodLabel } from "./funding-method";
import { hasConventionBeenCreated, isConventionSigned } from "./convention-list";
import { formatAmountHt } from "./billing";
import type { Student, TrainingSession } from "./types";

export type FunderShareRow = {
  funderKey: string;
  funderName: string;
  funderEmail?: string;
  funderSiret?: string;
  students: Array<{
    student: Student;
    sessions: TrainingSession[];
    conventionCreated: boolean;
    conventionSigned: boolean;
    totalAmountHt: number;
  }>;
  totalAmountHt: number;
  studentCount: number;
};

function funderKeyForStudent(student: Student): string {
  const name = student.funderName?.trim() || "Sans financeur renseigné";
  const siret = student.funderSiret?.trim() || "";
  return `${name}::${siret}`;
}

export function listFunderShareRows(
  students: Student[],
  sessions: TrainingSession[],
): FunderShareRow[] {
  const map = new Map<string, FunderShareRow>();

  for (const student of students) {
    const key = funderKeyForStudent(student);
    const studentSessions = sessions.filter((s) =>
      s.studentIds.includes(student.id),
    );
    if (studentSessions.length === 0) continue;

    let totalAmountHt = 0;
    for (const sess of studentSessions) {
      totalAmountHt += sess.sessionAccounting?.[student.id]?.amountHt ?? 0;
    }

    const entry = {
      student,
      sessions: studentSessions.sort((a, b) => b.date.localeCompare(a.date)),
      conventionCreated: hasConventionBeenCreated(student),
      conventionSigned: isConventionSigned(student),
      totalAmountHt,
    };

    const existing = map.get(key);
    if (existing) {
      existing.students.push(entry);
      existing.totalAmountHt += totalAmountHt;
      existing.studentCount += 1;
    } else {
      map.set(key, {
        funderKey: key,
        funderName: student.funderName?.trim() || "Sans financeur renseigné",
        funderEmail: student.funderEmail?.trim() || undefined,
        funderSiret: student.funderSiret?.trim() || undefined,
        students: [entry],
        totalAmountHt,
        studentCount: 1,
      });
    }
  }

  return [...map.values()].sort((a, b) =>
    a.funderName.localeCompare(b.funderName, "fr"),
  );
}

export function buildFunderShareSummaryText(row: FunderShareRow): string {
  const lines = [
    `Financeur : ${row.funderName}`,
    row.funderSiret ? `SIRET : ${row.funderSiret}` : null,
    `${row.studentCount} stagiaire(s) — montant total HT : ${formatAmountHt(row.totalAmountHt)}`,
    "",
    "Stagiaires :",
  ].filter((l): l is string => l !== null);

  for (const item of row.students) {
    const funding = item.student.fundingMethod
      ? getFundingMethodLabel(item.student.fundingMethod)
      : "Non renseigné";
    const conv = item.conventionSigned
      ? "convention signée"
      : item.conventionCreated
        ? "convention créée"
        : "convention à créer";
    lines.push(
      `- ${item.student.firstName} ${item.student.lastName} (${funding}, ${conv})`,
    );
  }

  return lines.join("\n");
}
