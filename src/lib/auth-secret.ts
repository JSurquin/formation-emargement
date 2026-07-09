const DEV_FALLBACK_SECRET = "dev-insecure-auth-secret-change-me";

export function getAuthSecretBytes(): Uint8Array {
  const secret = process.env.AUTH_SECRET?.trim();

  if (process.env.NODE_ENV === "production") {
    if (!secret || secret === DEV_FALLBACK_SECRET || secret.length < 32) {
      throw new Error(
        "AUTH_SECRET must be set to a strong value (32+ characters) in production.",
      );
    }
  }

  return new TextEncoder().encode(secret || DEV_FALLBACK_SECRET);
}
