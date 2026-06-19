import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function requestFor(path: string, cookie?: string) {
  const headers = cookie ? { cookie } : undefined;
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe("proxy auth", () => {
  it("redirige les pages privées vers la connexion sans cookie", async () => {
    for (const path of ["/", "/eleves", "/admin", "/planning", "/statistiques"]) {
      const res = await proxy(requestFor(path));
      expect(res.status).toBe(307);
      expect(res.headers.get("location")).toContain("/login");
    }
  });

  it("laisse la page de connexion accessible", async () => {
    const res = await proxy(requestFor("/login"));
    expect(res.status).toBe(200);
  });

  it("bloque l’API app-state sans authentification", async () => {
    const res = await proxy(requestFor("/api/app-state"));
    expect(res.status).toBe(401);
  });
});
