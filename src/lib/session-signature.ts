import type { TrainingSession } from "./types";

export type SessionSignatureSummary = {
  n: number;
  signedM: number;
  signedA: number;
  /** Tous les inscrits ont signé matin et après-midi. */
  fullyComplete: boolean;
  /** Au moins un élève inscrit et au moins une signature manquante. */
  incompleteSignatures: boolean;
};

export function getSessionSignatureSummary(
  sess: TrainingSession,
): SessionSignatureSummary {
  const n = sess.studentIds.length;
  if (n === 0) {
    return {
      n: 0,
      signedM: 0,
      signedA: 0,
      fullyComplete: false,
      incompleteSignatures: false,
    };
  }
  let signedM = 0;
  let signedA = 0;
  for (const id of sess.studentIds) {
    if (sess.attendance.morning[id]?.signatureDataUrl) signedM++;
    if (sess.attendance.afternoon[id]?.signatureDataUrl) signedA++;
  }
  const fullyComplete = signedM === n && signedA === n;
  return {
    n,
    signedM,
    signedA,
    fullyComplete,
    incompleteSignatures: !fullyComplete,
  };
}
