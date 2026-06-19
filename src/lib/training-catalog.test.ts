import { describe, expect, it } from "vitest";
import {
  filterTrainingCatalogByQuery,
  trainingCatalogDocumentLabel,
} from "./training-catalog";
import type { TrainingCatalogEntry } from "./types";

describe("trainingCatalogDocumentLabel", () => {
  it("utilise le libellé personnalisé pour other", () => {
    expect(trainingCatalogDocumentLabel("other", "Fiche FT")).toBe("Fiche FT");
  });

  it("retourne le libellé preset pour program", () => {
    expect(trainingCatalogDocumentLabel("program")).toBe(
      "Programme de formation",
    );
  });
});

describe("filterTrainingCatalogByQuery", () => {
  const entries: TrainingCatalogEntry[] = [
    {
      id: "1",
      title: "Excel avancé",
      reference: "FORM-01",
      documents: [
        {
          id: "d1",
          label: "Programme de formation",
          kind: "program",
          fileName: "programme.pdf",
          mimeType: "application/pdf",
          dataUrl: "data:application/pdf;base64,",
          uploadedAt: "2026-01-01T00:00:00.000Z",
        },
      ],
    },
    {
      id: "2",
      title: "Word initiation",
    },
  ];

  it("filtre par titre ou référence", () => {
    expect(filterTrainingCatalogByQuery(entries, "excel")).toHaveLength(1);
    expect(filterTrainingCatalogByQuery(entries, "FORM-01")).toHaveLength(1);
    expect(filterTrainingCatalogByQuery(entries, "programme.pdf")).toHaveLength(1);
  });

  it("retourne tout si la recherche est vide", () => {
    expect(filterTrainingCatalogByQuery(entries, "")).toHaveLength(2);
  });
});
