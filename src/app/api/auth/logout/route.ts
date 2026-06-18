import { NextResponse } from "next/server";
import { clearAuthCookieOptions, deleteAuthSession } from "@/lib/auth-session";
import { AUTH_COOKIE_NAME } from "@/lib/auth-session";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (token) {
    await deleteAuthSession(token);
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearAuthCookieOptions());
  return response;
}
