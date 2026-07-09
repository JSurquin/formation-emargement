import { describe, expect, it } from "vitest";
import {
  canRoleAccessPath,
  canUserAccessPath,
  getDefaultHomeForRole,
  getNavRoutesForRole,
  getPaletteRoutesForRole,
  getRequiredRolesForPath,
  resolveLoginDestination,
} from "@/lib/route-access";

describe("route-access", () => {
  it("segmente la navigation par rôle", () => {
    const admin = getNavRoutesForRole("SUPER_ADMIN").map((r) => r.id);
    expect(admin).toContain("sessions");
    expect(admin).toContain("admin");
    expect(admin).not.toContain("planning");
    expect(admin).not.toContain("student-space");

    const trainer = getNavRoutesForRole("FORMATEUR").map((r) => r.id);
    expect(trainer).toContain("planning");
    expect(trainer).not.toContain("admin");

    const student = getNavRoutesForRole("ELEVE", "stu-1").map((r) => r.id);
    expect(student).toEqual(["student-space"]);
    expect(getNavRoutesForRole("ELEVE")).toEqual([]);
  });

  it("définit l’accueil par défaut selon le rôle", () => {
    expect(getDefaultHomeForRole("ELEVE", "stu-1")).toBe("/eleves/stu-1");
    expect(getDefaultHomeForRole("ELEVE")).toBe("/login");
    expect(getDefaultHomeForRole("FORMATEUR")).toBe("/");
    expect(getDefaultHomeForRole("SUPER_ADMIN")).toBe("/");
  });

  it("protège les chemins sensibles", () => {
    expect(getRequiredRolesForPath("/admin")).toEqual(["SUPER_ADMIN"]);
    expect(getRequiredRolesForPath("/api/admin/trainers")).toEqual([
      "SUPER_ADMIN",
    ]);
    expect(getRequiredRolesForPath("/planning")).toEqual(["FORMATEUR"]);
    expect(getRequiredRolesForPath("/facturation")).toEqual(["SUPER_ADMIN"]);
    expect(getRequiredRolesForPath("/calendrier")).toEqual([
      "SUPER_ADMIN",
      "FORMATEUR",
    ]);
    expect(getRequiredRolesForPath("/satisfaction")).toEqual([
      "SUPER_ADMIN",
      "FORMATEUR",
    ]);
    expect(getRequiredRolesForPath("/")).toEqual(["SUPER_ADMIN", "FORMATEUR"]);
    expect(getRequiredRolesForPath("/eleves/stu-1")).toEqual([
      "ELEVE",
      "SUPER_ADMIN",
      "FORMATEUR",
    ]);
    expect(getRequiredRolesForPath("/api/sessions/s1/send-emails")).toEqual([
      "SUPER_ADMIN",
      "FORMATEUR",
    ]);
    expect(getRequiredRolesForPath("/api/funders")).toEqual([
      "SUPER_ADMIN",
      "FORMATEUR",
    ]);
  });

  it("valide l’accès par rôle", () => {
    expect(canRoleAccessPath("FORMATEUR", "/planning")).toBe(true);
    expect(canRoleAccessPath("SUPER_ADMIN", "/planning")).toBe(false);
    expect(canRoleAccessPath("ELEVE", "/")).toBe(false);
    expect(canRoleAccessPath("ELEVE", "/eleves/stu-1")).toBe(true);
  });

  it("restreint l’élève à son propre espace", () => {
    const ctx = { role: "ELEVE" as const, studentId: "stu-1" };
    expect(canUserAccessPath(ctx, "/eleves/stu-1")).toBe(true);
    expect(canUserAccessPath(ctx, "/eleves/stu-2")).toBe(false);
    expect(canUserAccessPath(ctx, "/")).toBe(false);
    expect(canUserAccessPath(ctx, "/api/app-state")).toBe(true);
    expect(canUserAccessPath({ role: "ELEVE", studentId: null }, "/")).toBe(
      false,
    );
  });

  it("valide la destination après connexion", () => {
    const trainer = { role: "FORMATEUR" as const, studentId: null };
    expect(resolveLoginDestination("/admin", trainer)).toBe("/");
    expect(resolveLoginDestination("//evil.com", trainer)).toBe("/");
    expect(resolveLoginDestination("/planning", trainer)).toBe("/planning");

    const student = { role: "ELEVE" as const, studentId: "stu-1" };
    expect(resolveLoginDestination("/eleves/stu-1", student)).toBe(
      "/eleves/stu-1",
    );
    expect(resolveLoginDestination("/admin", student)).toBe("/eleves/stu-1");
  });

  it("filtre la palette de commandes", () => {
    const trainerLinks = getPaletteRoutesForRole("FORMATEUR").map((l) => l.href);
    expect(trainerLinks).toContain("/planning");
    expect(trainerLinks).not.toContain("/admin");

    expect(getPaletteRoutesForRole("ELEVE")).toEqual([]);
  });
});
