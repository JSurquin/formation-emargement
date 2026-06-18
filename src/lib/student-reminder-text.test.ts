import { describe, expect, it } from "vitest";
import {
  buildConvocationEmail,
  buildConventionToCandidateEmail,
} from "./student-reminder-text";
import type { Student, TrainingSession } from "./types";

const student: Student = {
  id: "s1",
  firstName: "Marie",
  lastName: "Martin",
  email: "marie@example.com",
  fundingMethod: "cpf",
};

const session: TrainingSession = {
  id: "sess1",
  title: "Excel avancé",
  date: "2099-06-15",
  studentIds: ["s1"],
  location: "Salle A — Paris",
  trainer: "Jean Formateur",
  attendance: { morning: {}, afternoon: {} },
};

describe("student-reminder-text", () => {
  it("rédige l'e-mail de convention pour le candidat", () => {
    const { subject, text } = buildConventionToCandidateEmail({
      student,
      organizationName: "Mon OF",
    });
    expect(subject).toContain("Convention");
    expect(text).toContain("Marie");
    expect(text).toContain("CPF");
    expect(text).toContain("signer");
  });

  it("rédige la convocation avec date, lieu et intervenant", () => {
    const { subject, text } = buildConvocationEmail({
      student,
      session,
      organizationName: "Mon OF",
    });
    expect(subject).toContain("Convocation");
    expect(subject).toContain("Excel avancé");
    expect(text).toContain("Salle A — Paris");
    expect(text).toContain("Jean Formateur");
    expect(text).toContain("convoqué");
  });
});
