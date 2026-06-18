import { describe, expect, it } from "vitest";
import {
  getFundingMethodLabel,
  normalizeFundingMethodFromImport,
} from "./funding-method";

describe("funding-method", () => {
  it("retourne le libellé français du financement", () => {
    expect(getFundingMethodLabel("cpf")).toBe("CPF");
    expect(getFundingMethodLabel("opco")).toContain("OPCO");
  });

  it("normalise les libellés CSV courants", () => {
    expect(normalizeFundingMethodFromImport("CPF")).toBe("cpf");
    expect(normalizeFundingMethodFromImport("Plan entreprise")).toBe("employeur");
    expect(normalizeFundingMethodFromImport("France Travail")).toBe(
      "france_travail",
    );
  });
});
