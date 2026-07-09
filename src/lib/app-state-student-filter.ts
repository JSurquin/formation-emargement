import type { AppState, AttendanceSlot, TrainingSession } from "./types";
import { emptySlot } from "./types";

function attendanceForStudent(
  attendance: TrainingSession["attendance"],
  studentId: string,
): TrainingSession["attendance"] {
  const pick = (half: Record<string, AttendanceSlot>) => ({
    [studentId]: half[studentId] ?? emptySlot(),
  });
  return {
    morning: pick(attendance.morning),
    afternoon: pick(attendance.afternoon),
  };
}

function sessionForStudent(
  session: TrainingSession,
  studentId: string,
): TrainingSession {
  const ownAttestation = session.attestationSignatures?.[studentId];
  return {
    id: session.id,
    title: session.title,
    date: session.date,
    studentIds: [studentId],
    location: session.location,
    trainer: session.trainer,
    attendance: attendanceForStudent(session.attendance, studentId),
    ...(ownAttestation
      ? { attestationSignatures: { [studentId]: ownAttestation } }
      : {}),
  };
}

/** Réduit l'état applicatif aux seules données qu'un compte élève peut consulter. */
export function filterAppStateForStudent(
  state: AppState,
  studentId: string,
): AppState {
  const student = state.students.find((s) => s.id === studentId);
  const sessions = state.sessions
    .filter((session) => session.studentIds.includes(studentId))
    .map((session) => sessionForStudent(session, studentId));

  const satisfactionResponses = state.satisfactionResponses?.filter(
    (response) => response.studentId === studentId,
  );

  return {
    schemaVersion: state.schemaVersion,
    organizationName: state.organizationName,
    students: student ? [student] : [],
    sessions,
    satisfactionQuestions: state.satisfactionQuestions,
    ...(satisfactionResponses?.length
      ? { satisfactionResponses }
      : { satisfactionResponses: [] }),
  };
}
