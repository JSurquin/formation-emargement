import type { UserRole } from "@/lib/auth-types";
import { isStaffRole } from "@/lib/auth-types";
import {
  getNavRouteByShortcut,
  NAV_ROUTES,
  resolveNavHref,
} from "@/lib/route-access";

export type AppRouterLike = { push: (href: string) => void };

export type KeyboardHelpRow = {
  keys: string;
  desc: string;
  roles?: readonly UserRole[];
};

const STAFF_ROLES = ["SUPER_ADMIN", "FORMATEUR"] as const satisfies readonly UserRole[];

const COMMON_HELP_ROWS: KeyboardHelpRow[] = [
  {
    keys: "Tab",
    desc: "Au premier focus de la page : lien « Aller au contenu » pour sauter la barre de navigation.",
  },
  {
    keys: "/",
    desc: "Focus sur le champ de recherche principal de la page (sessions, annuaire ou tableau d’émargement).",
    roles: STAFF_ROLES,
  },
  {
    keys: "?",
    desc: "Afficher cette fenêtre d’aide (hors champs de saisie).",
  },
  {
    keys: "⌘ K / Ctrl+K",
    desc: "Palette rapide : ouvrir une session ou aller à une page.",
    roles: STAFF_ROLES,
  },
];

/** Contenu de la boîte d’aide (?), filtré par rôle. */
export function getKeyboardHelpRowsForRole(
  role: UserRole | null | undefined,
): KeyboardHelpRow[] {
  if (!role) return COMMON_HELP_ROWS.filter((row) => !row.roles);

  const navRows = NAV_ROUTES.filter(
    (route) => route.shortcut && route.roles.includes(role),
  ).map((route) => ({
    keys: route.shortcut!,
    desc:
      route.id === "sessions"
        ? "Retour à l’accueil (sessions) depuis une autre page."
        : route.id === "students"
          ? "Aller à l’annuaire élèves (depuis n’importe quelle page)."
          : route.id === "formations"
            ? "Aller au catalogue formations (programmes et documents)."
            : route.id === "conventions"
              ? "Aller à la page conventions (liste des conventions créées)."
              : route.id === "stats"
                ? "Aller à la page statistiques (signatures par élève)."
                : route.id === "calendar"
                  ? "Aller au calendrier global (toutes les sessions)."
                  : route.id === "billing"
                    ? "Aller à la facturation complète et partage financeurs."
                    : route.id === "planning"
                  ? "Aller au planning formateur (sessions assignées)."
                  : route.id === "admin"
                    ? "Aller au back-office administrateur."
                    : `Aller à ${route.label}.`,
    roles: route.roles,
  }));

  const newSessionRow: KeyboardHelpRow = {
    keys: "n",
    desc: "Ouvrir « Nouvelle session » depuis l’accueil.",
    roles: STAFF_ROLES,
  };

  const rows = [
    ...COMMON_HELP_ROWS,
    ...(isStaffRole(role) ? [newSessionRow] : []),
    ...navRows,
  ];

  return rows.filter((row) => !row.roles || row.roles.includes(role));
}

/** @deprecated Utiliser getKeyboardHelpRowsForRole — conservé pour compatibilité tests. */
export const KEYBOARD_HELP_ROWS = getKeyboardHelpRowsForRole("SUPER_ADMIN");

/**
 * Raccourcis de navigation globale (hors champs de saisie).
 * Retourne true si un raccourci a été consommé.
 */
export function handleAppShellNavigationKey(
  e: KeyboardEvent,
  pathname: string,
  router: AppRouterLike,
  options: { onOpenNewSession: () => void; userRole?: UserRole | null },
): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return false;

  const k = e.key;
  const role = options.userRole;
  const staff = role ? isStaffRole(role) : true;

  if (staff && (k === "n" || k === "N")) {
    if (pathname !== "/") return false;
    e.preventDefault();
    options.onOpenNewSession();
    return true;
  }

  if (!role) return false;

  const route = getNavRouteByShortcut(role, k);
  if (!route) return false;

  const href = resolveNavHref(route);
  const active =
    href === "/" ? pathname === "/" : pathname.startsWith(href);
  if (active) return false;

  e.preventDefault();
  router.push(href);
  return true;
}
