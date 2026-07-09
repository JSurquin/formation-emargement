import type {
  SatisfactionAnswer,
  SatisfactionQuestion,
  SatisfactionResponse,
  Student,
  TrainingSession,
} from "./types";
import { isSessionFinished } from "./accounting";

/** Questions par défaut (type Qualiopi / enquête à chaud). */
export const DEFAULT_SATISFACTION_QUESTIONS: SatisfactionQuestion[] = [
  {
    id: "expectations",
    label: "La formation a-t-elle répondu à vos attentes ?",
    kind: "rating",
    maxRating: 5,
  },
  {
    id: "trainer_quality",
    label: "Qualité pédagogique du formateur",
    kind: "rating",
    maxRating: 5,
  },
  {
    id: "materials",
    label: "Supports et moyens pédagogiques",
    kind: "rating",
    maxRating: 5,
  },
  {
    id: "organization",
    label: "Organisation de la formation (accueil, horaires, lieu)",
    kind: "rating",
    maxRating: 5,
  },
  {
    id: "recommend",
    label: "Recommanderiez-vous cette formation ?",
    kind: "yes_no",
  },
  {
    id: "comments",
    label: "Commentaires libres (points forts, axes d'amélioration…)",
    kind: "text",
  },
];

export function getSatisfactionQuestions(
  custom?: SatisfactionQuestion[],
): SatisfactionQuestion[] {
  return custom?.length ? custom : DEFAULT_SATISFACTION_QUESTIONS;
}

export function getLatestFinishedSessionForStudent(
  studentId: string,
  sessions: TrainingSession[],
  today?: string,
): TrainingSession | null {
  const finished = sessions
    .filter(
      (s) =>
        s.studentIds.includes(studentId) && isSessionFinished(s, today),
    )
    .sort((a, b) => b.date.localeCompare(a.date));
  return finished[0] ?? null;
}

export function getPendingSatisfactionSession(
  studentId: string,
  sessions: TrainingSession[],
  responses: SatisfactionResponse[] | undefined,
  today?: string,
): TrainingSession | null {
  const finished = sessions
    .filter(
      (s) =>
        s.studentIds.includes(studentId) && isSessionFinished(s, today),
    )
    .sort((a, b) => b.date.localeCompare(a.date));

  const answered = new Set(
    (responses ?? [])
      .filter((r) => r.studentId === studentId)
      .map((r) => r.sessionId),
  );

  return finished.find((s) => !answered.has(s.id)) ?? null;
}

export function hasSatisfactionResponse(
  studentId: string,
  sessionId: string,
  responses: SatisfactionResponse[] | undefined,
): boolean {
  return (responses ?? []).some(
    (r) => r.studentId === studentId && r.sessionId === sessionId,
  );
}

export type SatisfactionResultRow = SatisfactionResponse & {
  student: Student;
  session: TrainingSession;
  averageRating: number | null;
};

export function listSatisfactionResults(
  students: Student[],
  sessions: TrainingSession[],
  responses: SatisfactionResponse[] | undefined,
  questions: SatisfactionQuestion[],
): SatisfactionResultRow[] {
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const sessionMap = new Map(sessions.map((s) => [s.id, s]));
  const ratingIds = new Set(
    questions.filter((q) => q.kind === "rating").map((q) => q.id),
  );

  return (responses ?? [])
    .map((response) => {
      const student = studentMap.get(response.studentId);
      const session = sessionMap.get(response.sessionId);
      if (!student || !session) return null;

      const ratings = response.answers.filter(
        (a): a is SatisfactionAnswer & { value: number } =>
          ratingIds.has(a.questionId) && typeof a.value === "number",
      );
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, a) => sum + a.value, 0) / ratings.length
          : null;

      return { ...response, student, session, averageRating };
    })
    .filter((r): r is SatisfactionResultRow => r !== null)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function computeSatisfactionAverages(
  responses: SatisfactionResponse[] | undefined,
  questions: SatisfactionQuestion[],
): Array<{ questionId: string; label: string; average: number | null }> {
  return questions
    .filter((q) => q.kind === "rating")
    .map((q) => {
      const values = (responses ?? [])
        .flatMap((r) => r.answers)
        .filter((a) => a.questionId === q.id && typeof a.value === "number")
        .map((a) => a.value as number);
      const average =
        values.length > 0
          ? values.reduce((s, v) => s + v, 0) / values.length
          : null;
      return { questionId: q.id, label: q.label, average };
    });
}

export function validateSatisfactionAnswers(
  answers: SatisfactionAnswer[],
  questions: SatisfactionQuestion[],
): string | null {
  for (const q of questions) {
    const answer = answers.find((a) => a.questionId === q.id);
    if (q.kind === "text") continue;
    if (!answer) return `Réponse manquante : ${q.label}`;
    if (q.kind === "rating") {
      const max = q.maxRating ?? 5;
      if (
        typeof answer.value !== "number" ||
        answer.value < 1 ||
        answer.value > max
      ) {
        return `Note invalide pour : ${q.label}`;
      }
    }
    if (q.kind === "yes_no" && typeof answer.value !== "boolean") {
      return `Réponse invalide pour : ${q.label}`;
    }
  }
  return null;
}
