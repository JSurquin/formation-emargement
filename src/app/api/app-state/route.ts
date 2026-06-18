import { NextResponse } from "next/server";
import { loadAppStateFromDb, saveAppStateToDb } from "@/lib/app-state-db";
import { parseAppStateImport } from "@/lib/app-state-io";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await loadAppStateFromDb();
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
