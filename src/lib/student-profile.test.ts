import { describe, expect, it } from "vitest";
import {
  formatSocialSecurityNumber,
  isValidSocialSecurityNumber,
  validateStudentRequiredFields,
} from "./student-profile";

describe("student-profile", () => {
  it("valide un NIR à 15 chiffres", () => {
    expect(isValidSocialSecurityNumber("185087511512345")).toBe(true);
    expect(formatSocialSecurityNumber("185087511512345")).toBe(
      "1 85 08 75 115 123 45",
    );
  });

  it("exige email et NIR à la création", () => {
    expect(
      validateStudentRequiredFields({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "",
        socialSecurityNumber: "185087511512345",
      }),
    ).toMatch(/e-mail/i);
    expect(
      validateStudentRequiredFields({
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@test.fr",
        socialSecurityNumber: "",
      }),
    ).toMatch(/sécurité sociale/i);
  });
});
