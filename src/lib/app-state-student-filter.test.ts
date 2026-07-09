import { describe, expect, it } from "vitest";
import { filterAppStateForStudent } from "./app-state-student-filter";
import type { AppState } from "./types";

const baseState: AppState = {
  students: [
    {
      id: "stu-a",
      firstName: "Alice",
      lastName: "Martin",
      email: "alice@example.com",
    },
    {
      id: "stu-b",
      firstName: "Bob",
      lastName: "Durand",
      email: "bob@example.com",
    },
  ],
  sessions: [
    {
      id: "sess-1",
      title: "Formation Excel",
      date: "2026-03-01",
      studentIds: ["stu-a", "stu-b"],
      notes: "Notes internes formateur",
      trainerDocuments: [
        {
          id: "doc-1",
          label: "Ordre de mission",
          kind: "mission_order",
          fileName: "mission.pdf",
          mimeType: "application/pdf",
          dataUrl: "data:application/pdf;base64,abc",
          uploadedAt: "2026-02-01T10:00:00.000Z",
        },
      ],
      sessionAccounting: {
        "stu-a": { invoiceNumber: "FAC-001", amountHt: 1200 },
        "stu-b": { invoiceNumber: "FAC-002", amountHt: 900 },
      },
      attestationSignatures: {
        "stu-a": {
          signatureDataUrl: "data:image/png;base64,aaa",
          signedAt: "2026-03-01T18:00:00.000Z",
        },
        "stu-b": {
          signatureDataUrl: "data:image/png;base64,bbb",
          signedAt: "2026-03-01T18:00:00.000Z",
        },
      },
      attendance: {
        morning: {
          "stu-a": {
            present: true,
            signatureDataUrl: "data:image/png;base64,siga",
            signedAt: "2026-03-01T09:00:00.000Z",
          },
          "stu-b": {
            present: true,
            signatureDataUrl: "data:image/png;base64,sigb",
            signedAt: "2026-03-01T09:00:00.000Z",
          },
        },
        afternoon: {
          "stu-a": {
            present: false,
            signatureDataUrl: null,
            signedAt: null,
          },
          "stu-b": {
            present: true,
            signatureDataUrl: "data:image/png;base64,sigbpm",
            signedAt: "2026-03-01T14:00:00.000Z",
          },
        },
      },
    },
  ],
  noteSnippets: ["Snippet interne"],
  sessionTemplates: [{ id: "tpl-1", name: "Groupe A", studentIds: ["stu-a"] }],
  trainingCatalog: [
    {
      id: "cat-1",
      title: "Catalogue interne",
    },
  ],
  satisfactionResponses: [
    {
      id: "sat-a",
      studentId: "stu-a",
      sessionId: "sess-1",
      submittedAt: "2026-03-02T10:00:00.000Z",
      answers: [],
    },
    {
      id: "sat-b",
      studentId: "stu-b",
      sessionId: "sess-1",
      submittedAt: "2026-03-02T10:00:00.000Z",
      answers: [],
    },
  ],
};

describe("filterAppStateForStudent", () => {
  it("ne renvoie que les données de l'élève connecté", () => {
    const filtered = filterAppStateForStudent(baseState, "stu-a");

    expect(filtered.students).toHaveLength(1);
    expect(filtered.students[0]?.id).toBe("stu-a");
    expect(filtered.noteSnippets).toBeUndefined();
    expect(filtered.sessionTemplates).toBeUndefined();
    expect(filtered.trainingCatalog).toBeUndefined();
    expect(filtered.satisfactionResponses).toEqual([
      expect.objectContaining({ id: "sat-a" }),
    ]);
  });

  it("masque les signatures et données comptables des autres participants", () => {
    const session = filterAppStateForStudent(baseState, "stu-a").sessions[0]!;

    expect(session.studentIds).toEqual(["stu-a"]);
    expect(session.notes).toBeUndefined();
    expect(session.trainerDocuments).toBeUndefined();
    expect(session.sessionAccounting).toBeUndefined();
    expect(session.attestationSignatures).toEqual({
      "stu-a": expect.objectContaining({
        signatureDataUrl: "data:image/png;base64,aaa",
      }),
    });
    expect(session.attendance.morning["stu-a"]?.signatureDataUrl).toBe(
      "data:image/png;base64,siga",
    );
    expect(session.attendance.morning["stu-b"]).toBeUndefined();
    expect(session.attendance.afternoon["stu-b"]).toBeUndefined();
  });
});
