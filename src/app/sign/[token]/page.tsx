"use client";

import * as React from "react";
import { CheckCircle2, PenLine } from "lucide-react";
import { toast } from "sonner";
import { SignaturePad } from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type SignInfo = {
  sessionTitle: string;
  sessionDate: string;
  halfDay: "morning" | "afternoon";
  student: { firstName: string; lastName: string };
  alreadySigned: boolean;
};

const halfLabels = {
  morning: "Matin",
  afternoon: "Après-midi",
};

export default function SignPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<SignInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [signature, setSignature] = React.useState<string | null>(null);
  const [showPad, setShowPad] = React.useState(true);

  React.useEffect(() => {
    void params.then((p) => setToken(p.token));
  }, [params]);

  React.useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch(`/api/sign/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setInfo(data);
        if (data.alreadySigned) setDone(true);
      })
      .catch((err) => {
        toast.error(
          err instanceof Error ? err.message : "Lien invalide ou expiré.",
        );
      })
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async () => {
    if (!token || !signature) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl: signature }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Signature impossible.");
        return;
      }
      setDone(true);
      toast.success("Signature enregistrée.");
    } catch {
      toast.error("Signature impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-muted-foreground">
        Chargement…
      </div>
    );
  }

  if (!info) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-muted-foreground">
        Ce lien n&apos;est plus valide.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 px-4 py-8">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">Émargement en ligne</p>
        <h1 className="font-heading text-2xl font-semibold">{info.sessionTitle}</h1>
        <p className="text-muted-foreground">
          {info.sessionDate} — {halfLabels[info.halfDay]}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {info.student.firstName} {info.student.lastName}
          </CardTitle>
          <CardDescription>
            Signez ci-dessous pour confirmer votre présence.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="size-12 text-emerald-600" />
              <p className="font-medium">Signature enregistrée, merci !</p>
            </div>
          ) : showPad ? (
            <SignaturePad
              onSave={(dataUrl) => {
                setSignature(dataUrl);
                setShowPad(false);
              }}
              onCancel={() => setShowPad(false)}
            />
          ) : (
            <>
              {signature ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signature}
                  alt="Votre signature"
                  className="mx-auto max-h-40 rounded-lg border border-border/60"
                />
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => setShowPad(true)}>
                  Modifier
                </Button>
                <Button
                  className="flex-1"
                  disabled={!signature || submitting}
                  onClick={submit}
                >
                  <PenLine className="size-4" />
                  {submitting ? "Enregistrement…" : "Valider ma signature"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
