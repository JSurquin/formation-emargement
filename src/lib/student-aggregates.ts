import type { AppState, Student } from "./types";

export type StudentAttendanceRow = {
  student: Student;
  sessionsCount: number;
  signedSlots: number;
  possibleSlots: number;
  pct: number | null;
};

export function computeStudentAttendanceRows(
  state: AppState,
): StudentAttendanceRow[] {
  return state.students.map((student) => {
    let signedSlots = 0;
    let possibleSlots = 0;
    const sessionsOn = state.sessions.filter((s) =>
      s.studentIds.includes(student.id),
    );
    for (const sess of sessionsOn) {
      possibleSlots += 2;
      if (sess.attendance.morning[student.id]?.signatureDataUrl) signedSlots++;
      if (sess.attendance.afternoon[student.id]?.signatureDataUrl) signedSlots++;
    }
    const pct =
      possibleSlots > 0 ? Math.round((100 * signedSlots) / possibleSlots) : null;
    return {
      student,
      sessionsCount: sessionsOn.length,
      signedSlots,
      possibleSlots,
      pct,
    };
  });
}
