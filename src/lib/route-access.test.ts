import { describe, expect, it } from "vitest";
import {
  canRoleAccessPath,
  getDefaultHomeForRole,
  getNavRoutesForRole,
  getPaletteRoutesForRole,
  getRequiredRolesForPath,
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
    expect(getDefaultHomeForRole("FORMATEUR")).toBe("/");
    expect(getDefaultHomeForRole("SUPER_ADMIN")).toBe("/");
  });

  it("protège les chemins sensibles", () => {
    expect(getRequiredRolesForPath("/admin")).toEqual(["SUPER_ADMIN"]);
    expect(getRequiredRolesForPath("/api/admin/trainers")).toEqual([
      "SUPER_ADMIN",
    ]);
    expect(getRequiredRolesForPath("/planning")).toEqual(["FORMATEUR"]);
    expect(getRequiredRolesForPath("/")).toEqual(["SUPER_ADMIN", "FORMATEUR"]);
    expect(getRequiredRolesForPath("/eleves/stu-1")).toBeNull();
  });

  it("valide l’accès par rôle", () => {
    expect(canRoleAccessPath("FORMATEUR", "/planning")).toBe(true);
    expect(canRoleAccessPath("SUPER_ADMIN", "/planning")).toBe(false);
    expect(canRoleAccessPath("ELEVE", "/")).toBe(false);
    expect(canRoleAccessPath("ELEVE", "/eleves/stu-1")).toBe(true);
  });

  it("filtre la palette de commandes", () => {
    const trainerLinks = getPaletteRoutesForRole("FORMATEUR").map((l) => l.href);
    expect(trainerLinks).toContain("/planning");
    expect(trainerLinks).not.toContain("/admin");

    expect(getPaletteRoutesForRole("ELEVE")).toEqual([]);
  });
});
