"use client";

import * as React from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, Download, MapPin, Users } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { TrainerSessionDocuments } from "@/components/trainer-session-documents";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  formatFrenchDateLong,
  formatFrenchDateShort,
} from "@/lib/date-format";
import { formatSessionRelativeDay } from "@/lib/session-relative-day";
import type { TrainerPlanningSession } from "@/lib/trainer-planning";

type PlanningResponse = {
  upcoming: TrainerPlanningSession[];
  past: TrainerPlanningSession[];
  total: number;
};

function PlanningSessionRow({ session }: { session: TrainerPlanningSession }) {
  const relDay = formatSessionRelativeDay(session.date);

  return (
    <li className="space-y-3">
      <Link
        href={`/sessions/${session.id}`}
        className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card/50 p-4 transition-all hover:border-indigo-500/40 hover:bg-card hover:shadow-md dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground group-hover:text-indigo-700 dark:group-hover:text-violet-200">
              {session.title}
            </p>
            {session.archived ? (
              <Badge variant="secondary" className="rounded-full text-xs">
                Archivée
              </Badge>
            ) : null}
            {session.documents.length > 0 ? (
              <Badge variant="outline" className="gap-1 rounded-full text-xs">
                <Download className="size-3" aria-hidden />
                {session.documents.length} doc
                {session.documents.length > 1 ? "s" : ""}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {formatFrenchDateShort(session.date)}
            {relDay ? (
              <span className="text-indigo-600/90 dark:text-violet-300/90">
                {" "}
                · {relDay}
              </span>
            ) : null}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {session.location ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" aria-hidden />
                {session.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5 shrink-0" aria-hidden />
              {session.studentCount} stagiaire
              {session.studentCount > 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <span
          className={cn(
            buttonVariants({ variant: "secondary", size: "sm" }),
            "shrink-0 gap-1 rounded-full self-start sm:self-center",
          )}
        >
          Ouvrir la feuille
          <ChevronRight className="size-4" aria-hidden />
        </span>
      </Link>
      {session.documents.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 p-4 dark:border-white/10">
          <p className="mb-3 text-sm font-medium text-foreground">
            Documents à télécharger
          </p>
          <TrainerSessionDocuments
            documents={session.documents}
            readOnly
            compact
          />
        </div>
      ) : null}
    </li>
  );
}

function PlanningSection({
  title,
  description,
  sessions,
  emptyMessage,
}: {
  title: string;
  description: string;
  sessions: TrainerPlanningSession[];
  emptyMessage: string;
}) {
  return (
    <Card className="dg-surface ring-0">
      <CardHeader>
        <CardTitle className="font-heading text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <ul className="space-y-3">
            {sessions.map((session) => (
              <PlanningSessionRow key={session.id} session={session} />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlanningPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = React.useState<PlanningResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== "FORMATEUR") {
      setLoading(false);
      return;
    }

    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/trainer/planning");
        const json = (await res.json()) as PlanningResponse & { error?: string };
        if (!res.ok) {
          if (!cancelled) setError(json.error ?? "Chargement impossible.");
          return;
        }
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setError("Chargement impossible.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-72 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  if (!user || user.role !== "FORMATEUR") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Planning"
          title="Accès réservé aux formateurs"
          description="Connectez-vous avec un compte formateur pour consulter vos sessions assignées."
        />
        <Link href="/" className={cn(buttonVariants(), "rounded-full")}>
          Retour à l&apos;accueil
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Planning"
          title={
            <>
              Votre <GradientAccent>planning</GradientAccent>
            </>
          }
          description="Sessions de formation qui vous sont assignées."
        />
        <Card className="dg-surface ring-0">
          <CardContent className="py-10 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button
              type="button"
              className="mt-4 rounded-full"
              onClick={() => window.location.reload()}
            >
              Réessayer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todayLabel = formatFrenchDateLong(new Date().toISOString().slice(0, 10));
  const allDocuments = [...(data?.upcoming ?? []), ...(data?.past ?? [])].flatMap(
    (session) =>
      session.documents.map((doc) => ({
        ...doc,
        sessionTitle: session.title,
        sessionDate: session.date,
      })),
  );

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Formateur"
        title={
          <>
            Votre <GradientAccent>planning</GradientAccent> de formation
          </>
        }
        description={`Bonjour ${user.firstName}, voici les sessions qui vous sont assignées. Aujourd’hui : ${todayLabel}.`}
      />

      <Card className="dg-surface ring-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-heading text-lg">
            <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
              <CalendarDays className="size-4" />
            </span>
            {data?.total ?? 0} session{(data?.total ?? 0) > 1 ? "s" : ""} au total
          </CardTitle>
          <CardDescription>
            Les sessions apparaissent ici dès qu&apos;un administrateur vous les
            assigne depuis le back-office.
          </CardDescription>
        </CardHeader>
      </Card>

      {allDocuments.length > 0 ? (
        <Card className="dg-surface ring-0">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Vos documents administratifs
            </CardTitle>
            <CardDescription>
              Ordres de mission et pièces jointes préparées par l&apos;administration
              pour vos sessions assignées.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {allDocuments.map((doc) => (
                <li
                  key={`${doc.id}-${doc.sessionTitle}`}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/10"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{doc.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {doc.sessionTitle} · {formatFrenchDateShort(doc.sessionDate)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {doc.fileName}
                    </p>
                  </div>
                  <a
                    href={doc.dataUrl}
                    download={doc.fileName}
                    className={cn(
                      buttonVariants({ variant: "default", size: "sm" }),
                      "shrink-0 gap-1.5 rounded-full self-start sm:self-center",
                    )}
                  >
                    <Download className="size-3.5" />
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <PlanningSection
        title="À venir"
        description="Prochaines dates de formation."
        sessions={data?.upcoming ?? []}
        emptyMessage="Aucune session à venir pour le moment."
      />

      <PlanningSection
        title="Passées"
        description="Historique de vos interventions."
        sessions={data?.past ?? []}
        emptyMessage="Aucune session passée enregistrée."
      />
    </div>
  );
}
