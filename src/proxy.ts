import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUserFromToken, AUTH_COOKIE_NAME } from "@/lib/auth-session";
import type { UserRole } from "@/lib/auth-types";
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

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix),
  );
}

type AuthContext = {
  role: UserRole;
  studentId: string | null;
};

function redirectForRole(auth: AuthContext, request: NextRequest): NextResponse {
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

  const user = await getAuthUserFromToken(token);
  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const auth: AuthContext = { role: user.role, studentId: user.studentId };
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
