import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import {
  mapSessionToPlanningRow,
  splitPlanningSessions,
} from "@/lib/trainer-planning";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "FORMATEUR") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const rows = await prisma.trainingSession.findMany({
      where: { trainerUserId: user.id },
      orderBy: [{ date: "asc" }, { title: "asc" }],
      select: {
        id: true,
        title: true,
        date: true,
        location: true,
        studentIds: true,
        archived: true,
        trainerDocuments: true,
      },
    });

    const sessions = rows.map(mapSessionToPlanningRow);
    const { upcoming, past } = splitPlanningSessions(sessions);

    return NextResponse.json({ upcoming, past, total: sessions.length });
  } catch (error) {
    console.error("GET /api/trainer/planning failed:", error);
    return NextResponse.json(
      { error: "Impossible de charger le planning." },
      { status: 500 },
    );
  }
}
