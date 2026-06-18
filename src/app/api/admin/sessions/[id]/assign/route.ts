import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { sendTrainerAssignedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id: sessionId } = await params;
    const body = (await request.json()) as { trainerUserId?: string | null };
    const trainerUserId = body.trainerUserId ?? null;

    const session = await prisma.trainingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json(
        { error: "Session introuvable." },
        { status: 404 },
      );
    }

    let trainerName: string | null = null;
    if (trainerUserId) {
      const trainer = await prisma.user.findFirst({
        where: { id: trainerUserId, role: "FORMATEUR" },
      });
      if (!trainer) {
        return NextResponse.json(
          { error: "Formateur introuvable." },
          { status: 404 },
        );
      }
      trainerName = `${trainer.firstName} ${trainer.lastName}`;
    }

    await prisma.trainingSession.update({
      where: { id: sessionId },
      data: {
        trainerUserId,
        trainer: trainerName ?? session.trainer,
      },
    });

    if (trainerUserId) {
      const trainer = await prisma.user.findUnique({
        where: { id: trainerUserId },
      });
      if (trainer) {
        const sessionUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/sessions/${sessionId}`;
        void sendTrainerAssignedEmail({
          to: trainer.email,
          trainerName: `${trainer.firstName} ${trainer.lastName}`,
          sessionTitle: session.title,
          sessionDate: session.date,
          sessionUrl,
        }).catch((err) => console.error("trainer email failed:", err));
      }
    }

    return NextResponse.json({ ok: true, sessionId, trainerUserId });
  } catch (error) {
    console.error("PATCH /api/admin/sessions/[id]/assign failed:", error);
    return NextResponse.json(
      { error: "Assignation impossible." },
      { status: 500 },
    );
  }
}
