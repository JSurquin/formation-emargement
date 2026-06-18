import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, type UserRole } from "@/lib/auth-types";

const PUBLIC_PREFIXES = ["/login", "/inscription", "/sign/", "/api/auth/"];
const ADMIN_PREFIX = "/admin";
const ADMIN_API_PREFIX = "/api/admin/";

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim() || "dev-insecure-auth-secret-change-me";
  return new TextEncoder().encode(secret);
}

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

function requiredRolesForPath(pathname: string): UserRole[] | null {
  if (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(ADMIN_API_PREFIX)) {
    return ["SUPER_ADMIN"];
  }
  return null;
}

async function getRoleFromToken(token: string): Promise<UserRole | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret());
    const role = payload.role;
    if (role === "SUPER_ADMIN" || role === "FORMATEUR" || role === "ELEVE") {
      return role;
    }
    return null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
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

  const role = await getRoleFromToken(token);
  if (!role) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requiredRoles = requiredRolesForPath(pathname);
  if (requiredRoles && !requiredRoles.includes(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
