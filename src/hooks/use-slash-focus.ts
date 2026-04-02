"use client";

import * as React from "react";

/**
 * Appuie sur « / » (hors champs de saisie) pour focus un champ de recherche par id.
 */
export function useSlashFocus(inputId: string, enabled = true) {
  React.useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('[role="dialog"]')) return;
      if (t.closest("[data-slot=\"dialog-content\"]")) return;
      if (t.closest("[data-slot=\"dialog-popup\"]")) return;
      const tag = t.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (t.isContentEditable) return;

      e.preventDefault();
      const el = document.getElementById(inputId);
      if (el && "focus" in el) {
        (el as HTMLInputElement).focus();
        (el as HTMLInputElement).select?.();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputId, enabled]);
}
