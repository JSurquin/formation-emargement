"use client";

import * as React from "react";
import { Award } from "lucide-react";
import { toast } from "sonner";
import type { Student, TrainingSession } from "@/lib/types";
import {
  isStudentEligibleForAttestation,
  listEligibleStudentIds,
} from "@/lib/training-attestation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: TrainingSession;
  students: Student[];
  onPrint: (studentIds: string[]) => void;
};

export function AttestationPrintDialog({
  open,
  onOpenChange,
  session,
  students,
  onPrint,
}: Props) {
  const eligibleIds = React.useMemo(
    () => listEligibleStudentIds(session),
    [session],
  );

  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    setSelected(new Set(eligibleIds));
  }, [open, eligibleIds]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selectAllEligible = () => setSelected(new Set(eligibleIds));
  const clearAll = () => setSelected(new Set());

  const handlePrint = () => {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins un stagiaire.");
      return;
    }
    onPrint([...selected]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            Attestations de fin de formation
          </DialogTitle>
          <DialogDescription className="text-base">
            Choisissez les stagiaires à inclure. Un document par personne sera
            préparé pour l&apos;impression ou l&apos;enregistrement en PDF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 rounded-full text-xs"
              onClick={selectAllEligible}
              disabled={eligibleIds.length === 0}
            >
              Tous les présents
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-full text-xs"
              onClick={clearAll}
            >
              Tout désélectionner
            </Button>
          </div>

          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun stagiaire inscrit sur cette feuille.
            </p>
          ) : (
            <ScrollArea className="max-h-[min(50vh,320px)] rounded-xl border border-border/60 p-3 dark:border-white/10">
              <ul className="space-y-3">
                {students.map((st) => {
                  const eligible = isStudentEligibleForAttestation(
                    session,
                    st.id,
                  );
                  const checked = selected.has(st.id);
                  return (
                    <li
                      key={st.id}
                      className="flex items-start gap-3 rounded-lg px-1 py-0.5"
                    >
                      <Checkbox
                        id={`attest-${st.id}`}
                        checked={checked}
                        disabled={!eligible}
                        onCheckedChange={(v) => toggle(st.id, v === true)}
                      />
                      <Label
                        htmlFor={`attest-${st.id}`}
                        className={
                          eligible
                            ? "cursor-pointer leading-snug"
                            : "cursor-not-allowed leading-snug text-muted-foreground"
                        }
                      >
                        <span className="font-medium text-foreground">
                          {st.firstName} {st.lastName}
                        </span>
                        {!eligible ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            Non présent — attestation non disponible
                          </span>
                        ) : null}
                      </Label>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className="gap-2 rounded-full"
              onClick={handlePrint}
              disabled={selected.size === 0}
            >
              <Award className="size-4" />
              Imprimer / PDF ({selected.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
