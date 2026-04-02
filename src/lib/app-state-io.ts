import type { AppState, SessionTemplate, Student, TrainingSession } from "./types";
import type { SessionJsonBundle } from "./export-session-json";

const EXPORT_VERSION = 1 as const;

export type ExportPayload = {
  version: typeof EXPORT_VERSION;
  exportedAt: string;
  state: AppState;
};

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isStudent(x: unknown): boolean {
  if (!isRecord(x)) return false;
  if (
    typeof x.id !== "string" ||
    typeof x.firstName !== "string" ||
    typeof x.lastName !== "string"
  ) {
    return false;
  }
  if (x.email !== undefined && typeof x.email !== "string") return false;
  if (x.phone !== undefined && typeof x.phone !== "string") return false;
  if (x.company !== undefined && typeof x.company !== "string") return false;
  return true;
}

function isAttendanceSlot(x: unknown): boolean {
  if (!isRecord(x)) return false;
  return (
    typeof x.present === "boolean" &&
    (x.signatureDataUrl === null || typeof x.signatureDataUrl === "string") &&
    (x.signedAt === null || typeof x.signedAt === "string")
  );
}

function isSession(x: unknown): x is TrainingSession {
  if (!isRecord(x)) return false;
  if (
    typeof x.id !== "string" ||
    typeof x.title !== "string" ||
    typeof x.date !== "string" ||
    !Array.isArray(x.studentIds) ||
    !x.studentIds.every((id) => typeof id === "string")
  ) {
    return false;
  }
  const tags = x.tags;
  if (
    tags !== undefined &&
    (!Array.isArray(tags) || !tags.every((t) => typeof t === "string"))
  ) {
    return false;
  }
  if (x.favorited !== undefined && typeof x.favorited !== "boolean") {
    return false;
  }
  if (x.archived !== undefined && typeof x.archived !== "boolean") {
    return false;
  }
  if (x.location !== undefined && typeof x.location !== "string") return false;
  if (x.trainer !== undefined && typeof x.trainer !== "string") return false;
  if (x.createdAt !== undefined && typeof x.createdAt !== "string") return false;
  const att = x.attendance;
  if (!isRecord(att)) return false;
  const m = att.morning;
  const a = att.afternoon;
  if (!isRecord(m) || !isRecord(a)) return false;
  for (const k of Object.keys(m)) {
    if (!isAttendanceSlot(m[k])) return false;
  }
  for (const k of Object.keys(a)) {
    if (!isAttendanceSlot(a[k])) return false;
  }
  if (
    x.lastActivityAt !== undefined &&
    typeof x.lastActivityAt !== "string"
  ) {
    return false;
  }
  return x.notes === undefined || typeof x.notes === "string";
}

function isSessionTemplate(x: unknown): x is SessionTemplate {
  if (!isRecord(x)) return false;
  return (
    typeof x.id === "string" &&
    typeof x.name === "string" &&
    Array.isArray(x.studentIds) &&
    x.studentIds.every((id) => typeof id === "string")
  );
}

/** Valide un export JSON « une session » (fichier produit par l’app). */
export function parseSessionJsonBundle(raw: unknown): SessionJsonBundle | null {
  if (!isRecord(raw)) return null;
  if (raw.version !== 1) return null;
  if (typeof raw.exportedAt !== "string") return null;
  if (!isSession(raw.session)) return null;
  if (!Array.isArray(raw.students) || !raw.students.every(isStudent)) {
    return null;
  }
  return {
    version: 1,
    exportedAt: raw.exportedAt,
    session: raw.session as TrainingSession,
    students: raw.students as Student[],
  };
}

/** Valide un JSON importé (sauvegarde ou export). */
export function parseAppStateImport(raw: unknown): AppState | null {
  let data = raw;
  if (isRecord(raw) && raw.state && isRecord(raw.state)) {
    data = raw.state;
  }
  if (!isRecord(data)) return null;
  if (!Array.isArray(data.students) || !Array.isArray(data.sessions)) {
    return null;
  }
  if (!data.students.every(isStudent)) return null;
  if (!data.sessions.every(isSession)) return null;
  const org = data.organizationName;
  if (org !== undefined && typeof org !== "string") return null;
  const snippets = data.noteSnippets;
  if (
    snippets !== undefined &&
    (!Array.isArray(snippets) || !snippets.every((x) => typeof x === "string"))
  ) {
    return null;
  }
  const templates = data.sessionTemplates;
  if (
    templates !== undefined &&
    (!Array.isArray(templates) || !templates.every(isSessionTemplate))
  ) {
    return null;
  }
  return {
    students: data.students as AppState["students"],
    sessions: data.sessions as AppState["sessions"],
    organizationName: typeof org === "string" ? org : undefined,
    noteSnippets:
      snippets === undefined
        ? undefined
        : (snippets as string[]).map((s) => s.trim()).filter(Boolean),
    sessionTemplates:
      templates === undefined
        ? undefined
        : (templates as SessionTemplate[]).map((t) => ({
            ...t,
            name: t.name.trim(),
          })),
  };
}

export function buildExportPayload(state: AppState): ExportPayload {
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    state: {
      students: state.students,
      sessions: state.sessions,
      organizationName: state.organizationName,
      noteSnippets: state.noteSnippets,
      sessionTemplates: state.sessionTemplates,
    },
  };
}
