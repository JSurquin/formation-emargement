import { describe, expect, it } from "vitest";
import { parseStudentsCsv } from "./import-students-csv";

describe("parseStudentsCsv", () => {
  it("parse prénom;nom avec en-têtes", () => {
    const csv = "prénom;nom;email\nAlice;Martin;alice@test.fr\n";
    const rows = parseStudentsCsv(csv);
    expect(rows).not.toBeNull();
    expect(rows).toHaveLength(1);
    expect(rows![0].firstName).toBe("Alice");
    expect(rows![0].lastName).toBe("Martin");
    expect(rows![0].email).toBe("alice@test.fr");
  });

  it("retourne null sans colonnes obligatoires", () => {
    expect(parseStudentsCsv("a;b\nc;d\n")).toBeNull();
  });
});
