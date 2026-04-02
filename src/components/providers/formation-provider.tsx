"use client";

import * as React from "react";
import { toast } from "sonner";
import {
  type AppState,
  type HalfDay,
  type SessionTemplate,
  type Student,
  type TrainingSession,
  buildAttendanceForStudents,
  emptySlot,
  mergeAttendanceWithNewStudents,
} from "@/lib/types";
import { migrateAppState } from "@/lib/app-state-migrate";
import { newId } from "@/lib/id";
import {
  defaultAppState,
  loadAppState,
  saveAppState,
} from "@/lib/formation-storage";
import type { SessionJsonBundle } from "@/lib/export-session-json";
import { mergeSessionBundleIntoState } from "@/lib/merge-session-bundle";
import { mergeAppStates } from "@/lib/merge-app-state";

function normalizeTags(tags: string[] | undefined): string[] | undefined {
  if (!tags?.length) return undefined;
  const set = new Set<string>();
  for (const t of tags) {
    const x = t.trim();
    if (x) set.add(x);
  }
  const arr = [...set];
  return arr.length ? arr : undefined;
}

function cloneSession(sess: TrainingSession): TrainingSession {
  return {
    ...sess,
    studentIds: [...sess.studentIds],
    attendance: {
      morning: { ...sess.attendance.morning },
      afternoon: { ...sess.attendance.afternoon },
    },
  };
}

type FormationContextValue = {
  state: AppState;
  hydrated: boolean;
  addStudent: (input: Omit<Student, "id">) => void;
  updateStudent: (id: string, patch: Partial<Omit<Student, "id">>) => void;
  removeStudent: (id: string) => void;
  duplicateStudent: (id: string) => void;
  addSession: (input: {
    title: string;
    date: string;
    studentIds: string[];
    tags?: string[];
    favorited?: boolean;
    notes?: string;
    location?: string;
    trainer?: string;
  }) => void;
  removeSession: (id: string) => void;
  updateSession: (
    sessionId: string,
    patch: Partial<
      Pick<
        TrainingSession,
        | "title"
        | "date"
        | "notes"
        | "tags"
        | "favorited"
        | "archived"
        | "location"
        | "trainer"
      >
    >,
  ) => void;
  toggleSessionFavorite: (sessionId: string) => void;
  addStudentsToSession: (sessionId: string, studentIds: string[]) => void;
  removeStudentFromSession: (sessionId: string, studentId: string) => void;
  setPresent: (
    sessionId: string,
    studentId: string,
    half: HalfDay,
    present: boolean,
  ) => void;
  setSignature: (
    sessionId: string,
    studentId: string,
    half: HalfDay,
    signatureDataUrl: string | null,
  ) => void;
  updateSessionNotes: (sessionId: string, notes: string) => void;
  duplicateSession: (sessionId: string) => void;
  setOrganizationName: (name: string) => void;
  importAppState: (next: AppState) => void;
  importAppStateMerge: (next: AppState) => void;
  importSessionBundle: (bundle: SessionJsonBundle) => void;
  bulkSetSessionsArchived: (sessionIds: string[], archived: boolean) => void;
  setAllPresentForHalf: (
    sessionId: string,
    half: HalfDay,
    present: boolean,
  ) => void;
  clearSignaturesForHalf: (sessionId: string, half: HalfDay) => void;
  addNoteSnippet: (text: string) => void;
  removeNoteSnippet: (index: number) => void;
  addSessionTemplate: (name: string, studentIds: string[]) => void;
  removeSessionTemplate: (id: string) => void;
};

const FormationContext = React.createContext<FormationContextValue | null>(
  null,
);

