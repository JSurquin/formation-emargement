import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { normalizeFunderInput } from "@/lib/funder";

export const dynamic = "force-dynamic";

function mapFunder(row: {
  id: string;
  name: string;
  siret: string | null;
  email: string | null;
}) {
  return {
    id: row.id,
    name: row.name,
    siret: row.siret ?? undefined,
    email: row.email ?? undefined,
  };
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const funders = await prisma.funder.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ funders: funders.map(mapFunder) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      siret?: string;
      email?: string;
    };
    const normalized = normalizeFunderInput(body);
    if (!normalized) {
      return NextResponse.json(
        { error: "Le nom du financeur est requis." },
        { status: 400 },
      );
    }

    const funder = await prisma.funder.create({
      data: {
        name: normalized.name,
        siret: normalized.siret ?? null,
        email: normalized.email ?? null,
      },
    });

    return NextResponse.json({ funder: mapFunder(funder) });
  } catch (error) {
    console.error("POST /api/admin/funders failed:", error);
    return NextResponse.json(
      { error: "Création impossible." },
      { status: 500 },
    );
  }
}
