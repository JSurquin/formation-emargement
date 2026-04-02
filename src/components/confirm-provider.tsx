"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
};

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

const ConfirmContext = React.createContext<
  ((o: ConfirmOptions) => Promise<boolean>) | null
>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<Pending | null>(null);

  const confirm = React.useCallback((opts: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...opts, resolve });
    });
  }, []);

  const finish = React.useCallback((value: boolean) => {
    setPending((p) => {
      if (p) p.resolve(value);
      return null;
    });
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) finish(false);
        }}
      >
        <DialogContent className="border-border/80 bg-card/95 backdrop-blur-xl sm:max-w-md">
          {pending ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-heading text-lg">
                  {pending.title}
                </DialogTitle>
                {pending.description ? (
                  <DialogDescription className="text-base">
                    {pending.description}
                  </DialogDescription>
                ) : (
                  <DialogDescription className="sr-only">
                    Confirmation requise
                  </DialogDescription>
                )}
              </DialogHeader>
              <DialogFooter className="border-0 bg-transparent sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => finish(false)}
                >
                  {pending.cancelLabel ?? "Annuler"}
                </Button>
                <Button
                  type="button"
                  variant={
                    pending.variant === "destructive" ? "destructive" : "default"
                  }
                  className="rounded-full"
                  onClick={() => finish(true)}
                >
                  {pending.confirmLabel ?? "Continuer"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = React.useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm doit être utilisé dans ConfirmProvider");
  }
  return ctx;
}
