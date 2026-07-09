import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";
import {
  AUTH_COOKIE_NAME,
  type AuthUser,
  type UserRole,
} from "@/lib/auth-types";

const tokenToUser = new Map<string, AuthUser>();

vi.mock("@/lib/auth-session", () => ({
  AUTH_COOKIE_NAME: "fe_auth",
  getAuthUserFromToken: vi.fn(async (token: string | undefined) => {
    if (!token) return null;
    return tokenToUser.get(token) ?? null;
  }),
}));

import { proxy } from "./proxy";

const AUTH_SECRET = new TextEncoder().encode(
  "dev-insecure-auth-secret-change-me",
);

function requestFor(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined;
  return new NextRequest(`http://localhost${path}`, { headers });
}

function authCookie(role: UserRole, studentId?: string): string {
  const token = crypto.randomUUID();
  tokenToUser.set(token, {
    id: "user-1",
    email: "test@example.com",
    firstName: "Test",
    lastName: "User",
    role,
    studentId: studentId ?? null,
  });
  return `${AUTH_COOKIE_NAME}=${token}`;
}

describe("proxy auth", () => {
  it("redirige les pages privées vers la connexion sans cookie", async () => {
    for (const path of [
      "/",
      "/eleves",
      "/formations",
      "/admin",
      "/planning",
      "/statistiques",
    ]) {
      const res = await proxy(requestFor(path));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    }
  });

  it("laisse les pages publiques accessibles", async () => {
    for (const path of [
      "/login",
      "/inscription",
      "/sign/abc123",
      "/api/auth/login",
      "/api/sign/abc123",
      "/api/build-id",
    ]) {
      const res = await proxy(requestFor(path));
      expect(res.status).toBe(200);
    }
  });

  it("bloque l’API app-state sans authentification", async () => {
    const res = await proxy(requestFor("/api/app-state"));
    expect(res.status).toBe(401);
  });

  it("autorise le staff sur les pages métier", async () => {
    for (const role of ["SUPER_ADMIN", "FORMATEUR"] as const) {
      const cookie = authCookie(role);
      for (const path of [
        "/",
        "/eleves",
        "/formations",
        "/conventions",
        "/statistiques",
        "/sessions/s1",
      ]) {
        const res = await proxy(requestFor(path, cookie));
        expect(res.status).toBe(200);
      }
    }
  });

  it("redirige un élève hors des pages réservées au staff", async () => {
    const cookie = authCookie("ELEVE", "stu-1");
    for (const path of [
      "/",
      "/eleves",
      "/formations",
      "/conventions",
      "/statistiques",
      "/sessions/s1",
      "/admin",
      "/planning",
    ]) {
      const res = await proxy(requestFor(path, cookie));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/eleves/stu-1");
    }
  });

  it("laisse un élève accéder uniquement à son espace", async () => {
    const cookie = authCookie("ELEVE", "stu-1");
    const own = await proxy(requestFor("/eleves/stu-1", cookie));
    expect(own.status).toBe(200);

    const other = await proxy(requestFor("/eleves/stu-2", cookie));
    expect(other.status).toBe(307);
    expect(other.headers.get("location")).toContain("/eleves/stu-1");
  });

  it("réserve l’administration au super administrateur", async () => {
    const adminCookie = authCookie("SUPER_ADMIN");
    const trainerCookie = authCookie("FORMATEUR");

    expect((await proxy(requestFor("/admin", adminCookie))).status).toBe(200);
    expect((await proxy(requestFor("/api/admin/trainers", adminCookie))).status).toBe(
      200,
    );

    const blockedAdmin = await proxy(requestFor("/admin", trainerCookie));
    expect(blockedAdmin.status).toBe(307);
    expect(blockedAdmin.headers.get("location")).toContain("/");

    const blockedApi = await proxy(
      requestFor("/api/admin/trainers", trainerCookie),
    );
    expect(blockedApi.status).toBe(403);
  });

  it("réserve le planning au formateur", async () => {
    const trainerCookie = authCookie("FORMATEUR");
    const adminCookie = authCookie("SUPER_ADMIN");

    expect((await proxy(requestFor("/planning", trainerCookie))).status).toBe(
      200,
    );
    expect(
      (await proxy(requestFor("/api/trainer/planning", trainerCookie))).status,
    ).toBe(200);

    const blockedAdmin = await proxy(requestFor("/planning", adminCookie));
    expect(blockedAdmin.status).toBe(307);
    expect(blockedAdmin.headers.get("location")).toContain("/");
  });

  it("réserve la facturation au super administrateur", async () => {
    const adminCookie = authCookie("SUPER_ADMIN");
    const trainerCookie = authCookie("FORMATEUR");

    expect((await proxy(requestFor("/facturation", adminCookie))).status).toBe(
      200,
    );

    const blocked = await proxy(requestFor("/facturation", trainerCookie));
    expect(blocked.status).toBe(307);
    expect(blocked.headers.get("location")).toContain("/");
  });

  it("autorise le staff sur calendrier et satisfaction", async () => {
    for (const role of ["SUPER_ADMIN", "FORMATEUR"] as const) {
      const cookie = authCookie(role);
      for (const path of ["/calendrier", "/satisfaction"]) {
        expect((await proxy(requestFor(path, cookie))).status).toBe(200);
      }
    }
  });

  it("bloque les API staff aux élèves", async () => {
    const cookie = authCookie("ELEVE", "stu-1");
    for (const path of [
      "/api/sessions/s1/send-emails",
      "/api/students/stu-1/send-reminder",
      "/api/funders",
    ]) {
      const res = await proxy(requestFor(path, cookie));
      expect(res.status).toBe(403);
    }
  });

  it("autorise l’élève sur app-state", async () => {
    const cookie = authCookie("ELEVE", "stu-1");
    expect((await proxy(requestFor("/api/app-state", cookie))).status).toBe(200);
  });

  it("utilise le rôle en base, pas celui du JWT", async () => {
    const forgedJwt = await new SignJWT({
      sid: "fake-session",
      uid: "user-1",
      role: "SUPER_ADMIN",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(AUTH_SECRET);

    tokenToUser.set(forgedJwt, {
      id: "user-1",
      email: "test@example.com",
      firstName: "Test",
      lastName: "User",
      role: "FORMATEUR",
      studentId: null,
    });

    const cookie = `${AUTH_COOKIE_NAME}=${forgedJwt}`;
    const blocked = await proxy(requestFor("/admin", cookie));
    expect(blocked.status).toBe(307);
    expect(blocked.headers.get("location")).toContain("/");
  });
});
