import type { UserRole } from "@/lib/auth-types";
import { isStaffRole } from "@/lib/auth-types";

/** Identifiants stables pour lier navigation, palette et raccourcis. */
export type NavRouteId =
  | "sessions"
  | "students"
  | "formations"
  | "conventions"
  | "stats"
  | "satisfaction"
  | "calendar"
  | "planning"
  | "billing"
  | "admin"
  | "student-space";

export type NavRouteDef = {
  id: NavRouteId;
  href: string | ((ctx: { studentId?: string | null }) => string);
  label: string;
  roles: readonly UserRole[];
  order: number;
  /** Raccourci clavier (lettre seule, hors champs de saisie). */
  shortcut?: string;
  /** Afficher dans la palette ⌘K / Ctrl+K. */
  palette?: boolean;
};

const STAFF_ROLES = ["SUPER_ADMIN", "FORMATEUR"] as const satisfies readonly UserRole[];

/** Pages visibles dans la barre de navigation, triées par `order`. */
export const NAV_ROUTES: NavRouteDef[] = [
  {
    id: "student-space",
    href: ({ studentId }) => `/eleves/${studentId}`,
    label: "Mon espace",
    roles: ["ELEVE"],
    order: 5,
  },
  {
    id: "sessions",
    href: "/",
    label: "Sessions",
    roles: STAFF_ROLES,
    order: 10,
    shortcut: "h",
    palette: true,
  },
  {
    id: "students",
    href: "/eleves",
    label: "Élèves",
    roles: STAFF_ROLES,
    order: 20,
    shortcut: "e",
    palette: true,
  },
  {
    id: "formations",
    href: "/formations",
    label: "Formations",
    roles: STAFF_ROLES,
    order: 30,
    shortcut: "f",
    palette: true,
  },
  {
    id: "conventions",
    href: "/conventions",
    label: "Conventions",
    roles: STAFF_ROLES,
    order: 40,
    shortcut: "c",
    palette: true,
  },
  {
    id: "stats",
    href: "/statistiques",
    label: "Stats",
    roles: STAFF_ROLES,
    order: 50,
    shortcut: "s",
    palette: true,
  },
  {
    id: "satisfaction",
    href: "/satisfaction",
    label: "Satisfaction",
    roles: STAFF_ROLES,
    order: 52,
    palette: true,
  },
  {
    id: "calendar",
    href: "/calendrier",
    label: "Calendrier",
    roles: STAFF_ROLES,
    order: 54,
    shortcut: "g",
    palette: true,
  },
  {
    id: "planning",
    href: "/planning",
    label: "Planning",
    roles: ["FORMATEUR"],
    order: 60,
    shortcut: "p",
    palette: true,
  },
  {
    id: "billing",
    href: "/facturation",
    label: "Facturation",
    roles: ["SUPER_ADMIN"],
    order: 65,
    shortcut: "b",
    palette: true,
  },
  {
    id: "admin",
    href: "/admin",
    label: "Admin",
    roles: ["SUPER_ADMIN"],
    order: 70,
    shortcut: "a",
    palette: true,
  },
];

export type ResolvedNavRoute = {
  id: NavRouteId;
  href: string;
  label: string;
  order: number;
};

export function resolveNavHref(
  route: NavRouteDef,
  studentId?: string | null,
): string {
  return typeof route.href === "function"
    ? route.href({ studentId })
    : route.href;
}

export function getNavRoutesForRole(
  role: UserRole,
  studentId?: string | null,
): ResolvedNavRoute[] {
  return NAV_ROUTES.filter((route) => {
    if (!route.roles.includes(role)) return false;
    if (route.id === "student-space" && !studentId) return false;
    return true;
  })
    .map((route) => ({
      id: route.id,
      href: resolveNavHref(route, studentId),
      label: route.label,
      order: route.order,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getPaletteRoutesForRole(
  role: UserRole,
): Array<{ href: string; label: string }> {
  return NAV_ROUTES.filter(
    (route) => route.palette && route.roles.includes(role),
  ).map((route) => ({
    href: resolveNavHref(route),
    label:
      route.id === "sessions"
        ? "Accueil — sessions"
        : route.id === "students"
          ? "Annuaire élèves"
          : route.id === "formations"
            ? "Catalogue formations"
            : route.id === "conventions"
              ? "Conventions"
              : route.id === "stats"
                ? "Statistiques"
                : route.id === "satisfaction"
                  ? "Enquêtes satisfaction"
                  : route.id === "calendar"
                    ? "Calendrier global"
                    : route.id === "billing"
                      ? "Facturation & financeurs"
                      : route.label,
  }));
}

export function getDefaultHomeForRole(
  role: UserRole,
  studentId?: string | null,
): string {
  if (role === "ELEVE" && studentId) {
    return `/eleves/${studentId}`;
  }
  if (role === "SUPER_ADMIN") {
    return "/";
  }
  return "/";
}

type PathRule = {
  priority: number;
  test: (pathname: string) => boolean;
  roles: readonly UserRole[];
};

/** Règles serveur : première correspondance (priorité décroissante) l’emporte. */
const PATH_RULES: PathRule[] = [
  {
    priority: 100,
    test: (p) => p.startsWith("/admin") || p.startsWith("/api/admin/"),
    roles: ["SUPER_ADMIN"],
  },
  {
    priority: 95,
    test: (p) => p.startsWith("/facturation"),
    roles: ["SUPER_ADMIN"],
  },
  {
    priority: 90,
    test: (p) => p.startsWith("/planning") || p.startsWith("/api/trainer/"),
    roles: ["FORMATEUR"],
  },
  {
    priority: 50,
    test: (p) =>
      p === "/" ||
      p === "/eleves" ||
      p.startsWith("/formations") ||
      p.startsWith("/conventions") ||
      p.startsWith("/statistiques") ||
      p.startsWith("/satisfaction") ||
      p.startsWith("/calendrier") ||
      p.startsWith("/sessions/"),
    roles: STAFF_ROLES,
  },
];

export function getRequiredRolesForPath(pathname: string): UserRole[] | null {
  const rule = [...PATH_RULES]
    .sort((a, b) => b.priority - a.priority)
    .find((r) => r.test(pathname));
  return rule ? [...rule.roles] : null;
}

export function canRoleAccessPath(role: UserRole, pathname: string): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return true;
  return required.includes(role);
}

export function getNavRouteByShortcut(
  role: UserRole,
  key: string,
): NavRouteDef | undefined {
  const normalized = key.toLowerCase();
  return NAV_ROUTES.find(
    (route) =>
      route.shortcut === normalized && route.roles.includes(role),
  );
}

export function isStaffOnlyPath(pathname: string): boolean {
  const required = getRequiredRolesForPath(pathname);
  if (!required) return false;
  return required.every((role) => isStaffRole(role));
}
