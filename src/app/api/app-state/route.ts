import { NextResponse } from "next/server";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/app-state-db";
import { parseAppStateImport } from "@/lib/app-state-io";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageSessions } from "@/lib/auth-types";
import type { AppState } from "@/lib/types";

export const dynamic = "force-dynamic";

function filterAppStateForStudent(
  state: AppState,
  studentId: string,
): AppState {
  const student = state.students.find((s) => s.id === studentId);
  const sessions = state.sessions.filter((session) =>
    session.studentIds.includes(studentId),
  );
  return {
    ...state,
    students: student ? [student] : [],
    sessions,
    noteSnippets: [],
    sessionTemplates: [],
    trainingCatalog: [],
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const state = await loadAppStateFromDb();
    if (user.role === "ELEVE") {
      if (!user.studentId) {
        return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      }
      return NextResponse.json(filterAppStateForStudent(state, user.studentId));
    }
    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/app-state failed:", error);
    return NextResponse.json(
      { error: "Impossible de charger les données." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const user = await getCurrentUser();
  if (!user || !canManageSessions(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const raw = await request.json();
    const state = parseAppStateImport(raw);
    if (!state) {
      return NextResponse.json(
        { error: "Données invalides." },
        { status: 400 },
      );
    }
    await saveAppStateToDb(state);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/app-state failed:", error);
    return NextResponse.json(
      { error: "Impossible d’enregistrer les données." },
      { status: 500 },
    );
  }
}
