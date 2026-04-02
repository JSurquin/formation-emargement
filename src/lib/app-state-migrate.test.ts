import { describe, expect, it } from "vitest";
import { APP_STATE_SCHEMA_VERSION, migrateAppState } from "./app-state-migrate";
import type { AppState } from "./types";

describe("migrateAppState", () => {
  it("pose schemaVersion courant", () => {
    const raw: AppState = {
      students: [],
      sessions: [],
      organizationName: "",
    };
    const m = migrateAppState(raw);
    expect(m.schemaVersion).toBe(APP_STATE_SCHEMA_VERSION);
  });
});
