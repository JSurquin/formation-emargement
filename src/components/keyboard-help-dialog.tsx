"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isTypingTarget } from "@/lib/dom-guards";
import { KEYBOARD_HELP_ROWS } from "@/lib/keyboard-shortcuts";

export function KeyboardHelpDialog() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "?") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            Raccourcis clavier
          </DialogTitle>
          <DialogDescription>
            Disponibles lorsque vous n’êtes pas en train de taper dans un champ.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 text-sm">
          {KEYBOARD_HELP_ROWS.map((row) => (
            <li key={row.keys} className="flex gap-3">
              <kbd className="inline-flex min-w-[2.25rem] shrink-0 items-center justify-center rounded-md border border-border/80 bg-muted/50 px-2 py-1 font-mono text-xs font-semibold text-foreground">
                {row.keys}
              </kbd>
              <span className="leading-relaxed text-muted-foreground">
                {row.desc}
              </span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
