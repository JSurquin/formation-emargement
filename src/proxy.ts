import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, type UserRole } from "@/lib/auth-types";

const PUBLIC_PREFIXES = [
  "/login",
  "/inscription",
  "/sign/",
  "/api/auth/",
  "/api/sign/",
  "/api/build-id",
];
const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin/";
const STAFF_ROLES: UserRole[] = ["SUPER_ADMIN", "FORMATEUR"];

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

function requiredRolesForPath(pathname: string): UserRole[] | null {
  if (
    pathname.startsWith(ADMIN_PREFIX) ||
    pathname.startsWith(ADMIN_API_PREFIX)
  ) {
    return ["SUPER_ADMIN"];
  }

  if (
    pathname.startsWith("/planning") ||
    pathname.startsWith("/api/trainer/")
  ) {
    return ["FORMATEUR"];
  }

  if (
    pathname === "/" ||
    pathname === "/eleves" ||
    pathname.startsWith("/formations") ||
    pathname.startsWith("/conventions") ||
    pathname.startsWith("/statistiques") ||
    pathname.startsWith("/sessions/")
  ) {
    return STAFF_ROLES;
  }

  return null;
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
  if (auth.role === "ELEVE" && auth.studentId) {
    return NextResponse.redirect(
      new URL(`/eleves/${auth.studentId}`, request.url),
    );
  }
  return NextResponse.redirect(new URL("/", request.url));
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

  const requiredRoles = requiredRolesForPath(pathname);
  if (requiredRoles && !requiredRoles.includes(auth.role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    return redirectForRole(auth, request);
  }

  if (
    auth.role === "ELEVE" &&
    auth.studentId &&
    pathname.startsWith("/eleves/") &&
    pathname !== `/eleves/${auth.studentId}`
  ) {
    return NextResponse.redirect(
      new URL(`/eleves/${auth.studentId}`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
