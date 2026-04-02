"use client";

import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/confirm-provider";

type Props = {
  sessionId: string;
  studentCount: number;
  setAllPresentForHalf: (
    sessionId: string,
    half: "morning" | "afternoon",
    present: boolean,
  ) => void;
  clearSignaturesForHalf: (
    sessionId: string,
    half: "morning" | "afternoon",
  ) => void;
};

export function EmargementBulkActions({
  sessionId,
  studentCount,
  setAllPresentForHalf,
  clearSignaturesForHalf,
}: Props) {
  const confirm = useConfirm();

  if (studentCount === 0) return null;

  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-muted/15 p-4 dark:border-white/10 dark:bg-black/20">
      <p className="font-heading text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        Actions groupées
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-medium text-foreground/80">Matin</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 rounded-full text-xs"
              onClick={() => {
                setAllPresentForHalf(sessionId, "morning", true);
                toast.success("Tous marqués présents (matin).");
              }}
            >
              Tout présent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs"
              onClick={async () => {
                const ok = await confirm({
                  title: "Réinitialiser le matin ?",
                  description:
                    "Marquer tous absents au matin et effacer les signatures de cette demi-journée.",
                  confirmLabel: "Réinitialiser",
                  variant: "destructive",
                });
                if (!ok) return;
                setAllPresentForHalf(sessionId, "morning", false);
                toast.success("Matin réinitialisé (absents, sans signature).");
              }}
            >
              Tout absent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs text-amber-800 hover:bg-amber-500/10 dark:text-amber-200"
              onClick={async () => {
                const ok = await confirm({
                  title: "Effacer les signatures du matin ?",
                  description:
                    "Les cases présence restent inchangées ; seules les signatures seront effacées.",
                  confirmLabel: "Effacer",
                  variant: "destructive",
                });
                if (!ok) return;
                clearSignaturesForHalf(sessionId, "morning");
                toast.success("Signatures du matin effacées.");
              }}
            >
              Effacer signatures
            </Button>
          </div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-xs font-medium text-foreground/80">
            Après-midi
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 rounded-full text-xs"
              onClick={() => {
                setAllPresentForHalf(sessionId, "afternoon", true);
                toast.success("Tous marqués présents (après-midi).");
              }}
            >
              Tout présent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs"
              onClick={async () => {
                const ok = await confirm({
                  title: "Réinitialiser l’après-midi ?",
                  description:
                    "Marquer tous absents l’après-midi et effacer les signatures de cette demi-journée.",
                  confirmLabel: "Réinitialiser",
                  variant: "destructive",
                });
                if (!ok) return;
                setAllPresentForHalf(sessionId, "afternoon", false);
                toast.success(
                  "Après-midi réinitialisé (absents, sans signature).",
                );
              }}
            >
              Tout absent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs text-amber-800 hover:bg-amber-500/10 dark:text-amber-200"
              onClick={async () => {
                const ok = await confirm({
                  title: "Effacer les signatures de l’après-midi ?",
                  description:
                    "Les présences restent inchangées ; seules les signatures seront effacées.",
                  confirmLabel: "Effacer",
                  variant: "destructive",
                });
                if (!ok) return;
                clearSignaturesForHalf(sessionId, "afternoon");
                toast.success("Signatures de l’après-midi effacées.");
              }}
            >
              Effacer signatures
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
