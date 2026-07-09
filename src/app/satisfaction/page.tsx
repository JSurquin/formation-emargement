"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { GradientAccent, PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatFrenchDateLong, formatFrenchDateTimeShort } from "@/lib/date-format";
import {
  computeSatisfactionAverages,
  DEFAULT_SATISFACTION_QUESTIONS,
  getSatisfactionQuestions,
  listSatisfactionResults,
} from "@/lib/satisfaction";

export default function SatisfactionPage() {
  const { state, hydrated } = useFormation();
  const questions = getSatisfactionQuestions(state.satisfactionQuestions);

  const results = React.useMemo(
    () =>
      listSatisfactionResults(
        state.students,
        state.sessions,
        state.satisfactionResponses,
        questions,
      ),
    [state.students, state.sessions, state.satisfactionResponses, questions],
  );

  const averages = React.useMemo(
    () => computeSatisfactionAverages(state.satisfactionResponses, questions),
    [state.satisfactionResponses, questions],
  );

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 animate-pulse rounded-2xl bg-muted/80" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Qualité"
        title={
          <>
            Enquêtes de <GradientAccent>satisfaction</GradientAccent>
          </>
        }
        description="Synthèse des retours stagiaires après formation (type Digiforma / Qualiopi). Les élèves répondent depuis leur espace personnel."
        actions={
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2 rounded-full")}
          >
            <ArrowLeft className="size-4" aria-hidden />
            Sessions
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {averages.map((item) => (
          <Card key={item.questionId} className="border-border/60 bg-card/60">
            <CardHeader className="pb-2">
              <CardDescription className="line-clamp-2 text-xs leading-snug">
                {item.label}
              </CardDescription>
              <CardTitle className="flex items-center gap-2 font-heading text-2xl">
                {item.average != null ? (
                  <>
                    {item.average.toFixed(1)}
                    <Star className="size-5 fill-amber-400 text-amber-400" />
                  </>
                ) : (
                  "—"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Moyenne sur 5
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            Questions posées
          </CardTitle>
          <CardDescription>
            {questions.length} question{questions.length > 1 ? "s" : ""} par
            défaut — personnalisables ultérieurement dans les données.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            {(state.satisfactionQuestions?.length
              ? questions
              : DEFAULT_SATISFACTION_QUESTIONS
            ).map((q) => (
              <li key={q.id}>{q.label}</li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            Réponses reçues ({results.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucune réponse pour l’instant. Les stagiaires voient le
              questionnaire dans leur espace après une session terminée.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stagiaire</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Date session</TableHead>
                  <TableHead>Moyenne</TableHead>
                  <TableHead>Envoyé le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <Link
                        href={`/eleves/${row.student.id}`}
                        className="font-medium hover:text-indigo-600 dark:hover:text-violet-300"
                      >
                        {row.student.firstName} {row.student.lastName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/sessions/${row.session.id}`}
                        className="hover:text-indigo-600 dark:hover:text-violet-300"
                      >
                        {row.session.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatFrenchDateLong(row.session.date)}
                    </TableCell>
                    <TableCell>
                      {row.averageRating != null ? (
                        <Badge variant="secondary" className="rounded-full">
                          {row.averageRating.toFixed(1)} / 5
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFrenchDateTimeShort(row.submittedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
