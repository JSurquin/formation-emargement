import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { canManageStudents } from "@/lib/auth-types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !canManageStudents(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const funders = await prisma.funder.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      siret: true,
      email: true,
    },
  });

  return NextResponse.json({
    funders: funders.map((row) => ({
      id: row.id,
      name: row.name,
      siret: row.siret ?? undefined,
      email: row.email ?? undefined,
    })),
  });
}
