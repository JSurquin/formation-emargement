import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  actions?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  actions,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <p className="font-heading text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-indigo-600/90 dark:text-violet-300/90">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-heading text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 shrink-0 flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  );
}

/** Fragment de titre en dégradé (comme les hero Junon) */
export function GradientAccent({ children }: { children: ReactNode }) {
  return (
    <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent dark:from-sky-400 dark:via-violet-400 dark:to-fuchsia-400">
      {children}
    </span>
  );
}
