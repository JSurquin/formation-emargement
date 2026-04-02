"use client";

import { cn } from "@/lib/utils";

export function AppBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 -z-10 overflow-hidden",
        className,
      )}
    >
      <div className="absolute inset-0 bg-background" />

      {/* Light — grille + halos (style Junon / Andromed) */}
      <div className="absolute inset-0 opacity-100 transition-opacity duration-500 dark:opacity-0">
        <svg
          className="absolute inset-0 h-full w-full text-indigo-300/35"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dg-grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dg-grid)" />
        </svg>
        <div className="absolute -left-40 top-0 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-sky-300/25 via-indigo-200/20 to-transparent blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-[480px] w-[480px] rounded-full bg-gradient-to-tl from-violet-400/20 via-fuchsia-200/15 to-transparent blur-3xl" />
        <div className="absolute left-1/2 top-0 h-px w-[min(100%,48rem)] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
      </div>

      {/* Dark — radial violet / bleu */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 dark:opacity-100">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-10%,oklch(0.32_0.14_290),oklch(0.11_0.045_285)_45%,oklch(0.08_0.02_280)_100%)]" />
        <div className="absolute left-[15%] top-[20%] h-[380px] w-[380px] rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute bottom-[10%] right-[10%] h-[420px] w-[420px] rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>
    </div>
  );
}
