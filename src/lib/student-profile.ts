import type { Student } from "./types";

export const STUDENT_DOCUMENT_MAX_BYTES = 4 * 1024 * 1024;

export function normalizeSocialSecurityNumber(raw: string): string {
  return raw.replace(/\s/g, "");
}

export function formatSocialSecurityNumber(raw: string): string {
  const n = normalizeSocialSecurityNumber(raw);
  if (!n) return "";
  const chunks = [
    n.slice(0, 1),
    n.slice(1, 3),
    n.slice(3, 5),
    n.slice(5, 7),
    n.slice(7, 10),
    n.slice(10, 13),
    n.slice(13, 15),
  ].filter(Boolean);
  return chunks.join(" ");
}

export function isValidSocialSecurityNumber(raw: string): boolean {
  const n = normalizeSocialSecurityNumber(raw);
  return /^\d{13}(\d{2})?$/.test(n);
}

export function isValidStudentEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export function isStudentProfileComplete(student: Student): boolean {
  return Boolean(
    student.email?.trim() &&
      student.socialSecurityNumber?.trim() &&
      isValidStudentEmail(student.email) &&
      isValidSocialSecurityNumber(student.socialSecurityNumber),
  );
}

export function validateStudentRequiredFields(input: {
  firstName: string;
  lastName: string;
  email: string;
  socialSecurityNumber: string;
}): string | null {
  if (!input.firstName.trim() || !input.lastName.trim()) {
    return "Prénom et nom sont obligatoires.";
  }
  if (!input.email.trim()) {
    return "L'adresse e-mail est obligatoire.";
  }
  if (!isValidStudentEmail(input.email)) {
    return "Adresse e-mail invalide.";
  }
  if (!input.socialSecurityNumber.trim()) {
    return "Le numéro de sécurité sociale est obligatoire.";
  }
  if (!isValidSocialSecurityNumber(input.socialSecurityNumber)) {
    return "Numéro de sécurité sociale invalide (13 ou 15 chiffres attendus).";
  }
  return null;
}
