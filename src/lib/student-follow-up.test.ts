import { describe, expect, it } from "vitest";
import {
  getStudentFollowUp,
  getUpcomingSessionForStudent,
  hasIdentityDocument,
} from "./student-follow-up";
import type { Student, TrainingSession } from "./types";

const baseStudent: Student = {
  id: "s1",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@example.com",
  socialSecurityNumber: "185087511512345",
};

const sessions: TrainingSession[] = [
  {
    id: "sess-future",
    title: "Excel avancé",
    date: "2099-06-01",
    studentIds: ["s1"],
    attendance: { morning: {}, afternoon: {} },
  },
];

describe("student-follow-up", () => {
  it("détecte l'absence de pièce d'identité", () => {
    expect(hasIdentityDocument(baseStudent)).toBe(false);
    expect(
      hasIdentityDocument({
        ...baseStudent,
        documents: [
          {
            id: "d1",
            label: "CNI",
            kind: "identity",
            fileName: "cni.pdf",
            mimeType: "application/pdf",
            dataUrl: "data:application/pdf;base64,",
            uploadedAt: new Date().toISOString(),
          },
        ],
      }),
    ).toBe(true);
  });

  it("trouve la prochaine session du candidat", () => {
    const upcoming = getUpcomingSessionForStudent("s1", sessions);
    expect(upcoming?.id).toBe("sess-future");
  });

  it("liste les éléments manquants du dossier", () => {
    const { items } = getStudentFollowUp(baseStudent, sessions);
    const pending = items.filter((i) => !i.ok).map((i) => i.id);
    expect(pending).toContain("identity_document");
    expect(pending).toContain("convention");
    expect(pending).toContain("presence");
  });
});
