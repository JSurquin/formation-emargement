import { describe, expect, it } from "vitest";
import { mergeStudentsIntoLocal } from "./student-merge";
import type { Student } from "./types";

describe("mergeStudentsIntoLocal", () => {
  it("met à jour l’email entrant", () => {
    const local: Student[] = [
      { id: "1", firstName: "Jean", lastName: "Dupont", email: "old@x.fr" },
    ];
    const incoming: Student[] = [
      { id: "1", firstName: "Jean", lastName: "Dupont", email: "new@x.fr" },
    ];
    const out = mergeStudentsIntoLocal(local, incoming);
    expect(out).toHaveLength(1);
    expect(out[0].email).toBe("new@x.fr");
  });

  it("conserve l’email local si absent côté entrant", () => {
    const local: Student[] = [
      { id: "1", firstName: "Jean", lastName: "Dupont", email: "keep@x.fr" },
    ];
    const incoming: Student[] = [{ id: "1", firstName: "Jean", lastName: "Dupont" }];
    const out = mergeStudentsIntoLocal(local, incoming);
    expect(out[0].email).toBe("keep@x.fr");
  });

  it("ajoute un nouvel id", () => {
    const out = mergeStudentsIntoLocal(
      [{ id: "1", firstName: "A", lastName: "A" }],
      [{ id: "2", firstName: "B", lastName: "B" }],
    );
    expect(out.map((s) => s.id).sort()).toEqual(["1", "2"]);
  });
});