export function FormationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<AppState>(defaultAppState);
  const [hydrated, setHydrated] = React.useState(false);
  const lastRemovedSessionRef = React.useRef<TrainingSession | null>(null);
  const lastRemovedStudentRef = React.useRef<Student | null>(null);
  const saveErrorToastRef = React.useRef(false);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const persist = React.useCallback(() => {
    const result = saveAppState(stateRef.current);
    if (result.ok) {
      saveErrorToastRef.current = false;
      return;
    }
    if (saveErrorToastRef.current) return;
    saveErrorToastRef.current = true;
    if (result.reason === "quota") {
      toast.error(
        "Espace de stockage du navigateur saturé. Exportez vos données ou réduisez les signatures en image.",
        { duration: 10_000 },
      );
    } else {
      toast.error("Impossible d’enregistrer les données localement.", {
        duration: 8000,
      });
    }
  }, []);

  React.useEffect(() => {
    setState(loadAppState());
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    const t = window.setTimeout(persist, 400);
    return () => window.clearTimeout(t);
  }, [state, hydrated, persist]);

  React.useEffect(() => {
    if (!hydrated) return;
    const flush = persist;
    const onVis = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [hydrated, persist]);

  const addStudent = React.useCallback((input: Omit<Student, "id">) => {
    setState((s) => ({
      ...s,
      students: [
        ...s.students,
        {
          ...input,
          id: newId(),
          email: input.email?.trim() || undefined,
          phone: input.phone?.trim() || undefined,
          company: input.company?.trim() || undefined,
        },
      ],
    }));
  }, []);

  const updateStudent = React.useCallback(
    (id: string, patch: Partial<Omit<Student, "id">>) => {
      setState((s) => ({
        ...s,
        students: s.students.map((st) => {
          if (st.id !== id) return st;
          const next = { ...st };
          if (patch.firstName !== undefined)
            next.firstName = patch.firstName.trim();
          if (patch.lastName !== undefined)
            next.lastName = patch.lastName.trim();
          if (patch.email !== undefined)
            next.email = patch.email.trim() || undefined;
          if (patch.phone !== undefined)
            next.phone = patch.phone.trim() || undefined;
          if (patch.company !== undefined)
            next.company = patch.company.trim() || undefined;
          return next;
        }),
      }));
    },
    [],
  );

  const removeStudent = React.useCallback((id: string) => {
    setState((s) => {
      const st = s.students.find((x) => x.id === id);
      lastRemovedStudentRef.current = st ? { ...st } : null;
      if (!st) return s;
      return {
        ...s,
        students: s.students.filter((x) => x.id !== id),
        sessions: s.sessions.map((sess) => ({
          ...sess,
          studentIds: sess.studentIds.filter((sid) => sid !== id),
          attendance: {
            morning: Object.fromEntries(
              Object.entries(sess.attendance.morning).filter(([k]) => k !== id),
            ),
            afternoon: Object.fromEntries(
              Object.entries(sess.attendance.afternoon).filter(([k]) => k !== id),
            ),
          },
        })),
      };
    });
    queueMicrotask(() => {
      if (!lastRemovedStudentRef.current) return;
      toast.success("Élève retiré de l’annuaire (et des feuilles).", {
        description:
          "Annuler ne restaure que la fiche — pas les listes sur les sessions.",
        action: {
          label: "Annuler",
          onClick: () => {
            const st = lastRemovedStudentRef.current;
            if (!st) return;
            setState((s) => {
              if (s.students.some((x) => x.id === st.id)) return s;
              return { ...s, students: [...s.students, st] };
            });
            lastRemovedStudentRef.current = null;
          },
        },
        duration: 12000,
      });
    });
  }, []);

  const duplicateStudent = React.useCallback((id: string) => {
    setState((s) => {
      const orig = s.students.find((x) => x.id === id);
      if (!orig) return s;
      const dup: Student = {
        ...orig,
        id: newId(),
        firstName: orig.firstName.trim(),
        lastName: `${orig.lastName.trim()} (copie)`,
      };
      return { ...s, students: [...s.students, dup] };
    });
  }, []);

  const addSession = React.useCallback(
    (input: {
      title: string;
      date: string;
      studentIds: string[];
      tags?: string[];
      favorited?: boolean;
      notes?: string;
      location?: string;
      trainer?: string;
    }) => {
      setState((s) => {
        const valid = new Set(s.students.map((st) => st.id));
        const studentIds = [...new Set(input.studentIds)].filter((id) =>
          valid.has(id),
        );
        const now = new Date().toISOString();
        const session: TrainingSession = {
          id: newId(),
          title: input.title.trim(),
          date: input.date,
          studentIds,
          notes: input.notes?.trim() || undefined,
          tags: normalizeTags(input.tags),
          favorited: input.favorited === true ? true : undefined,
          location: input.location?.trim() || undefined,
          trainer: input.trainer?.trim() || undefined,
          createdAt: now,
          lastActivityAt: now,
          attendance: buildAttendanceForStudents(studentIds),
        };
        return { ...s, sessions: [session, ...s.sessions] };
      });
    },
    [],
  );

  const addStudentsToSession = React.useCallback(
    (sessionId: string, studentIds: string[]) => {
      setState((s) => {
        const valid = new Set(s.students.map((st) => st.id));
        const toAdd = [...new Set(studentIds)].filter((id) => valid.has(id));
        return {
          ...s,
          sessions: s.sessions.map((sess) => {
            if (sess.id !== sessionId) return sess;
            const already = new Set(sess.studentIds);
            const newlyAdded = toAdd.filter((id) => !already.has(id));
            if (newlyAdded.length === 0) return sess;
            return {
              ...sess,
              studentIds: [...sess.studentIds, ...newlyAdded],
              attendance: mergeAttendanceWithNewStudents(
                sess.attendance,
                newlyAdded,
              ),
              lastActivityAt: new Date().toISOString(),
            };
          }),
        };
      });
    },
    [],
  );

  const removeStudentFromSession = React.useCallback(
    (sessionId: string, studentId: string) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const morning = { ...sess.attendance.morning };
          const afternoon = { ...sess.attendance.afternoon };
          delete morning[studentId];
          delete afternoon[studentId];
          return {
            ...sess,
            studentIds: sess.studentIds.filter((id) => id !== studentId),
            attendance: { morning, afternoon },
            lastActivityAt: new Date().toISOString(),
          };
        }),
      }));
    },
    [],
  );

  const removeSession = React.useCallback((id: string) => {
    setState((s) => {
      const sess = s.sessions.find((x) => x.id === id);
      lastRemovedSessionRef.current = sess ? cloneSession(sess) : null;
      if (!sess) return s;
      return { ...s, sessions: s.sessions.filter((x) => x.id !== id) };
    });
    queueMicrotask(() => {
      if (!lastRemovedSessionRef.current) return;
      toast.success("Session supprimée.", {
        description: "Annuler restaure la feuille telle qu’elle était.",
        action: {
          label: "Annuler",
          onClick: () => {
            const r = lastRemovedSessionRef.current;
            if (!r) return;
            setState((s) => {
              if (s.sessions.some((x) => x.id === r.id)) return s;
              return { ...s, sessions: [r, ...s.sessions] };
            });
            lastRemovedSessionRef.current = null;
          },
        },
        duration: 12000,
      });
    });
  }, []);

  const updateSession = React.useCallback(
    (
      sessionId: string,
      patch: Partial<
        Pick<
          TrainingSession,
          | "title"
          | "date"
          | "notes"
          | "tags"
          | "favorited"
          | "archived"
          | "location"
          | "trainer"
        >
      >,
    ) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const next = { ...sess };
          if (patch.title !== undefined) next.title = patch.title.trim();
          if (patch.date !== undefined) next.date = patch.date;
          if (patch.notes !== undefined) next.notes = patch.notes;
          if (patch.tags !== undefined) next.tags = normalizeTags(patch.tags);
          if (patch.favorited !== undefined) next.favorited = patch.favorited;
          if (patch.archived !== undefined) next.archived = patch.archived;
          if (patch.location !== undefined)
            next.location = patch.location.trim() || undefined;
          if (patch.trainer !== undefined)
            next.trainer = patch.trainer.trim() || undefined;
          next.lastActivityAt = new Date().toISOString();
          return next;
        }),
      }));
    },
    [],
  );

  const toggleSessionFavorite = React.useCallback((sessionId: string) => {
    setState((s) => ({
      ...s,
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId
          ? {
              ...sess,
              favorited: !sess.favorited,
              lastActivityAt: new Date().toISOString(),
            }
          : sess,
      ),
    }));
  }, []);

  const updateSessionNotes = React.useCallback(
    (sessionId: string, notes: string) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) =>
          sess.id === sessionId
            ? { ...sess, notes, lastActivityAt: new Date().toISOString() }
            : sess,
        ),
      }));
    },
    [],
  );

  const duplicateSession = React.useCallback((sessionId: string) => {
    setState((s) => {
      const orig = s.sessions.find((x) => x.id === sessionId);
      if (!orig) return s;
      const studentIds = [...orig.studentIds];
      const now = new Date().toISOString();
      const dup: TrainingSession = {
        id: newId(),
        title: `${orig.title.trim()} (copie)`,
        date: new Date().toISOString().slice(0, 10),
        studentIds,
        notes: orig.notes,
        tags: orig.tags ? [...orig.tags] : undefined,
        favorited: orig.favorited,
        archived: false,
        location: orig.location,
        trainer: orig.trainer,
        createdAt: now,
        lastActivityAt: now,
        attendance: buildAttendanceForStudents(studentIds),
      };
      return { ...s, sessions: [dup, ...s.sessions] };
    });
  }, []);

  const setOrganizationName = React.useCallback((name: string) => {
    setState((s) => ({ ...s, organizationName: name.trim() }));
  }, []);

  const importAppState = React.useCallback((next: AppState) => {
    setState(
      migrateAppState({
        ...next,
        organizationName: next.organizationName ?? "",
        noteSnippets: next.noteSnippets ?? [],
        sessionTemplates: next.sessionTemplates ?? [],
      }),
    );
  }, []);

  const importAppStateMerge = React.useCallback((next: AppState) => {
    setState((s) => migrateAppState(mergeAppStates(s, next)));
  }, []);

  const importSessionBundle = React.useCallback((bundle: SessionJsonBundle) => {
    setState((s) => migrateAppState(mergeSessionBundleIntoState(s, bundle)));
  }, []);

  const bulkSetSessionsArchived = React.useCallback(
    (sessionIds: string[], archived: boolean) => {
      const idSet = new Set(sessionIds);
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) =>
          idSet.has(sess.id)
            ? { ...sess, archived, lastActivityAt: now }
            : sess,
        ),
      }));
    },
    [],
  );

  const setAllPresentForHalf = React.useCallback(
    (sessionId: string, half: HalfDay, present: boolean) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const nextHalf: TrainingSession["attendance"]["morning"] = {
            ...sess.attendance[half],
          };
          for (const id of sess.studentIds) {
            const slot = nextHalf[id] ?? emptySlot();
            nextHalf[id] = present
              ? { ...slot, present: true }
              : {
                  present: false,
                  signatureDataUrl: null,
                  signedAt: null,
                };
          }
          return {
            ...sess,
            lastActivityAt: now,
            attendance: {
              ...sess.attendance,
              [half]: nextHalf,
            },
          };
        }),
      }));
    },
    [],
  );

  const clearSignaturesForHalf = React.useCallback(
    (sessionId: string, half: HalfDay) => {
      const now = new Date().toISOString();
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const nextHalf = { ...sess.attendance[half] };
          for (const id of sess.studentIds) {
            const slot = nextHalf[id];
            if (slot) {
              nextHalf[id] = {
                ...slot,
                signatureDataUrl: null,
                signedAt: null,
              };
            }
          }
          return {
            ...sess,
            lastActivityAt: now,
            attendance: {
              ...sess.attendance,
              [half]: nextHalf,
            },
          };
        }),
      }));
    },
    [],
  );

  const addNoteSnippet = React.useCallback((text: string) => {
    const t = text.trim();
    if (!t) return;
    setState((s) => {
      const cur = s.noteSnippets ?? [];
      if (cur.includes(t)) return s;
      return { ...s, noteSnippets: [...cur, t] };
    });
  }, []);

  const removeNoteSnippet = React.useCallback((index: number) => {
    setState((s) => ({
      ...s,
      noteSnippets: (s.noteSnippets ?? []).filter((_, i) => i !== index),
    }));
  }, []);

  const addSessionTemplate = React.useCallback(
    (name: string, studentIds: string[]) => {
      const n = name.trim();
      if (!n) return;
      setState((s) => {
        const valid = new Set(s.students.map((st) => st.id));
        const ids = [...new Set(studentIds)].filter((id) => valid.has(id));
        const tpl: SessionTemplate = { id: newId(), name: n, studentIds: ids };
        return {
          ...s,
          sessionTemplates: [...(s.sessionTemplates ?? []), tpl],
        };
      });
    },
    [],
  );

  const removeSessionTemplate = React.useCallback((id: string) => {
    setState((s) => ({
      ...s,
      sessionTemplates: (s.sessionTemplates ?? []).filter((t) => t.id !== id),
    }));
  }, []);

  const setPresent = React.useCallback(
    (sessionId: string, studentId: string, half: HalfDay, present: boolean) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const slot = sess.attendance[half][studentId];
          if (!slot) return sess;
          return {
            ...sess,
            lastActivityAt: new Date().toISOString(),
            attendance: {
              ...sess.attendance,
              [half]: {
                ...sess.attendance[half],
                [studentId]: present
                  ? { ...slot, present: true }
                  : {
                      present: false,
                      signatureDataUrl: null,
                      signedAt: null,
                    },
              },
            },
          };
        }),
      }));
    },
    [],
  );

  const setSignature = React.useCallback(
    (
      sessionId: string,
      studentId: string,
      half: HalfDay,
      signatureDataUrl: string | null,
    ) => {
      setState((s) => ({
        ...s,
        sessions: s.sessions.map((sess) => {
          if (sess.id !== sessionId) return sess;
          const slot = sess.attendance[half][studentId];
          if (!slot) return sess;
          return {
            ...sess,
            lastActivityAt: new Date().toISOString(),
            attendance: {
              ...sess.attendance,
              [half]: {
                ...sess.attendance[half],
                [studentId]: {
                  ...slot,
                  present: true,
                  signatureDataUrl,
                  signedAt: signatureDataUrl
                    ? new Date().toISOString()
                    : null,
                },
              },
            },
          };
        }),
      }));
    },
    [],
  );

  const value = React.useMemo(
    () => ({
      state,
      hydrated,
      addStudent,
      updateStudent,
      removeStudent,
      duplicateStudent,
      addSession,
      removeSession,
      updateSession,
      toggleSessionFavorite,
      addStudentsToSession,
      removeStudentFromSession,
      setPresent,
      setSignature,
      updateSessionNotes,
      duplicateSession,
      setOrganizationName,
      importAppState,
      importAppStateMerge,
      importSessionBundle,
      bulkSetSessionsArchived,
      setAllPresentForHalf,
      clearSignaturesForHalf,
      addNoteSnippet,
      removeNoteSnippet,
      addSessionTemplate,
      removeSessionTemplate,
    }),
    [
      state,
      hydrated,
      addStudent,
      updateStudent,
      removeStudent,
      duplicateStudent,
      addSession,
      removeSession,
      updateSession,
      toggleSessionFavorite,
      addStudentsToSession,
      removeStudentFromSession,
      setPresent,
      setSignature,
      updateSessionNotes,
      duplicateSession,
      setOrganizationName,
      importAppState,
      importAppStateMerge,
      importSessionBundle,
      bulkSetSessionsArchived,
      setAllPresentForHalf,
      clearSignaturesForHalf,
      addNoteSnippet,
      removeNoteSnippet,
      addSessionTemplate,
      removeSessionTemplate,
    ],
  );

  return (
    <FormationContext.Provider value={value}>
      {children}
    </FormationContext.Provider>
  );
}

export function useFormation() {
  const ctx = React.useContext(FormationContext);
  if (!ctx) {
    throw new Error("useFormation doit être utilisé dans FormationProvider");
  }
  return ctx;
}
