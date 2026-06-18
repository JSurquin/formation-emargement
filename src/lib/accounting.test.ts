import { describe, expect, it } from "vitest";
import {
  classifyAccountingRow,
  countAccountingByCategory,
  listAccountingRows,
} from "./accounting";
import type { Student, TrainingSession } from "./types";

const student: Student = {
  id: "s1",
  firstName: "Jean",
  lastName: "Dupont",
  email: "jean@example.com",
  socialSecurityNumber: "185087511512345",
  funderName: "Orange",
  funderEmail: "contact@orange.fr",
};

function session(
  id: string,
  date: string,
  overrides: Partial<TrainingSession> = {},
): TrainingSession {
  return {
    id,
    title: "Formation test",
    date,
    studentIds: ["s1"],
    attendance: {
      morning: {
        s1: { present: true, signatureDataUrl: null, signedAt: null },
      },
      afternoon: {},
    },
    ...overrides,
  };
}

describe("accounting", () => {
  it("classe un dossier incomplet en relance", () => {
    const sess = session("sess1", "2099-06-01");
    const row = classifyAccountingRow(student, sess, [sess], [student], "2024-01-01");
    expect(row?.category).toBe("relance");
    expect(row?.followUpLabels.length).toBeGreaterThan(0);
  });

  it("classe une formation terminée présente en facture à envoyer", () => {
    const complete: Student = {
      ...student,
      conventionSignedAt: "2024-05-01T10:00:00.000Z",
      documents: [
        {
          id: "d1",
          label: "CNI",
          kind: "identity",
          fileName: "cni.pdf",
          mimeType: "application/pdf",
          dataUrl: "data:application/pdf;base64,",
          uploadedAt: "2024-05-01T10:00:00.000Z",
        },
      ],
      presenceConfirmedForSessionId: "sess1",
    };
    const sess = session("sess1", "2024-05-10");
    const row = classifyAccountingRow(complete, sess, [sess], [complete], "2024-06-01");
    expect(row?.category).toBe("facture_a_envoyer");
  });

  it("suit le cycle facture envoyée puis payée", () => {
    const complete: Student = {
      ...student,
      conventionSignedAt: "2024-05-01T10:00:00.000Z",
      documents: [
        {
          id: "d1",
          label: "CNI",
          kind: "identity",
          fileName: "cni.pdf",
          mimeType: "application/pdf",
          dataUrl: "data:application/pdf;base64,",
          uploadedAt: "2024-05-01T10:00:00.000Z",
        },
      ],
      presenceConfirmedForSessionId: "sess1",
    };
    const invoiced = session("sess1", "2024-05-10", {
      sessionAccounting: {
        s1: { invoiceSentAt: "2024-05-15T10:00:00.000Z" },
      },
    });
    expect(
      classifyAccountingRow(complete, invoiced, [invoiced], [complete], "2024-06-01")
        ?.category,
    ).toBe("en_attente_paiement");

    const paid = session("sess1", "2024-05-10", {
      sessionAccounting: {
        s1: {
          invoiceSentAt: "2024-05-15T10:00:00.000Z",
          paymentReceivedAt: "2024-06-01T10:00:00.000Z",
        },
      },
    });
    expect(
      classifyAccountingRow(complete, paid, [paid], [complete], "2024-06-02")?.category,
    ).toBe("paye");
  });

  it("compte les lignes par catégorie", () => {
    const sess = session("sess1", "2099-06-01");
    const counts = countAccountingByCategory([student], [sess]);
    expect(counts.relance).toBe(1);
    expect(counts.facture_a_envoyer).toBe(0);
  });

  it("filtre les lignes par catégorie", () => {
    const sess = session("sess1", "2099-06-01");
    const rows = listAccountingRows([student], [sess], "relance");
    expect(rows).toHaveLength(1);
    expect(rows[0]?.category).toBe("relance");
  });
});
