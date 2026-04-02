"use client";

import * as React from "react";
import Link from "next/link";
import { History } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrainingSession } from "@/lib/types";
import {
  readRecentSessionIds,
  RECENT_SESSIONS_CHANGED_EVENT,
} from "@/lib/recent-sessions-storage";
import { formatFrenchDateShort } from "@/lib/date-format";

type Props = {
  sessions: TrainingSession[];
};

export function RecentSessionsStrip({ sessions }: Props) {
  const [ids, setIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    setIds(readRecentSessionIds());
    const onChange = () => setIds(readRecentSessionIds());
    window.addEventListener(RECENT_SESSIONS_CHANGED_EVENT, onChange);
    return () =>
      window.removeEventListener(RECENT_SESSIONS_CHANGED_EVENT, onChange);
  }, []);

  const byId = React.useMemo(
    () => new Map(sessions.map((s) => [s.id, s])),
    [sessions],
  );

  const resolved = React.useMemo(() => {
    const out: TrainingSession[] = [];
    for (const id of ids) {
      const s = byId.get(id);
      if (s) out.push(s);
    }
    return out;
  }, [ids, byId]);

  if (resolved.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-muted/15 px-4 py-3 dark:border-white/10 dark:bg-black/15 sm:flex-row sm:flex-wrap sm:items-center">
      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <History className="size-3.5 opacity-80" aria-hidden />
        Récemment ouvert
      </span>
      <div className="flex flex-wrap gap-2">
        {resolved.map((s) => (
          <Link
            key={s.id}
            href={`/sessions/${s.id}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "h-8 max-w-[220px] truncate rounded-full border-border/80 text-xs font-medium",
            )}
            title={`${s.title} — ${formatFrenchDateShort(s.date)}`}
          >
            {s.title}
          </Link>
        ))}
      </div>
    </div>
  );
}
