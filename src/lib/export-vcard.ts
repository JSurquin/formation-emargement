import type { Student } from "./types";

function escapeVcfValue(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

/** Une fiche élève → fichier .vcf (vCard 3.0 simple). */
export function downloadStudentVcard(student: Student, filenameBase?: string): void {
  const fn = escapeVcfValue(student.firstName.trim());
  const ln = escapeVcfValue(student.lastName.trim());
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fn} ${ln}`,
    `N:${ln};${fn};;;`,
  ];
  if (student.email?.trim()) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVcfValue(student.email.trim())}`);
  }
  if (student.phone?.trim()) {
    lines.push(`TEL;TYPE=CELL:${escapeVcfValue(student.phone.trim())}`);
  }
  if (student.company?.trim()) {
    lines.push(`ORG:${escapeVcfValue(student.company.trim())}`);
  }
  lines.push("END:VCARD");
  const vcf = lines.join("\r\n") + "\r\n";
  const blob = new Blob([vcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe =
    filenameBase ??
    `${student.lastName}-${student.firstName}`.replace(/\s+/g, "_").slice(0, 40);
  a.download = `${safe}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
