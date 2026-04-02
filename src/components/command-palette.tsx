"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  GraduationCap,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatFrenchDateShort } from "@/lib/date-format";
import { filterSessionsByQuery } from "@/lib/session-search";
import { cn } from "@/lib/utils";

const quickLinks = [
  { href: "/", label: "Accueil — sessions", icon: LayoutDashboard },
  { href: "/eleves", label: "Annuaire élèves", icon: Users },
  { href: "/statistiques", label: "Statistiques", icon: BarChart3 },
] as const;

export function CommandPalette() {
  const router = useRouter();
  const { state, hydrated } = useFormation();
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filtered = React.useMemo(() => {
    const list = filterSessionsByQuery(state.sessions, q);
    return list.slice(0, 12);
  }, [state.sessions, q]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      e.preventDefault();
      setOpen((o) => !o);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!open) return;
    setQ("");
    const t = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(t);
  }, [open]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  if (!hydrated) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="top-[max(1rem,env(safe-area-inset-top,0px))] max-h-[min(85dvh,calc(100dvh-2rem))] w-[min(100vw-1rem,32rem)] max-w-lg translate-y-0 gap-0 overflow-hidden border-border/80 bg-card/95 p-0 backdrop-blur-xl sm:top-[15%]"
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche rapide</DialogTitle>
          <DialogDescription>
            Ouvrir une session ou une page par le clavier.
          </DialogDescription>
        </DialogHeader>
        <div className="border-b border-border/60 px-3 py-2 dark:border-white/10">
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher une session…"
            className="h-11 border-0 bg-transparent px-2 text-base shadow-none focus-visible:ring-0"
            aria-label="Recherche rapide"
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                setOpen(false);
              }
            }}
          />
        </div>
        <div className="max-h-[min(55dvh,20rem)] overflow-y-auto overscroll-y-contain p-2 touch-pan-y">
          {!q.trim() ? (
            <div className="space-y-1">
              <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Pages
              </p>
              {quickLinks.map(({ href, label, icon: Icon }) => (
                <button
                  key={href}
                  type="button"
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                    "hover:bg-muted/80 dark:hover:bg-white/10",
                  )}
                  onClick={() => go(href)}
                >
                  <Icon className="size-4 shrink-0 text-indigo-600 dark:text-violet-400" />
                  {label}
                </button>
              ))}
              {state.sessions.length > 0 ? (
                <>
                  <p className="mt-3 px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Sessions récentes
                  </p>
                  {[...state.sessions]
                    .sort((a, b) => {
                      const ta = a.lastActivityAt ?? a.createdAt ?? "";
                      const tb = b.lastActivityAt ?? b.createdAt ?? "";
                      return tb.localeCompare(ta);
                    })
                    .slice(0, 6)
                    .map((sess) => (
                      <button
                        key={sess.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                          "hover:bg-muted/80 dark:hover:bg-white/10",
                        )}
                        onClick={() => go(`/sessions/${sess.id}`)}
                      >
                        <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {sess.title}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatFrenchDateShort(sess.date)}
                        </span>
                      </button>
                    ))}
                </>
              ) : null}
            </div>
          ) : filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              Aucune session ne correspond à « {q.trim()} ».
            </p>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((sess) => (
                <li key={sess.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                      "hover:bg-muted/80 dark:hover:bg-white/10",
                    )}
                    onClick={() => go(`/sessions/${sess.id}`)}
                  >
                    <GraduationCap className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {sess.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {formatFrenchDateShort(sess.date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="border-t border-border/50 px-3 py-2 text-center text-[11px] text-muted-foreground dark:border-white/10">
          Échap pour fermer · ⌘K / Ctrl+K pour basculer
        </p>
      </DialogContent>
    </Dialog>
  );
}
