"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Banknote,
  BookOpen,
  CalendarDays,
  CalendarRange,
  FileText,
  GraduationCap,
  IdCard,
  LayoutDashboard,
  LogOut,
  Shield,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { ROLE_LABELS } from "@/lib/auth-types";
import { getDefaultHomeForRole, getNavRoutesForRole } from "@/lib/route-access";
import type { NavRouteId } from "@/lib/route-access";
import { Button } from "@/components/ui/button";
import { AppBackground } from "@/components/app-background";
import { CommandPalette } from "@/components/command-palette";
import { KeyboardHelpDialog } from "@/components/keyboard-help-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import { isTypingTarget } from "@/lib/dom-guards";
import { handleAppShellNavigationKey } from "@/lib/keyboard-shortcuts";
import { cn } from "@/lib/utils";

const NAV_ICONS: Record<NavRouteId, LucideIcon> = {
  "student-space": IdCard,
  sessions: LayoutDashboard,
  students: Users,
  formations: BookOpen,
  conventions: FileText,
  stats: BarChart3,
  satisfaction: Star,
  calendar: CalendarRange,
  planning: CalendarDays,
  billing: Banknote,
  admin: Shield,
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/inscription") ||
    pathname.startsWith("/sign/");

  const homeHref = user
    ? getDefaultHomeForRole(user.role, user.studentId)
    : "/";

  React.useEffect(() => {
    if (isAuthPage || loading || user) return;
    router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [isAuthPage, loading, pathname, router, user]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (
        handleAppShellNavigationKey(e, pathname, router, {
          userRole: user?.role,
          onOpenNewSession: () =>
            window.dispatchEvent(new CustomEvent("digiforma:open-new-session")),
        })
      ) {
        return;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router, user?.role]);

  if (isAuthPage) {
    return (
      <div className="relative flex min-h-full flex-col">
        <AppBackground className="no-print" />
        <main className="relative z-10 flex-1">{children}</main>
      </div>
    );
  }

  const navItems = user
    ? getNavRoutesForRole(user.role, user.studentId).map((route) => ({
        ...route,
        icon: NAV_ICONS[route.id],
      }))
    : [];

  return (
    <div className="relative flex min-h-full flex-col">
      <a
        href="#contenu-principal"
        className="no-print sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2 focus:ring-indigo-500"
      >
        Aller au contenu
      </a>
      <AppBackground className="no-print" />

      <header className="no-print sticky top-0 z-50 border-b border-border/60 bg-card/75 pt-[env(safe-area-inset-top,0px)] backdrop-blur-xl dark:border-white/10 dark:bg-card/50">
        <div className="mx-auto flex min-h-14 max-w-6xl items-center gap-2 py-2 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:min-h-16 sm:gap-6 sm:py-0 sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))] md:gap-8">
          <Link
            href={homeHref}
            className="group flex min-w-0 shrink-0 items-center gap-2 font-heading font-semibold tracking-tight sm:gap-3"
          >
            <span className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-600/30 transition-transform group-hover:scale-[1.02] dark:from-indigo-500 dark:to-fuchsia-600 dark:shadow-indigo-900/50">
              <GraduationCap className="size-5" aria-hidden />
            </span>
            <span className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="truncate text-sm text-muted-foreground">
                Feuilles & signatures
              </span>
              <span className="truncate text-base text-foreground">
                Formation Émargement
              </span>
            </span>
          </Link>

          <nav
            className="ml-auto flex min-w-0 flex-1 justify-end overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-none sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            aria-label="Navigation principale"
          >
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/80 bg-muted/40 p-1 dark:border-white/10 dark:bg-black/20">
            {navItems.map(({ href, label, icon: Icon, id }) => {
              const active =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={id}
                  href={href}
                  className={cn(
                    "flex min-h-10 min-w-10 items-center justify-center gap-2 rounded-full px-2.5 py-2 text-sm font-medium transition-all sm:min-w-0 sm:px-3.5",
                    active
                      ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/25 dark:from-indigo-500 dark:to-violet-500"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground dark:hover:bg-white/10",
                  )}
                >
                  <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
            </div>
          </nav>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <div className="max-w-[10rem] truncate text-right text-xs leading-tight">
                <p className="font-medium text-foreground">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 rounded-full"
                aria-label="Se déconnecter"
                onClick={async () => {
                  await logout();
                  router.push("/login");
                  router.refresh();
                }}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          ) : null}
          <ThemeToggle />
        </div>
      </header>

      <KeyboardHelpDialog />

      <CommandPalette />

      <main
        id="contenu-principal"
        className="relative z-10 mx-auto w-full min-w-0 max-w-6xl flex-1 py-8 pb-[max(2rem,env(safe-area-inset-bottom,0px))] pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:py-12 sm:pb-12 sm:pl-[max(1.5rem,env(safe-area-inset-left,0px))] sm:pr-[max(1.5rem,env(safe-area-inset-right,0px))]"
        tabIndex={-1}
      >
        {children}
      </main>

      <footer className="no-print relative z-10 border-t border-border/60 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] text-center text-xs leading-relaxed text-muted-foreground dark:border-white/10 sm:py-8">
        <p className="mx-auto max-w-lg pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))]">
          Feuilles de présence et signatures numériques — inspirées des usages de type{" "}
          <a
            href="https://www.digiforma.com/solution-emargement-numerique/"
            className="font-medium text-indigo-600 underline decoration-indigo-600/30 underline-offset-2 transition-colors hover:text-violet-600 dark:text-violet-300 dark:decoration-violet-400/40 dark:hover:text-fuchsia-300"
            target="_blank"
            rel="noreferrer"
          >
            Digiforma
          </a>{" "}
          (émargement, feuilles de présence).
        </p>
      </footer>
    </div>
  );
}
