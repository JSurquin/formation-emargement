import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, isPasswordStrongEnough } from "@/lib/auth-password";
import {
  authCookieOptions,
  createAuthSession,
} from "@/lib/auth-session";
import { newId } from "@/lib/id";

export const dynamic = "force-dynamic";

class RegisterConflictError extends Error {
  constructor() {
    super("email_conflict");
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      setupKey?: string;
      role?: "SUPER_ADMIN" | "ELEVE";
    };

    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();

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

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('formation_emargement_bootstrap'))`;

      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new RegisterConflictError();
      }

      const userCount = await tx.user.count();
      let role: "SUPER_ADMIN" | "ELEVE" = "ELEVE";

      if (userCount === 0) {
        role = "SUPER_ADMIN";
      } else if (body.role === "SUPER_ADMIN") {
        const setupKey = process.env.SETUP_KEY?.trim();
        if (!setupKey || body.setupKey !== setupKey) {
          throw new Error("invalid_setup_key");
        }
        role = "SUPER_ADMIN";
      }

      let studentId: string | null = null;

      if (role === "ELEVE") {
        studentId = newId();
        await tx.student.create({
          data: {
            id: studentId,
            firstName,
            lastName,
            email,
          },
        });
      }

      return tx.user.create({
        data: {
          email,
          passwordHash,
          firstName,
          lastName,
          role,
          studentId,
        },
      });
    });

    const token = await createAuthSession(user.id);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentId: user.studentId,
      },
    });
    response.cookies.set(authCookieOptions(token, expiresAt));
    return response;
  } catch (error) {
    if (error instanceof RegisterConflictError) {
      return NextResponse.json(
        { error: "Un compte existe déjà avec cet e-mail." },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "invalid_setup_key") {
      return NextResponse.json(
        { error: "Clé d'installation invalide." },
        { status: 403 },
      );
    }
    console.error("POST /api/auth/register failed:", error);
    return NextResponse.json(
      { error: "Inscription impossible." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const userCount = await prisma.user.count();
  return NextResponse.json({ needsSetup: userCount === 0 });
}
