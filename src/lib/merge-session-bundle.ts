import type { AppState, AttendanceSlot, TrainingSession } from "./types";
import { emptySlot } from "./types";
import type { SessionJsonBundle } from "./export-session-json";
import { newId } from "./id";
import { mergeStudentsIntoLocal } from "./student-merge";

function cloneSlot(slot: AttendanceSlot | undefined): AttendanceSlot {
  if (
    slot &&
    typeof slot.present === "boolean" &&
    (slot.signatureDataUrl === null || typeof slot.signatureDataUrl === "string") &&
    (slot.signedAt === null || typeof slot.signedAt === "string")
  ) {
    return { ...slot };
  }
  return emptySlot();
}

/**
 * Fusionne un export « une session » : élèves (même logique que la fusion globale),
 * puis nouvelle feuille avec un nouvel id (pas d’écrasement).
 */
export function mergeSessionBundleIntoState(
  local: AppState,
  bundle: SessionJsonBundle,
): AppState {
  const students = mergeStudentsIntoLocal(local.students, bundle.students);
  const knownIds = new Set(students.map((s) => s.id));
  const rawIds = [...new Set(bundle.session.studentIds)];
  const validIds = rawIds.filter((id) => knownIds.has(id));

  const morning: Record<string, AttendanceSlot> = {};
  const afternoon: Record<string, AttendanceSlot> = {};
  for (const id of validIds) {
    morning[id] = cloneSlot(bundle.session.attendance.morning[id]);
    afternoon[id] = cloneSlot(bundle.session.attendance.afternoon[id]);
  }

  const now = new Date().toISOString();
  const newSession: TrainingSession = {
    ...bundle.session,
    id: newId(),
    studentIds: validIds,
    attendance: { morning, afternoon },
    createdAt: now,
    lastActivityAt: bundle.session.lastActivityAt ?? now,
  };

  return {
    ...local,
    students,
    sessions: [newSession, ...local.sessions],
  };
}
