import { describe, expect, it } from "vitest";
import { getSessionSignatureSummary } from "./session-signature";
import type { TrainingSession } from "./types";
import { buildAttendanceForStudents, emptySlot } from "./types";

function sess(
  studentIds: string[],
  morning: Record<string, boolean>,
  afternoon: Record<string, boolean>,
): TrainingSession {
  const att = buildAttendanceForStudents(studentIds);
  for (const id of studentIds) {
    if (morning[id]) {
      att.morning[id] = {
        present: true,
        signatureDataUrl: "data:image/png;base64,xx",
        signedAt: "2024-01-01T10:00:00Z",
      };
    } else {
      att.morning[id] = emptySlot();
    }
    if (afternoon[id]) {
      att.afternoon[id] = {
        present: true,
        signatureDataUrl: "data:image/png;base64,yy",
        signedAt: "2024-01-01T14:00:00Z",
      };
    } else {
      att.afternoon[id] = emptySlot();
    }
  }
  return {
    id: "s1",
    title: "Test",
    date: "2024-06-01",
    studentIds,
    attendance: att,
  };
}

describe("getSessionSignatureSummary", () => {
  it("détecte feuille complète", () => {
    const s = sess(["a", "b"], { a: true, b: true }, { a: true, b: true });
    const r = getSessionSignatureSummary(s);
    expect(r.fullyComplete).toBe(true);
    expect(r.incompleteSignatures).toBe(false);
  });

  it("détecte signatures incomplètes", () => {
    const s = sess(["a"], { a: true }, { a: false });
    const r = getSessionSignatureSummary(s);
    expect(r.fullyComplete).toBe(false);
    expect(r.incompleteSignatures).toBe(true);
  });
});
