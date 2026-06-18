import { describe, expect, it } from "vitest";
import {
  normalizeCompanySiret,
  normalizeTrainerProfileInput,
  parseTrainerProfileDocuments,
  trainerProfileDocumentLabel,
} from "./trainer-profile";

describe("trainer-profile", () => {
  it("normalise le SIRET entreprise sans espaces", () => {
    expect(normalizeCompanySiret("123 456 789 00012")).toBe("12345678900012");
    expect(normalizeCompanySiret("  ")).toBeUndefined();
  });

  it("normalise les champs optionnels de la fiche formateur", () => {
    expect(
      normalizeTrainerProfileInput({
        phone: " 06 12 34 56 78 ",
        dateOfBirth: " 1980-05-12 ",
        company: "  Formateur Pro SARL  ",
        companySiret: "123 456 789 00012",
      }),
    ).toEqual({
      phone: "06 12 34 56 78",
      dateOfBirth: "1980-05-12",
      company: "Formateur Pro SARL",
      companySiret: "12345678900012",
      documents: undefined,
    });
  });

  it("libelle les documents selon le type", () => {
    expect(trainerProfileDocumentLabel("kbis")).toBe("Extrait Kbis");
    expect(trainerProfileDocumentLabel("other", "Contrat")).toBe("Contrat");
  });

  it("parse les documents stockés en JSON", () => {
    expect(parseTrainerProfileDocuments([{ id: "x" }])).toBeUndefined();
    expect(
      parseTrainerProfileDocuments([
        {
          id: "d1",
          label: "Extrait Kbis",
          kind: "kbis",
          fileName: "kbis.pdf",
          mimeType: "application/pdf",
          dataUrl: "data:application/pdf;base64,abc",
          uploadedAt: "2026-06-18T12:00:00.000Z",
        },
      ]),
    ).toHaveLength(1);
  });
});
