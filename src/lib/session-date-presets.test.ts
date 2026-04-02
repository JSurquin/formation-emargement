import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { applySessionDatePreset, toIsoDateLocal } from "./session-date-presets";

describe("session-date-presets", () => {
  const ref = new Date(2026, 2, 30, 12, 0, 0, 0);

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(ref);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("toIsoDateLocal", () => {
    expect(toIsoDateLocal(new Date(2026, 2, 5))).toBe("2026-03-05");
  });

  it("clear vide les bornes", () => {
    expect(applySessionDatePreset("clear")).toEqual({
      dateFrom: "",
      dateTo: "",
    });
  });

  it("week : lundi–dimanche de la semaine courante", () => {
    expect(applySessionDatePreset("week")).toEqual({
      dateFrom: "2026-03-30",
      dateTo: "2026-04-05",
    });
  });

  it("month : premier et dernier jour du mois courant", () => {
    expect(applySessionDatePreset("month")).toEqual({
      dateFrom: "2026-03-01",
      dateTo: "2026-03-31",
    });
  });

  it("next30 : aujourd’hui + 29 jours", () => {
    expect(applySessionDatePreset("next30")).toEqual({
      dateFrom: "2026-03-30",
      dateTo: "2026-04-28",
    });
  });
});
