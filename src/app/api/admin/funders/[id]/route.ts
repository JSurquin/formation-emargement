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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;

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

    const existing = await prisma.funder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Financeur introuvable." },
        { status: 404 },
      );
    }

    const funder = await prisma.funder.update({
      where: { id },
      data: {
        name: normalized.name,
        siret: normalized.siret ?? null,
        email: normalized.email ?? null,
      },
    });

    return NextResponse.json({ funder: mapFunder(funder) });
  } catch (error) {
    console.error("PATCH /api/admin/funders/[id] failed:", error);
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const existing = await prisma.funder.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Financeur introuvable." },
        { status: 404 },
      );
    }

    await prisma.funder.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/funders/[id] failed:", error);
    return NextResponse.json(
      { error: "Suppression impossible." },
      { status: 500 },
    );
  }
}
