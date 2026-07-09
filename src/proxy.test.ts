import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { AUTH_COOKIE_NAME, type UserRole } from "@/lib/auth-types";
import { proxy } from "./proxy";

const AUTH_SECRET = new TextEncoder().encode(
  "dev-insecure-auth-secret-change-me",
);

function requestFor(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined;
  return new NextRequest(`http://localhost${path}`, { headers });
}

async function authCookie(
  role: UserRole,
  studentId?: string,
): Promise<string> {
  const token = await new SignJWT({
    role,
    ...(studentId ? { studentId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(AUTH_SECRET);
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
      const cookie = await authCookie(role);
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
    const cookie = await authCookie("ELEVE", "stu-1");
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
    const cookie = await authCookie("ELEVE", "stu-1");
    const own = await proxy(requestFor("/eleves/stu-1", cookie));
    expect(own.status).toBe(200);

    const other = await proxy(requestFor("/eleves/stu-2", cookie));
    expect(other.status).toBe(307);
    expect(other.headers.get("location")).toContain("/eleves/stu-1");
  });

  it("réserve l’administration au super administrateur", async () => {
    const adminCookie = await authCookie("SUPER_ADMIN");
    const trainerCookie = await authCookie("FORMATEUR");

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
    const trainerCookie = await authCookie("FORMATEUR");
    const adminCookie = await authCookie("SUPER_ADMIN");

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
    const adminCookie = await authCookie("SUPER_ADMIN");
    const trainerCookie = await authCookie("FORMATEUR");

    expect((await proxy(requestFor("/facturation", adminCookie))).status).toBe(
      200,
    );

    const blocked = await proxy(requestFor("/facturation", trainerCookie));
    expect(blocked.status).toBe(307);
    expect(blocked.headers.get("location")).toContain("/");
  });

  it("autorise le staff sur calendrier et satisfaction", async () => {
    for (const role of ["SUPER_ADMIN", "FORMATEUR"] as const) {
      const cookie = await authCookie(role);
      for (const path of ["/calendrier", "/satisfaction"]) {
        expect((await proxy(requestFor(path, cookie))).status).toBe(200);
      }
    }
  });
});
