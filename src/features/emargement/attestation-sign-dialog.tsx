"use client";

import * as React from "react";
import { PenLine } from "lucide-react";
import { toast } from "sonner";
import type { Student, TrainingSession } from "@/lib/types";
import {
  isAttestationSignedByTrainer,
  isStudentEligibleForAttestation,
  listEligibleStudentIds,
} from "@/lib/training-attestation";
import { SignaturePad } from "@/components/signature-pad";
import { Badge } from "@/components/ui/badge";
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
  onSign: (studentIds: string[], signatureDataUrl: string) => void;
};

export function AttestationSignDialog({
  open,
  onOpenChange,
  session,
  students,
  onSign,
}: Props) {
  const eligibleIds = React.useMemo(
    () => listEligibleStudentIds(session),
    [session],
  );
  const unsignedEligibleIds = React.useMemo(
    () =>
      eligibleIds.filter(
        (id) => !isAttestationSignedByTrainer(session, id),
      ),
    [eligibleIds, session],
  );

  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [signing, setSigning] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSigning(false);
      return;
    }
    setSelected(new Set(unsignedEligibleIds));
  }, [open, unsignedEligibleIds]);

  const toggle = (id: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleSaveSignature = (signatureDataUrl: string) => {
    if (selected.size === 0) {
      toast.error("Sélectionnez au moins un stagiaire.");
      return;
    }
    onSign([...selected], signatureDataUrl);
    setSigning(false);
    onOpenChange(false);
    toast.success(
      selected.size > 1
        ? `${selected.size} attestations signées.`
        : "Attestation signée.",
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setSigning(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            Signer les attestations
          </DialogTitle>
          <DialogDescription className="text-base">
            Signez numériquement les attestations de fin de formation. Les
            stagiaires pourront ensuite les consulter dans leur espace.
          </DialogDescription>
        </DialogHeader>

        {signing ? (
          <div className="space-y-3 pt-1">
            <Label className="font-heading text-muted-foreground">
              Signature du formateur
            </Label>
            <SignaturePad
              onSave={handleSaveSignature}
              onCancel={() => setSigning(false)}
            />
          </div>
        ) : (
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8 rounded-full text-xs"
                onClick={() => setSelected(new Set(unsignedEligibleIds))}
                disabled={unsignedEligibleIds.length === 0}
              >
                Tous les non signés
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-xs"
                onClick={() => setSelected(new Set())}
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
                    const signed = isAttestationSignedByTrainer(session, st.id);
                    const checked = selected.has(st.id);
                    return (
                      <li
                        key={st.id}
                        className="flex items-start gap-3 rounded-lg px-1 py-0.5"
                      >
                        <Checkbox
                          id={`attest-sign-${st.id}`}
                          checked={checked}
                          disabled={!eligible || signed}
                          onCheckedChange={(v) => toggle(st.id, v === true)}
                        />
                        <Label
                          htmlFor={`attest-sign-${st.id}`}
                          className={
                            eligible && !signed
                              ? "cursor-pointer leading-snug"
                              : "cursor-not-allowed leading-snug text-muted-foreground"
                          }
                        >
                          <span className="inline-flex flex-wrap items-center gap-2">
                            <span className="font-medium text-foreground">
                              {st.firstName} {st.lastName}
                            </span>
                            {signed ? (
                              <Badge
                                variant="secondary"
                                className="rounded-full text-[10px]"
                              >
                                Signée
                              </Badge>
                            ) : null}
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
                onClick={() => {
                  if (selected.size === 0) {
                    toast.error("Sélectionnez au moins un stagiaire.");
                    return;
                  }
                  setSigning(true);
                }}
                disabled={selected.size === 0}
              >
                <PenLine className="size-4" />
                Signer ({selected.size})
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
