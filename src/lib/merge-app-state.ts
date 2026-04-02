import type { AppState, SessionTemplate, TrainingSession } from "./types";
import { newId } from "./id";
import { mergeStudentsIntoLocal } from "./student-merge";

/**
 * Fusionne un export dans l’état local : élèves par id (mise à jour des champs),
 * sessions (nouvel id + suffixe si collision), snippets et nom d’organisme.
 */
export function mergeAppStates(local: AppState, incoming: AppState): AppState {
  const students = mergeStudentsIntoLocal(local.students, incoming.students);
  const existingSessionIds = new Set(local.sessions.map((x) => x.id));
  const mergedIncoming: TrainingSession[] = [];

  for (const sess of incoming.sessions) {
    if (existingSessionIds.has(sess.id)) {
      const nid = newId();
      mergedIncoming.push({
        ...sess,
        id: nid,
        title: `${sess.title.trim()} (import)`,
      });
      existingSessionIds.add(nid);
    } else {
      mergedIncoming.push({ ...sess });
      existingSessionIds.add(sess.id);
    }
  }

  const sessions = [...mergedIncoming, ...local.sessions];

  const snippetSet = new Set<string>();
  for (const t of local.noteSnippets ?? []) {
    const x = t.trim();
    if (x) snippetSet.add(x);
  }
  for (const t of incoming.noteSnippets ?? []) {
    const x = t.trim();
    if (x) snippetSet.add(x);
  }
  const noteSnippets = [...snippetSet];

  const organizationName =
    local.organizationName?.trim() ||
    incoming.organizationName?.trim() ||
    "";

  const sessionTemplates: SessionTemplate[] = [
    ...(local.sessionTemplates ?? []),
  ];
  const seenTpl = new Set(sessionTemplates.map((t) => t.id));
  for (const t of incoming.sessionTemplates ?? []) {
    if (seenTpl.has(t.id)) {
      const nid = newId();
      sessionTemplates.push({
        ...t,
        id: nid,
        name: `${t.name.trim()} (import)`,
      });
      seenTpl.add(nid);
    } else {
      sessionTemplates.push({ ...t });
      seenTpl.add(t.id);
    }
  }

  return {
    students,
    sessions,
    organizationName,
    noteSnippets,
    sessionTemplates,
  };
}
