import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatSessionRelativeDay,
  getSessionDateProximity,
} from "./session-relative-day";

describe("session-relative-day", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 30));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("formatSessionRelativeDay: aujourd’hui / demain / hier", () => {
    expect(formatSessionRelativeDay("2026-03-30")).toBe("Aujourd\u2019hui");
    expect(formatSessionRelativeDay("2026-03-31")).toBe("Demain");
    expect(formatSessionRelativeDay("2026-03-29")).toBe("Hier");
  });

  it("getSessionDateProximity", () => {
    expect(getSessionDateProximity("2026-03-29")).toBe("past");
    expect(getSessionDateProximity("2026-03-30")).toBe("today");
    expect(getSessionDateProximity("2026-04-01")).toBe("future");
  });
});
