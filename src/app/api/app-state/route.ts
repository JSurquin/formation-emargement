import { NextResponse } from "next/server";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/app-state-db";
import { filterAppStateForStudent } from "@/lib/app-state-student-filter";
import { parseAppStateImport } from "@/lib/app-state-io";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageSessions } from "@/lib/auth-types";
import { prisma } from "@/lib/prisma";
import type { AppState } from "@/lib/types";

export const dynamic = "force-dynamic";

async function rejectsMassDeletion(
  state: AppState,
  role: "SUPER_ADMIN" | "FORMATEUR" | "ELEVE",
): Promise<boolean> {
  if (role === "SUPER_ADMIN") return false;

  const [studentCount, sessionCount] = await Promise.all([
    prisma.student.count(),
    prisma.trainingSession.count(),
  ]);

  if (studentCount > 0 && state.students.length === 0) return true;
  if (sessionCount > 0 && state.sessions.length === 0) return true;
  return false;
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
    if (await rejectsMassDeletion(state, user.role)) {
      return NextResponse.json(
        { error: "Suppression totale des données non autorisée." },
        { status: 403 },
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
