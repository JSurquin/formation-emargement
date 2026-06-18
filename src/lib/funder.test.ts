import { describe, expect, it } from "vitest";
import { normalizeFunderInput, normalizeFunderSiret } from "./funder";

describe("funder", () => {
  it("normalise le SIRET sans espaces", () => {
    expect(normalizeFunderSiret("123 456 789 00012")).toBe("12345678900012");
    expect(normalizeFunderSiret("  ")).toBeUndefined();
  });

  it("exige un nom pour créer un financeur", () => {
    expect(normalizeFunderInput({ name: "  Orange  ", siret: "123" })).toEqual({
      name: "Orange",
      siret: "123",
      email: undefined,
    });
    expect(normalizeFunderInput({ name: "   " })).toBeNull();
  });
});
