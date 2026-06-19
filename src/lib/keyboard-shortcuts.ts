import type { UserRole } from "@/lib/auth-types";
import { isStaffRole } from "@/lib/auth-types";

export type AppRouterLike = { push: (href: string) => void };

export type KeyboardHelpRow = {
  keys: string;
  desc: string;
};

/** Contenu de la boîte d’aide (?), source unique. */
export const KEYBOARD_HELP_ROWS: KeyboardHelpRow[] = [
  {
    keys: "Tab",
    desc: "Au premier focus de la page : lien « Aller au contenu » pour sauter la barre de navigation.",
  },
  {
    keys: "/",
    desc: "Focus sur le champ de recherche principal de la page (sessions, annuaire ou tableau d’émargement).",
  },
  {
    keys: "n",
    desc: "Ouvrir « Nouvelle session » depuis l’accueil.",
  },
  {
    keys: "h",
    desc: "Retour à l’accueil (sessions) depuis une autre page.",
  },
  {
    keys: "e",
    desc: "Aller à l’annuaire élèves (depuis n’importe quelle page).",
  },
  {
    keys: "f",
    desc: "Aller au catalogue formations (programmes et documents).",
  },
  {
    keys: "c",
    desc: "Aller à la page conventions (liste des conventions créées).",
  },
  {
    keys: "s",
    desc: "Aller à la page statistiques (signatures par élève).",
  },
  {
    keys: "?",
    desc: "Afficher cette fenêtre d’aide (hors champs de saisie).",
  },
  {
    keys: "⌘ K / Ctrl+K",
    desc: "Palette rapide : ouvrir une session ou aller à une page.",
  },
];

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
  const staff = options.userRole ? isStaffRole(options.userRole) : true;

  if (staff && (k === "h" || k === "H")) {
    if (pathname === "/") return false;
    e.preventDefault();
    router.push("/");
    return true;
  }

  if (staff && (k === "e" || k === "E")) {
    if (pathname.startsWith("/eleves")) return false;
    e.preventDefault();
    router.push("/eleves");
    return true;
  }

  if (staff && (k === "f" || k === "F")) {
    if (pathname.startsWith("/formations")) return false;
    e.preventDefault();
    router.push("/formations");
    return true;
  }

  if (staff && (k === "c" || k === "C")) {
    if (pathname.startsWith("/conventions")) return false;
    e.preventDefault();
    router.push("/conventions");
    return true;
  }

  if (staff && (k === "s" || k === "S")) {
    if (pathname.startsWith("/statistiques")) return false;
    e.preventDefault();
    router.push("/statistiques");
    return true;
  }

  if (staff && (k === "n" || k === "N")) {
    if (pathname !== "/") return false;
    e.preventDefault();
    options.onOpenNewSession();
    return true;
  }

  return false;
}
