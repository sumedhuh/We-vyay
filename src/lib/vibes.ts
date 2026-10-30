import {
  VIBE_AXES,
  DEFAULT_VIBES,
  type Vibes,
  type ExerciseMode,
} from "@/db/schema";

export type VolumeSource = {
  vibes: Vibes;
  mode: ExerciseMode;
  sets: number;
  reps: number;
  seconds: number;
};

/** Seconds of actual work, used as the weight for a move's vibe influence. */
export function workSeconds(i: {
  mode: ExerciseMode;
  sets: number;
  reps: number;
  seconds: number;
}): number {
  const sets = Math.max(1, i.sets);
  // ~3.2s per controlled rep is the standard tempo estimate (1s up, 2s down + turnaround)
  return i.mode === "time"
    ? sets * Math.max(1, i.seconds)
    : sets * Math.max(1, i.reps) * 3.2;
}

/** Total session estimate including ~40s rest between sets. */
export function estimateSeconds(items: VolumeSource[]): number {
  return items.reduce(
    (acc, i) => acc + workSeconds(i) + Math.max(1, i.sets) * 40,
    0,
  );
}

/**
 * Derives a whole workout's vibe profile from its exercises.
 *
 * 1. Each move contributes its own vibe profile weighted by its work seconds,
 *    so a 5×20 kettlebell block outweighs a single 30s stretch.
 * 2. Endurance is then blended with a session-length factor: a long workout is
 *    inherently more of an endurance test than a short one built of the same
 *    moves. Cap at 75 min so marathons don't peg the axis at exactly 100.
 * 3. Intensity gets a mild density bonus — lots of work packed into few moves
 *    reads harder than the same work spread thin.
 */
export function computeWorkoutVibes(items: VolumeSource[]): Vibes {
  if (items.length === 0) return { ...DEFAULT_VIBES };

  const weights = items.map(workSeconds);
  const total = weights.reduce((a, b) => a + b, 0) || 1;

  const out = { ...DEFAULT_VIBES };
  for (const axis of VIBE_AXES) {
    const weighted = items.reduce(
      (acc, item, idx) => acc + (item.vibes?.[axis] ?? 50) * weights[idx],
      0,
    );
    out[axis] = weighted / total;
  }

  // (2) endurance ← 70% move-driven, 30% session-length driven
  const minutes = estimateSeconds(items) / 60;
  const lengthFactor = Math.min(100, (minutes / 75) * 100);
  out.endurance = out.endurance * 0.7 + lengthFactor * 0.3;

  // (3) intensity density bonus: work seconds per move, saturating at 240s
  const density = Math.min(1, total / items.length / 240);
  out.intensity = Math.min(100, out.intensity * (0.88 + density * 0.24));

  for (const axis of VIBE_AXES) {
    out[axis] = Math.max(0, Math.min(100, Math.round(out[axis])));
  }
  return out;
}

/** Human-readable volume label for a configured move. */
export function volumeLabel(i: {
  mode: ExerciseMode;
  sets: number;
  reps: number;
  seconds: number;
}): string {
  if (i.mode === "time") {
    const s = Math.max(1, i.seconds);
    const label = s >= 60 ? `${Math.round((s / 60) * 10) / 10} min` : `${s}s`;
    return `${i.sets} × ${label}`;
  }
  return `${i.sets} × ${i.reps}`;
}

/** The `reps` string persisted on published workouts. */
export function repsString(i: {
  mode: ExerciseMode;
  reps: number;
  seconds: number;
}): string {
  if (i.mode === "time") {
    const s = Math.max(1, i.seconds);
    return s >= 60 ? `${Math.round((s / 60) * 10) / 10} min` : `${s}s`;
  }
  return String(Math.max(1, i.reps));
}
