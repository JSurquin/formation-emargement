import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth-password";
import {
  authCookieOptions,
  createAuthSession,
  getCurrentUser,
} from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-mail et mot de passe requis." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Identifiants incorrects." },
        { status: 401 },
      );
    }

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
    console.error("POST /api/auth/login failed:", error);
    return NextResponse.json(
      { error: "Connexion impossible." },
      { status: 500 },
    );
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}
