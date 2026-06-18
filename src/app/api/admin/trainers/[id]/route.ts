import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import {
  normalizeTrainerProfileInput,
  parseTrainerProfileDocuments,
} from "@/lib/trainer-profile";
import type { TrainerProfileDocument } from "@/lib/types";

export const dynamic = "force-dynamic";

function mapTrainer(row: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  company: string | null;
  companySiret: string | null;
  documents: Prisma.JsonValue | null;
  createdAt: Date;
}) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone ?? undefined,
    dateOfBirth: row.dateOfBirth ?? undefined,
    company: row.company ?? undefined,
    companySiret: row.companySiret ?? undefined,
    documents: parseTrainerProfileDocuments(row.documents),
    createdAt: row.createdAt,
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
      phone?: string;
      dateOfBirth?: string;
      company?: string;
      companySiret?: string;
      documents?: TrainerProfileDocument[];
    };

    const existing = await prisma.user.findFirst({
      where: { id, role: "FORMATEUR" },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Formateur introuvable." },
        { status: 404 },
      );
    }

    const normalized = normalizeTrainerProfileInput(body);
    const documents =
      body.documents === undefined
        ? undefined
        : (parseTrainerProfileDocuments(body.documents) ?? []);

    const trainer = await prisma.user.update({
      where: { id },
      data: {
        phone: normalized.phone ?? null,
        dateOfBirth: normalized.dateOfBirth ?? null,
        company: normalized.company ?? null,
        companySiret: normalized.companySiret ?? null,
        ...(documents !== undefined
          ? { documents: documents as unknown as Prisma.InputJsonValue }
          : {}),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        dateOfBirth: true,
        company: true,
        companySiret: true,
        documents: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ trainer: mapTrainer(trainer) });
  } catch (error) {
    console.error("PATCH /api/admin/trainers/[id] failed:", error);
    return NextResponse.json(
      { error: "Mise à jour impossible." },
      { status: 500 },
    );
  }
}
