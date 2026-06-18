import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuthUser } from "@/lib/auth-types";

export const AUTH_COOKIE_NAME = "fe_auth";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim() || "dev-insecure-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

function toAuthUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "SUPER_ADMIN" | "FORMATEUR" | "ELEVE";
  studentId: string | null;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    studentId: user.studentId,
  };
}

export async function createAuthSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const session = await prisma.authSession.create({
    data: {
      userId,
      tokenHash: crypto.randomUUID(),
      expiresAt,
    },
  });

  return new SignJWT({
    sid: session.id,
    uid: userId,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getAuthSecret());
}

export async function deleteAuthSession(token: string): Promise<void> {
  const payload = await verifyAuthToken(token);
  if (!payload?.sid) return;
  await prisma.authSession.deleteMany({ where: { id: payload.sid } });
}

type AuthTokenPayload = {
  sid: string;
  uid: string;
};

async function verifyAuthToken(
  token: string,
): Promise<AuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    if (
      typeof payload.sid !== "string" ||
      typeof payload.uid !== "string"
    ) {
      return null;
    }
    return { sid: payload.sid, uid: payload.uid };
  } catch {
    return null;
  }
}

export async function getAuthUserFromToken(
  token: string | undefined,
): Promise<AuthUser | null> {
  if (!token) return null;

  const payload = await verifyAuthToken(token);
  if (!payload) return null;

  const session = await prisma.authSession.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (!session || session.expiresAt.getTime() < Date.now()) {
    if (session) {
      await prisma.authSession.delete({ where: { id: session.id } });
    }
    return null;
  }

  if (session.userId !== payload.uid) return null;
  return toAuthUser(session.user);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  return getAuthUserFromToken(token);
}

export function authCookieOptions(token: string, expiresAt: Date) {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function clearAuthCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  };
}
