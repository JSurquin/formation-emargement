/** True si l’événement clavier ne doit pas déclencher de raccourcis globaux. */
export function isTypingTarget(target: EventTarget | null): boolean {
  const t = target as HTMLElement | null;
  if (!t) return false;
  if (t.closest('[role="dialog"]')) return true;
  if (t.closest('[data-slot="dialog-content"]')) return true;
  if (t.closest('[data-slot="dialog-popup"]')) return true;
  const tag = t.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return false;
}
