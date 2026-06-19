export type TrainingLevel =
  | "no_basics"
  | "some_basics"
  | "intermediate"
  | "comfortable";

export const TRAINING_LEVEL_OPTIONS: ReadonlyArray<{
  value: TrainingLevel;
  label: string;
}> = [
  { value: "no_basics", label: "Débutant — pas de bases" },
  { value: "some_basics", label: "Débutant — quelques notions" },
  { value: "intermediate", label: "Intermédiaire — bases acquises" },
  { value: "comfortable", label: "À l'aise — bonnes facilités" },
];

export function getTrainingLevelLabel(
  value: TrainingLevel | string | undefined,
): string | undefined {
  if (!value) return undefined;
  return TRAINING_LEVEL_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function isTrainingLevel(value: string): value is TrainingLevel {
  return TRAINING_LEVEL_OPTIONS.some((o) => o.value === value);
}

export function formatTrainingPositioning(student: {
  trainingLevel?: TrainingLevel;
  trainingPositioningNotes?: string;
}): string | undefined {
  const parts: string[] = [];
  const level = getTrainingLevelLabel(student.trainingLevel);
  if (level) parts.push(level);
  const notes = student.trainingPositioningNotes?.trim();
  if (notes) parts.push(notes);
  return parts.length ? parts.join(" — ") : undefined;
}
