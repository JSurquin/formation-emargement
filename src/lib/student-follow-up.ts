import { isConventionSigned as isConventionSignedFromList } from "./convention-list";
import type { Student, TrainingSession } from "./types";
import { isStudentProfileComplete } from "./student-profile";

export type FollowUpItemId =
  | "profile"
  | "identity_document"
  | "convention"
  | "presence";

export type FollowUpItem = {
  id: FollowUpItemId;
  label: string;
  ok: boolean;
};

export function hasIdentityDocument(student: Student): boolean {
  return (student.documents ?? []).some((d) => d.kind === "identity");
}

export function isConventionSigned(
  student: Student,
  students: Student[] = [],
): boolean {
  return isConventionSignedFromList(student, students);
}

export function isPresenceConfirmedForSession(
  student: Student,
  sessionId: string,
): boolean {
  return student.presenceConfirmedForSessionId === sessionId;
}

export function getUpcomingSessionForStudent(
  studentId: string,
  sessions: TrainingSession[],
): TrainingSession | undefined {
  const today = new Date().toISOString().slice(0, 10);
  return sessions
    .filter(
      (s) =>
        !s.archived &&
        s.studentIds.includes(studentId) &&
        s.date >= today,
    )
    .sort((a, b) => a.date.localeCompare(b.date))[0];
}

export function getStudentFollowUp(
  student: Student,
  sessions: TrainingSession[],
  students: Student[] = [],
): { items: FollowUpItem[]; upcomingSession?: TrainingSession } {
  const upcomingSession = getUpcomingSessionForStudent(student.id, sessions);
  const items: FollowUpItem[] = [
    {
      id: "profile",
      label: "Fiche complète (e-mail et NIR)",
      ok: isStudentProfileComplete(student),
    },
    {
      id: "identity_document",
      label: "Pièce d'identité jointe",
      ok: hasIdentityDocument(student),
    },
    {
      id: "convention",
      label: "Convention signée",
      ok: isConventionSigned(student, students),
    },
  ];

  if (upcomingSession) {
    items.push({
      id: "presence",
      label: `Présence confirmée — ${upcomingSession.title}`,
      ok: isPresenceConfirmedForSession(student, upcomingSession.id),
    });
  }

  return { items, upcomingSession };
}

export function getPendingFollowUpLabels(items: FollowUpItem[]): string[] {
  return items.filter((i) => !i.ok).map((i) => i.label);
}
