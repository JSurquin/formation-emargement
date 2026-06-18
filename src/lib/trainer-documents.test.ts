import { describe, expect, it } from "vitest";
import { trainerDocumentLabel } from "./trainer-documents";

describe("trainerDocumentLabel", () => {
  it("retourne le libellé prédéfini pour l'ordre de mission", () => {
    expect(trainerDocumentLabel("mission_order")).toBe("Ordre de mission");
  });

  it("accepte un libellé personnalisé pour les autres documents", () => {
    expect(trainerDocumentLabel("other", "Convocation formateur")).toBe(
      "Convocation formateur",
    );
  });
});
