import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, type UserRole } from "@/lib/auth-types";
import {
  canUserAccessPath,
  getDefaultHomeForRole,
} from "@/lib/route-access";

const PUBLIC_PREFIXES = [
  "/login",
  "/inscription",
  "/sign/",
  "/api/auth/",
  "/api/sign/",
  "/api/build-id",
];

function getAuthSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET?.trim() || "dev-insecure-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

type AuthFromToken = {
  role: UserRole;
  studentId: string | null;
};

async function getAuthFromToken(token: string): Promise<AuthFromToken | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const role = payload.role;
    if (role !== "SUPER_ADMIN" && role !== "FORMATEUR" && role !== "ELEVE") {
      return null;
    }
    const studentId =
      typeof payload.studentId === "string" ? payload.studentId : null;
    return { role, studentId };
  } catch {
    return null;
  }
}

function redirectForRole(auth: AuthFromToken, request: NextRequest): NextResponse {
  const home = getDefaultHomeForRole(auth.role, auth.studentId);
  return NextResponse.redirect(new URL(home, request.url));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const auth = await getAuthFromToken(token);
  if (!auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canUserAccessPath(auth, pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    return redirectForRole(auth, request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
