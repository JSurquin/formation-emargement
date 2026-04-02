import { describe, expect, it } from "vitest";
import { parseStudentsJsonArray } from "./import-students-json";

describe("parseStudentsJsonArray", () => {
  it("accepte un tableau de fiches valides", () => {
    const out = parseStudentsJsonArray([
      { firstName: "Ada", lastName: "Lovelace", email: "a@b.c" },
    ]);
    expect(out).toEqual([
      {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "a@b.c",
        phone: undefined,
        company: undefined,
      },
    ]);
  });

  it("accepte { students: [...] }", () => {
    const out = parseStudentsJsonArray({
      students: [{ firstName: "Alan", lastName: "Turing" }],
    });
    expect(out).toEqual([
      {
        firstName: "Alan",
        lastName: "Turing",
        email: undefined,
        phone: undefined,
        company: undefined,
      },
    ]);
  });

  it("ignore les entrées invalides et retourne null si rien", () => {
    expect(parseStudentsJsonArray([{ foo: 1 }])).toBe(null);
    expect(parseStudentsJsonArray({})).toBe(null);
  });
});
