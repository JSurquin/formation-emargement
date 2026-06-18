import { describe, expect, it } from "vitest";
import { parseAppStateImport } from "./app-state-io";

describe("parseAppStateImport", () => {
  it("conserve le nom du financeur sur la fiche candidat", () => {
    const parsed = parseAppStateImport({
      students: [
        {
          id: "s1",
          firstName: "Ada",
          lastName: "Lovelace",
          funderName: "OPCO Atlas",
          funderSiret: "12345678900012",
          funderEmail: "contact@opco.fr",
        },
      ],
      sessions: [],
    });

    expect(parsed?.students[0]?.funderName).toBe("OPCO Atlas");
    expect(parsed?.students[0]?.funderSiret).toBe("12345678900012");
    expect(parsed?.students[0]?.funderEmail).toBe("contact@opco.fr");
  });

  it("accepte les champs optionnels null sans rejeter l'état", () => {
    const parsed = parseAppStateImport({
      students: [
        {
          id: "s1",
          firstName: "Ada",
          lastName: "Lovelace",
          email: null,
          funderName: "Entreprise XYZ",
        },
      ],
      sessions: [],
    });

    expect(parsed?.students[0]?.funderName).toBe("Entreprise XYZ");
  });
});
