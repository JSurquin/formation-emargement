import { afterEach, describe, expect, it } from "vitest";
import { getAuthSecretBytes } from "./auth-secret";

describe("getAuthSecretBytes", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepte le secret de développement hors production", () => {
    delete process.env.AUTH_SECRET;
    process.env.NODE_ENV = "development";
    expect(getAuthSecretBytes()).toBeInstanceOf(Uint8Array);
  });

  it("refuse un secret manquant ou faible en production", () => {
    process.env.NODE_ENV = "production";
    delete process.env.AUTH_SECRET;
    expect(() => getAuthSecretBytes()).toThrow(/AUTH_SECRET/);

    process.env.AUTH_SECRET = "dev-insecure-auth-secret-change-me";
    expect(() => getAuthSecretBytes()).toThrow(/AUTH_SECRET/);

    process.env.AUTH_SECRET = "short-secret";
    expect(() => getAuthSecretBytes()).toThrow(/AUTH_SECRET/);
  });

  it("accepte un secret fort en production", () => {
    process.env.NODE_ENV = "production";
    process.env.AUTH_SECRET = "a".repeat(32);
    expect(getAuthSecretBytes()).toBeInstanceOf(Uint8Array);
  });
});
