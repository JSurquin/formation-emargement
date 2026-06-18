import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth-session";
import { hashPassword, isPasswordStrongEnough } from "@/lib/auth-password";
import { sendWelcomeEmail } from "@/lib/email";
import { ROLE_LABELS } from "@/lib/auth-types";
import {
  normalizeTrainerProfileInput,
  parseTrainerProfileDocuments,
} from "@/lib/trainer-profile";
import type { Prisma } from "@prisma/client";

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

const trainerSelect = {
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
} as const;

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const trainers = await prisma.user.findMany({
    where: { role: "FORMATEUR" },
    orderBy: { createdAt: "desc" },
    select: trainerSelect,
  });

  return NextResponse.json({ trainers: trainers.map(mapTrainer) });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      dateOfBirth?: string;
      company?: string;
      companySiret?: string;
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const profile = normalizeTrainerProfileInput(body);

    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Tous les champs sont requis." },
        { status: 400 },
      );
    }

    if (!isPasswordStrongEnough(password)) {
      return NextResponse.json(
        { error: "Mot de passe trop court (8 caractères minimum)." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet e-mail." },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(password);
    const trainer = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: "FORMATEUR",
        phone: profile.phone ?? null,
        dateOfBirth: profile.dateOfBirth ?? null,
        company: profile.company ?? null,
        companySiret: profile.companySiret ?? null,
      },
      select: trainerSelect,
    });

    const loginUrl = `${process.env.APP_URL ?? "http://localhost:3000"}/login`;
    void sendWelcomeEmail({
      to: email,
      name: `${firstName} ${lastName}`,
      roleLabel: ROLE_LABELS.FORMATEUR,
      loginUrl,
    }).catch((err) => console.error("welcome email failed:", err));

    return NextResponse.json({ trainer: mapTrainer(trainer) });
  } catch (error) {
    console.error("POST /api/admin/trainers failed:", error);
    return NextResponse.json(
      { error: "Création impossible." },
      { status: 500 },
    );
  }
}
