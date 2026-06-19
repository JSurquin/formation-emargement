export const AUTH_COOKIE_NAME = "fe_auth";

export type UserRole = "SUPER_ADMIN" | "FORMATEUR" | "ELEVE";

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  studentId: string | null;
};

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super administrateur",
  FORMATEUR: "Formateur",
  ELEVE: "Élève",
};

export function canAccessAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

export function canManageSessions(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "FORMATEUR";
}

export function canManageStudents(role: UserRole): boolean {
  return role === "SUPER_ADMIN" || role === "FORMATEUR";
}

export function isStaffRole(role: UserRole): boolean {
  return canManageSessions(role);
}
