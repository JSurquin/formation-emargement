import { describe, expect, it } from "vitest";
import {
  buildAttestationDurationLabel,
  getStudentAttendanceSummary,
  isStudentEligibleForAttestation,
  listEligibleStudentIds,
} from "./training-attestation";
import type { TrainingSession } from "./types";
import { buildAttendanceForStudents } from "./types";

function sessionWithPresence(
  studentIds: string[],
  morningPresent: Record<string, boolean>,
  afternoonPresent: Record<string, boolean>,
): TrainingSession {
  const attendance = buildAttendanceForStudents(studentIds);
  for (const id of studentIds) {
    attendance.morning[id].present = morningPresent[id] ?? false;
    attendance.afternoon[id].present = afternoonPresent[id] ?? false;
  }
  return {
    id: "s1",
    title: "SST",
    date: "2024-06-01",
    studentIds,
    attendance,
  };
}

describe("training-attestation", () => {
  it("détecte l’éligibilité selon la présence", () => {
    const session = sessionWithPresence(
      ["a", "b"],
      { a: true },
      { b: true },
    );
    expect(isStudentEligibleForAttestation(session, "a")).toBe(true);
    expect(isStudentEligibleForAttestation(session, "b")).toBe(true);
    expect(listEligibleStudentIds(session)).toEqual(["a", "b"]);
  });

  it("exclut les absents des deux créneaux", () => {
    const session = sessionWithPresence(["a"], {}, {});
    expect(isStudentEligibleForAttestation(session, "a")).toBe(false);
    expect(listEligibleStudentIds(session)).toEqual([]);
  });

  it("libellé durée journée complète ou demi-journée", () => {
    expect(
      buildAttestationDurationLabel({
        presentMorning: true,
        presentAfternoon: true,
        signedMorning: false,
        signedAfternoon: false,
      }),
    ).toBe("journée complète");
    expect(
      buildAttestationDurationLabel({
        presentMorning: true,
        presentAfternoon: false,
        signedMorning: false,
        signedAfternoon: false,
      }),
    ).toBe("demi-journée (matin)");
    expect(
      buildAttestationDurationLabel(
        getStudentAttendanceSummary(
          sessionWithPresence(["a"], {}, { a: true }),
          "a",
        ),
      ),
    ).toBe("demi-journée (après-midi)");
  });
});
