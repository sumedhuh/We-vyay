/* ============================================================
   Workout Builder — static data: exercise library, tags, presets
   ============================================================ */

import { GYM_EXERCISES, primaryEquipment } from "./gymExercises";

export const MUSCLES: string[] = ["chest", "back", "shoulders", "biceps", "triceps", "core", "quads", "hamstrings", "glutes", "calves", "full_body"];
export const EQUIPMENT: string[] = ["none", "dumbbells", "barbell", "pullup_bar", "bench", "cable", "kettlebell", "machine", "cardio", "band", "box", "plates"];
export const MOVEMENT_TYPES: string[] = ["Isolation", "Isometric", "Compound"];

export const EXERCISE_LIBRARY = GYM_EXERCISES.map((e) => ({
  id: e.id,
  name: e.displayName,
  emoji: e.emoji,
  muscles: e.targetMuscles,
  equipment: primaryEquipment(e),
  sequenceId: e.id,
  movement: e.movementClassification,
}));

export const exerciseById = (id: string) => EXERCISE_LIBRARY.find((e) => e.id === id);

/* ---------------- tempo & RPE ---------------- */
export const TEMPO_PRESETS = [
  { id: "controlled", label: "Controlled", value: "2-0-2-0", hint: "2s down · 0 · 2s up · 0" },
  { id: "explosive", label: "Explosive", value: "1-0-X-0", hint: "1s down · explode up" },
  { id: "eccentric", label: "Slow Eccentric", value: "4-0-1-0", hint: "4s down · 1s up" },
  { id: "pause", label: "Paused", value: "2-2-2-0", hint: "2s hold at the bottom" },
];

export const RPE_LABELS: Record<number, string> = {
  5: "Warm-up effort",
  6: "Could do 4+ more reps",
  7: "Could do 2-3 more reps",
  8: "Could do 1-2 more reps",
  9: "Could do 1 more rep",
  10: "Maximum effort",
};

export const REST_PRESETS = [15, 30, 45, 60, 90, 120];

/* ---------------- duration estimation ---------------- */
function parseRepsToSeconds(reps: string): number {
  const t = reps.trim().toLowerCase();
  if (t.endsWith("s")) {
    const n = parseFloat(t);
    return Number.isFinite(n) ? n : 30;
  }
  if (t.includes("-")) {
    const [a, b] = t.split("-").map((n) => parseFloat(n));
    const avg = ((a || 0) + (b || 0)) / 2 || 8;
    return avg * 3;
  }
  if (/amrap/i.test(t)) return 45;
  const n = parseFloat(t);
  return (Number.isFinite(n) ? n : 10) * 3;
}

export interface BuilderExercise {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  weight: number;
  weightUnit: "kg" | "lb";
  restSec: number;
  tempo: string;
  rpe: number;
  advancedOpen: boolean;
}

export type BlockType = "single" | "group";

export interface WorkoutBlock {
  id: string;
  type: BlockType;
  exercises: BuilderExercise[];
  rounds: number; // used when type === "group"
  restBetweenExercisesSec: number; // used when type === "group"
  restAfterBlockSec: number;
}

export function blockLabel(block: WorkoutBlock): string {
  if (block.type === "single") return "Exercise";
  return block.exercises.length >= 3 ? "Circuit" : "Superset";
}

export function estimateBlockSeconds(block: WorkoutBlock): number {
  if (block.exercises.length === 0) return 0;
  if (block.type === "single") {
    const ex = block.exercises[0];
    const setTime = parseRepsToSeconds(ex.reps);
    const total = ex.sets * setTime + Math.max(0, ex.sets - 1) * ex.restSec;
    return total + block.restAfterBlockSec;
  }
  const perRound =
    block.exercises.reduce((acc, ex) => acc + parseRepsToSeconds(ex.reps), 0) +
    Math.max(0, block.exercises.length - 1) * block.restBetweenExercisesSec;
  const total = block.rounds * perRound + Math.max(0, block.rounds - 1) * block.restBetweenExercisesSec;
  return total + block.restAfterBlockSec;
}

export function estimateWorkoutSeconds(blocks: WorkoutBlock[]): number {
  return blocks.reduce((acc, b) => acc + estimateBlockSeconds(b), 0);
}

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  if (m < 1) return `${s}s`;
  const h = Math.floor(m / 60);
  if (h >= 1) return `${h}h ${m % 60}m`;
  return `${m} min`;
}

export function totalSets(blocks: WorkoutBlock[]): number {
  return blocks.reduce((acc, b) => {
    if (b.type === "single") return acc + (b.exercises[0]?.sets ?? 0);
    return acc + b.rounds * b.exercises.length;
  }, 0);
}

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e5).toString(36)}`;

export function makeExerciseInstance(exerciseId: string): BuilderExercise {
  return {
    id: uid("ex"),
    exerciseId,
    sets: 3,
    reps: "10",
    weight: 0,
    weightUnit: "kg",
    restSec: 60,
    tempo: "2-0-2-0",
    rpe: 7,
    advancedOpen: false,
  };
}

export function makeBlock(exerciseId: string): WorkoutBlock {
  return {
    id: uid("blk"),
    type: "single",
    exercises: [makeExerciseInstance(exerciseId)],
    rounds: 3,
    restBetweenExercisesSec: 15,
    restAfterBlockSec: 60,
  };
}
