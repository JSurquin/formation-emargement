import { describe, expect, it } from "vitest";
import {
  buildAbsenceNotificationEmail,
  buildConvocationEmail,
  buildConventionToCandidateEmail,
  buildMissingDocumentsReminderEmail,
  getDocumentsReminderRecipient,
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

  it("adresse la relance documents au candidat pour un financement CPF", () => {
    expect(getDocumentsReminderRecipient(student)).toBe("marie@example.com");
    const { text } = buildMissingDocumentsReminderEmail({
      student,
      organizationName: "Mon OF",
      missingLabels: ["Pièce d'identité"],
    });
    expect(text).toContain("Bonjour Marie,");
    expect(text).toContain("votre inscription");
  });

  it("adresse la relance documents au financeur pour un plan employeur", () => {
    const employeur: Student = {
      ...student,
      fundingMethod: "employeur",
      funderEmail: "rh@entreprise.fr",
    };
    expect(getDocumentsReminderRecipient(employeur)).toBe("rh@entreprise.fr");
    const { subject, text } = buildMissingDocumentsReminderEmail({
      student: employeur,
      organizationName: "Mon OF",
      missingLabels: ["Pièce d'identité"],
    });
    expect(subject).toContain("Marie Martin");
    expect(text).toContain("Bonjour,");
    expect(text).toContain("l'inscription de Marie Martin");
    expect(text).not.toContain("votre inscription");
  });

  it("rédige l'e-mail d'absence pour le financeur", () => {
    const { subject, text } = buildAbsenceNotificationEmail({
      student,
      session,
      organizationName: "Mon OF",
    });
    expect(subject).toContain("Absence");
    expect(subject).toContain("Marie Martin");
    expect(text).toContain("n'est pas présent(e)");
    expect(text).toContain("Excel avancé");
    expect(text).toContain("Salle A — Paris");
    expect(text).toContain("Mon OF");
  });
});
