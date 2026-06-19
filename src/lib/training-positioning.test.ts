import { describe, expect, it } from "vitest";
import {
  formatTrainingPositioning,
  getTrainingLevelLabel,
  isTrainingLevel,
} from "./training-positioning";

describe("training-positioning", () => {
  it("labels known levels", () => {
    expect(getTrainingLevelLabel("no_basics")).toBe("Débutant — pas de bases");
    expect(getTrainingLevelLabel("comfortable")).toBe(
      "À l'aise — bonnes facilités",
    );
  });

  it("validates training levels", () => {
    expect(isTrainingLevel("intermediate")).toBe(true);
    expect(isTrainingLevel("expert")).toBe(false);
  });

  it("formats level and notes together", () => {
    expect(
      formatTrainingPositioning({
        trainingLevel: "some_basics",
        trainingPositioningNotes: "A déjà suivi une initiation",
      }),
    ).toBe(
      "Débutant — quelques notions — A déjà suivi une initiation",
    );
  });
});
