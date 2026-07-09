"use client";

import * as React from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useFormation } from "@/components/providers/formation-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFrenchDateLong } from "@/lib/date-format";
import {
  getPendingSatisfactionSession,
  getSatisfactionQuestions,
  validateSatisfactionAnswers,
} from "@/lib/satisfaction";
import type { SatisfactionAnswer } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  studentId: string;
};

export function SatisfactionForm({ studentId }: Props) {
  const { state, hydrated, submitSatisfactionResponse } = useFormation();
  const questions = getSatisfactionQuestions(state.satisfactionQuestions);
  const pendingSession = React.useMemo(
    () =>
      getPendingSatisfactionSession(
        studentId,
        state.sessions,
        state.satisfactionResponses,
      ),
    [studentId, state.sessions, state.satisfactionResponses],
  );

  const [answers, setAnswers] = React.useState<Record<string, number | boolean | string>>({});

  React.useEffect(() => {
    setAnswers({});
  }, [pendingSession?.id]);

  if (!hydrated || !pendingSession) return null;

  const setRating = (questionId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const setYesNo = (questionId: string, value: boolean) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = () => {
    const payload: SatisfactionAnswer[] = questions.map((q) => ({
      questionId: q.id,
      value:
        answers[q.id] ??
        (q.kind === "text" ? "" : q.kind === "yes_no" ? false : 0),
    }));
    const err = validateSatisfactionAnswers(payload, questions);
    if (err) {
      toast.error(err);
      return;
    }
    submitSatisfactionResponse({
      studentId,
      sessionId: pendingSession.id,
      answers: payload,
    });
    toast.success("Merci, votre avis a bien été enregistré.");
  };

  return (
    <Card className="border-indigo-500/20 bg-card/80">
      <CardHeader>
        <CardTitle className="font-heading text-lg">
          Enquête de satisfaction
        </CardTitle>
        <CardDescription>
          Session « {pendingSession.title} » —{" "}
          {formatFrenchDateLong(pendingSession.date)}. Quelques questions pour
          améliorer nos formations (Qualiopi).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q) => (
          <div key={q.id} className="space-y-2">
            <Label className="text-sm font-medium leading-snug">{q.label}</Label>
            {q.kind === "rating" ? (
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: q.maxRating ?? 5 }, (_, i) => i + 1).map(
                  (n) => (
                    <button
                      key={n}
                      type="button"
                      className={cn(
                        "inline-flex size-10 items-center justify-center rounded-full border text-sm font-medium transition-colors",
                        answers[q.id] === n
                          ? "border-indigo-600 bg-indigo-600 text-white dark:border-violet-500 dark:bg-violet-600"
                          : "border-border/80 hover:border-indigo-400 hover:bg-muted/60",
                      )}
                      aria-label={`${n} sur ${q.maxRating ?? 5}`}
                      onClick={() => setRating(q.id, n)}
                    >
                      {n}
                    </button>
                  ),
                )}
              </div>
            ) : null}
            {q.kind === "yes_no" ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={answers[q.id] === true ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setYesNo(q.id, true)}
                >
                  Oui
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={answers[q.id] === false ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setYesNo(q.id, false)}
                >
                  Non
                </Button>
              </div>
            ) : null}
            {q.kind === "text" ? (
              <Textarea
                value={
                  typeof answers[q.id] === "string"
                    ? (answers[q.id] as string)
                    : ""
                }
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                }
                rows={3}
                placeholder="Votre commentaire (facultatif)"
                className="resize-y"
              />
            ) : null}
          </div>
        ))}
        <Button
          type="button"
          className="gap-2 rounded-full"
          onClick={handleSubmit}
        >
          <Star className="size-4" aria-hidden />
          Envoyer mon avis
        </Button>
      </CardContent>
    </Card>
  );
}
