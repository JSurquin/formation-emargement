import { describe, expect, it } from "vitest";
import {
  computeSatisfactionAverages,
  DEFAULT_SATISFACTION_QUESTIONS,
  getPendingSatisfactionSession,
  listSatisfactionResults,
  validateSatisfactionAnswers,
} from "@/lib/satisfaction";
import type { Student, TrainingSession } from "@/lib/types";
import { buildAttendanceForStudents } from "@/lib/types";

const student: Student = {
  id: "s1",
  firstName: "Alice",
  lastName: "Martin",
};

const pastSession: TrainingSession = {
  id: "sess1",
  title: "Excel",
  date: "2020-01-15",
  studentIds: ["s1"],
  attendance: buildAttendanceForStudents(["s1"]),
};

describe("satisfaction", () => {
  it("détecte une session en attente de réponse", () => {
    const pending = getPendingSatisfactionSession(
      "s1",
      [pastSession],
      [],
      "2026-01-01",
    );
    expect(pending?.id).toBe("sess1");
  });

  it("valide les réponses obligatoires", () => {
    const answers = DEFAULT_SATISFACTION_QUESTIONS.filter(
      (q) => q.kind !== "text",
    ).map((q) => ({
      questionId: q.id,
      value: q.kind === "rating" ? 4 : true,
    }));
    expect(validateSatisfactionAnswers(answers, DEFAULT_SATISFACTION_QUESTIONS)).toBeNull();
  });

  it("calcule les moyennes par question", () => {
    const averages = computeSatisfactionAverages(
      [
        {
          id: "r1",
          studentId: "s1",
          sessionId: "sess1",
          submittedAt: "2026-01-01T10:00:00.000Z",
          answers: [
            { questionId: "expectations", value: 5 },
            { questionId: "trainer_quality", value: 3 },
          ],
        },
      ],
      DEFAULT_SATISFACTION_QUESTIONS,
    );
    const expectations = averages.find((a) => a.questionId === "expectations");
    expect(expectations?.average).toBe(5);
  });

  it("liste les résultats enrichis", () => {
    const rows = listSatisfactionResults(
      [student],
      [pastSession],
      [
        {
          id: "r1",
          studentId: "s1",
          sessionId: "sess1",
          submittedAt: "2026-01-01T10:00:00.000Z",
          answers: [{ questionId: "expectations", value: 4 }],
        },
      ],
      DEFAULT_SATISFACTION_QUESTIONS,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].student.firstName).toBe("Alice");
  });
});
