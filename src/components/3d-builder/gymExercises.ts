import { P, clonePose, kf, posePreset, type Pose, type Keyframe } from "./pose";
import type { EasingCurve } from "./poseChannels";

/* ================================================================== */
/*  Equipment types & constraint specs                                 */
/* ================================================================== */

export type MovementClassification = "isolation" | "isometric" | "compound";
export type EquipmentType = "none" | "dumbbells" | "barbell" | "pullup_bar" | "bench" | "cable" | "kettlebell" | "machine" | "cardio" | "band" | "box" | "plates";

export type ConstraintId =
  | "handToBar"         // both hands locked to barbell grip points
  | "handToDumbbell"    // each hand carries its own dumbbell
  | "handToPullupBar"   // hands locked to the overhead bar
  | "feetToFloor"       // feet stay planted (squat, deadlift, OHP)
  | "backToBench"       // upper back stays on bench pad
  | "hipsToBench";      // hips rest on bench (hip thrust, etc.)

export interface EquipmentSpec {
  type: EquipmentType;
  /** grip point offsets in equipment-local space (L/R) */
  gripL?: [number, number, number];
  gripR?: [number, number, number];
}

/* ================================================================== */
/*  Phase-based timeline (replaces simple top/bottom keyframes)        */
/* ================================================================== */

export interface Phase {
  /** display label for this micro-phase */
  name: string;
  /** the target pose */
  pose: Pose;
  /** time (seconds) to ease INTO this pose */
  durationSec: number;
  /** how long to hold at this pose (seconds) */
  holdSec: number;
  /** easing curve for the transition into this phase */
  easing: EasingCurve;
}

/* ================================================================== */
/*  Exercise Definition — the single source of truth per exercise      */
/* ================================================================== */

export interface ExerciseDefinition {
  id: string;
  displayName: string;
  emoji: string;
  movementClassification: MovementClassification;
  targetMuscles?: string[];
  /** which equipment to render */
  equipment: EquipmentSpec[];
  /** how the athlete + equipment are bound */
  constraints: ConstraintId[];
  /** multi-phase timeline for one rep */
  phases: Phase[];
  /** optional camera angle hint */
  cameraPreset?: "hero" | "side" | "front" | "low" | "3quarter";
}

/* ================================================================== */
/*  Gym Pose Library (key poses for strength movements)                */
/* ================================================================== */

// ---- Bicep Curl ----
const bicepCurlDown: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 0, armFlexR: 0, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2,
});
const bicepCurlUp: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 10, armFlexR: 10, armAbdL: 5, armAbdR: 5,
  elbowL: 135, elbowR: 135, kneeL: 2, kneeR: 2,
});

// ---- Barbell Squat ----
const squatTop: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 120, armFlexR: 120, armAbdL: 60, armAbdR: 60,
  elbowL: 90, elbowR: 90, kneeL: 2, kneeR: 2, legAbdL: 20, legAbdR: 20,
});
const squatBrace: Pose = P({
  rootY: 0.92, rootZ: -0.3, rootPitch: 8,
  armFlexL: 120, armFlexR: 120, armAbdL: 60, armAbdR: 60,
  elbowL: 90, elbowR: 90, kneeL: 10, kneeR: 10, legAbdL: 20, legAbdR: 20,
  spineCurl: 5,
});
const squatBottom: Pose = P({
  rootY: 0.55, rootZ: -0.3, rootPitch: 35,
  legFlexL: 105, legFlexR: 105, kneeL: 120, kneeR: 120,
  footL: -15, footR: -15, armFlexL: 120, armFlexR: 120,
  armAbdL: 60, armAbdR: 60, elbowL: 90, elbowR: 90, legAbdL: 20, legAbdR: 20,
});

// ---- Bench Press ----
const benchPressTop: Pose = P({
  rootY: 0.45, rootZ: -0.2, rootPitch: 90, rootSpin: 180,
  armFlexL: 90, armFlexR: 90, armAbdL: 10, armAbdR: 10,
  elbowL: 5, elbowR: 5, legFlexL: 60, legFlexR: 60, kneeL: 90, kneeR: 90,
});
const benchPressBottom: Pose = P({
  rootY: 0.45, rootZ: -0.2, rootPitch: 90, rootSpin: 180,
  armFlexL: 90, armFlexR: 90, armAbdL: 75, armAbdR: 75,
  elbowL: 90, elbowR: 90, legFlexL: 60, legFlexR: 60, kneeL: 90, kneeR: 90,
});

// ---- Deadlift ----
const deadliftSetup: Pose = P({
  rootY: 0.6, rootZ: -0.3, rootPitch: 65,
  legFlexL: 65, legFlexR: 65, kneeL: 75, kneeR: 75,
  footL: -10, footR: -10, armFlexL: 65, armFlexR: 65,
  elbowL: 5, elbowR: 5, legAbdL: 10, legAbdR: 10, spineCurl: 10,
});
const deadliftBreakFloor: Pose = P({
  rootY: 0.7, rootZ: -0.3, rootPitch: 50,
  legFlexL: 50, legFlexR: 50, kneeL: 55, kneeR: 55,
  footL: -10, footR: -10, armFlexL: 50, armFlexR: 50,
  elbowL: 5, elbowR: 5, legAbdL: 10, legAbdR: 10, spineCurl: 5,
});
const deadliftLockout: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 5, armFlexR: 5, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2, legAbdL: 10, legAbdR: 10,
});

// ---- Pull-Up ----
const pullupHang: Pose = P({
  rootY: 1.1, rootZ: -0.3,
  armFlexL: 175, armFlexR: 175, armAbdL: 45, armAbdR: 45,
  elbowL: 5, elbowR: 5, kneeL: 10, kneeR: 10,
});
const pullupMid: Pose = P({
  rootY: 1.3, rootZ: -0.3,
  armFlexL: 155, armFlexR: 155, armAbdL: 52, armAbdR: 52,
  elbowL: 70, elbowR: 70, kneeL: 10, kneeR: 10,
});
const pullupTop: Pose = P({
  rootY: 1.5, rootZ: -0.3,
  armFlexL: 135, armFlexR: 135, armAbdL: 60, armAbdR: 60,
  elbowL: 120, elbowR: 120, kneeL: 10, kneeR: 10,
});

// ---- Overhead Press ----
const ohpBottom: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 90, armFlexR: 90, armAbdL: 80, armAbdR: 80,
  elbowL: 100, elbowR: 100, kneeL: 2, kneeR: 2,
});
const ohpTop: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 170, armFlexR: 170, armAbdL: 20, armAbdR: 20,
  elbowL: 10, elbowR: 10, kneeL: 2, kneeR: 2,
});

// ---- Bent-Over Row ----
const rowBottom: Pose = P({
  rootY: 0.8, rootZ: -0.3, rootPitch: 50, spineCurl: 10,
  armFlexL: 50, armFlexR: 50, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5, kneeL: 15, kneeR: 15,
  legFlexL: 20, legFlexR: 20,
});
const rowTop: Pose = P({
  rootY: 0.8, rootZ: -0.3, rootPitch: 50, spineCurl: 10,
  armFlexL: 50, armFlexR: 50, armAbdL: 15, armAbdR: 15,
  elbowL: 110, elbowR: 110, kneeL: 15, kneeR: 15,
  legFlexL: 20, legFlexR: 20,
});

// ---- Dumbbell Shoulder Press ----
const dbShoulderBottom: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 90, armFlexR: 90, armAbdL: 75, armAbdR: 75,
  elbowL: 95, elbowR: 95, kneeL: 2, kneeR: 2,
});
const dbShoulderTop: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 170, armFlexR: 170, armAbdL: 15, armAbdR: 15,
  elbowL: 8, elbowR: 8, kneeL: 2, kneeR: 2,
});

// ---- Lunges (Dumbbell) ----
const lungeStand: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 0, armFlexR: 0, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2,
});
const lungeBottom: Pose = P({
  rootY: 0.62, rootZ: -0.32, rootPitch: 5,
  legFlexR: 62, kneeR: 96, legFlexL: -34, kneeL: 8, footL: 40,
  armFlexL: 0, armFlexR: 0, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5,
});

// ---- Lat Pulldown ----
const latPulldownUp: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 175, armFlexR: 175, armAbdL: 50, armAbdR: 50,
  elbowL: 5, elbowR: 5, kneeL: 90, kneeR: 90,
  legFlexL: 60, legFlexR: 60,
});
const latPulldownDown: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 100, armFlexR: 100, armAbdL: 55, armAbdR: 55,
  elbowL: 100, elbowR: 100, kneeL: 90, kneeR: 90,
  legFlexL: 60, legFlexR: 60,
});

// ---- Goblet Squat ----
const gobletSquatTop: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 60, armFlexR: 60, armAbdL: 20, armAbdR: 20,
  elbowL: 130, elbowR: 130, kneeL: 2, kneeR: 2,
});
const gobletSquatBottom: Pose = P({
  rootY: 0.5, rootZ: -0.35, rootPitch: 30, spineCurl: -10,
  legFlexL: 110, legFlexR: 110, kneeL: 120, kneeR: 120, footL: 20, footR: 20,
  armFlexL: 60, armFlexR: 60, armAbdL: 20, armAbdR: 20,
  elbowL: 130, elbowR: 130,
});

// ---- Kettlebell Swing ----
const kbSwingBottom: Pose = P({
  rootY: 0.7, rootZ: -0.3, rootPitch: 45, spineCurl: 0,
  legFlexL: 45, legFlexR: 45, kneeL: 45, kneeR: 45,
  armFlexL: -20, armFlexR: -20, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5,
});
const kbSwingTop: Pose = P({
  rootY: 0.95, rootZ: -0.3, rootPitch: 0,
  armFlexL: 90, armFlexR: 90, armAbdL: 5, armAbdR: 5,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2,
});

// ---- Tricep Dip ----
const dipTop: Pose = P({
  rootY: 0.8, rootZ: 0.1, rootPitch: 10,
  armFlexL: -45, armFlexR: -45, armAbdL: 10, armAbdR: 10,
  elbowL: 5, elbowR: 5,
  legFlexL: 70, legFlexR: 70, kneeL: 90, kneeR: 90,
});
const dipBottom: Pose = P({
  rootY: 0.5, rootZ: 0.1, rootPitch: 10,
  armFlexL: -70, armFlexR: -70, armAbdL: 10, armAbdR: 10,
  elbowL: 90, elbowR: 90,
  legFlexL: 70, legFlexR: 70, kneeL: 90, kneeR: 90,
});

// ---- Band Pull Apart ----
const bandPullStart: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 90, armFlexR: 90, armAbdL: 20, armAbdR: 20,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2,
});
const bandPullEnd: Pose = P({
  rootY: 0.95, rootZ: -0.3,
  armFlexL: 90, armFlexR: 90, armAbdL: 90, armAbdR: 90,
  elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2,
});

// ---- Box Jump ----
const boxJumpPrep: Pose = P({
  rootY: 0.6, rootZ: -0.2, rootPitch: 30,
  armFlexL: -45, armFlexR: -45, elbowL: 10, elbowR: 10,
  legFlexL: 110, legFlexR: 110, kneeL: 120, kneeR: 120, footL: 20, footR: 20
});
const boxJumpFlight: Pose = P({
  rootY: 1.5, rootZ: 0.1, rootPitch: 0,
  armFlexL: 130, armFlexR: 130, elbowL: 10, elbowR: 10,
  legFlexL: 30, legFlexR: 30, kneeL: 60, kneeR: 60
});
const boxJumpLand: Pose = P({
  rootY: 1.2, rootZ: 0.4, rootPitch: 30,
  armFlexL: 0, armFlexR: 0, elbowL: 30, elbowR: 30,
  legFlexL: 90, legFlexR: 90, kneeL: 100, kneeR: 100
});
const boxJumpStand: Pose = P({
  rootY: 1.55, rootZ: 0.4, rootPitch: 0,
  armFlexL: 0, armFlexR: 0, elbowL: 5, elbowR: 5,
  legFlexL: 0, legFlexR: 0, kneeL: 2, kneeR: 2
});

// ==================================================================
//  7 Biomechanical Core Exercises (Reverse Crunch, Crunch, Leg Raises,
//  Plank, Bicycle Crunches, Dead Bug, Hollow Body Hold)
// ==================================================================

// ---- 1. Reverse Crunch ----
const reverseCrunchSetup: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 4, headNod: 8,
  armFlexL: -10, armFlexR: -10, armAbdL: 18, armAbdR: 18, elbowL: 5, elbowR: 5,
  legFlexL: 90, legFlexR: 90, kneeL: 90, kneeR: 90, footL: 5, footR: 5,
});
const reverseCrunchTop: Pose = P({
  rootY: 0.22, rootZ: -0.28, rootPitch: 75, rootSpin: 180,
  spineCurl: 28, headNod: 16,
  armFlexL: -12, armFlexR: -12, armAbdL: 20, armAbdR: 20, elbowL: 8, elbowR: 8,
  legFlexL: 114, legFlexR: 114, kneeL: 108, kneeR: 108, footL: 10, footR: 10,
});

// ---- 2. Crunches ----
const crunchDown: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 4, headNod: 4,
  armFlexL: 35, armFlexR: 35, armAbdL: 45, armAbdR: 45, elbowL: 130, elbowR: 130,
  legFlexL: 62, legFlexR: 62, kneeL: 85, kneeR: 85, footL: -12, footR: -12,
});
const crunchUp: Pose = P({
  rootY: 0.17, rootZ: -0.28, rootPitch: 84, rootSpin: 180,
  spineCurl: 36, headNod: 20,
  armFlexL: 35, armFlexR: 35, armAbdL: 42, armAbdR: 42, elbowL: 130, elbowR: 130,
  legFlexL: 62, legFlexR: 62, kneeL: 85, kneeR: 85, footL: -12, footR: -12,
});

// ---- 3. Lying Leg Raises ----
const legRaiseHover: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 8, headNod: 8,
  armFlexL: -10, armFlexR: -10, armAbdL: 15, armAbdR: 15, elbowL: 4, elbowR: 4,
  legFlexL: 12, legFlexR: 12, kneeL: 4, kneeR: 4, footL: 25, footR: 25,
});
const legRaiseVertical: Pose = P({
  rootY: 0.16, rootZ: -0.28, rootPitch: 86, rootSpin: 180,
  spineCurl: 14, headNod: 10,
  armFlexL: -10, armFlexR: -10, armAbdL: 15, armAbdR: 15, elbowL: 4, elbowR: 4,
  legFlexL: 88, legFlexR: 88, kneeL: 4, kneeR: 4, footL: 30, footR: 30,
});

// ---- 4. Plank ----
const plankHold1: Pose = P({
  rootY: 0.32, rootZ: -0.24, rootPitch: 90, rootSpin: 0,
  spineCurl: 2, headNod: -4,
  armFlexL: 88, armFlexR: 88, armAbdL: 10, armAbdR: 10, elbowL: 92, elbowR: 92,
  legFlexL: 0, legFlexR: 0, kneeL: 2, kneeR: 2, footL: 55, footR: 55,
});
const plankHold2: Pose = P({
  rootY: 0.325, rootZ: -0.24, rootPitch: 90, rootSpin: 0,
  spineCurl: 4, headNod: -4,
  armFlexL: 88, armFlexR: 88, armAbdL: 10, armAbdR: 10, elbowL: 92, elbowR: 92,
  legFlexL: 0, legFlexR: 0, kneeL: 2, kneeR: 2, footL: 55, footR: 55,
});

// ---- 5. Bicycle Crunches ----
const bicycleA: Pose = P({
  rootY: 0.16, rootZ: -0.28, rootPitch: 84, rootSpin: 180,
  spineCurl: 26, spineSide: -14, rootTurn: 18, headTurn: 16, headNod: 18,
  armFlexL: 25, armAbdL: 65, elbowL: 130,
  armFlexR: 50, armAbdR: 20, elbowR: 135,
  legFlexL: 105, kneeL: 110, footL: 15,
  legFlexR: 18, kneeR: 8, footR: 25,
});
const bicycleMid: Pose = P({
  rootY: 0.15, rootZ: -0.28, rootPitch: 86, rootSpin: 180,
  spineCurl: 18, spineSide: 0, rootTurn: 0, headTurn: 0, headNod: 14,
  armFlexL: 35, armAbdL: 45, elbowL: 130,
  armFlexR: 35, armAbdR: 45, elbowR: 130,
  legFlexL: 65, kneeL: 80, footL: 10,
  legFlexR: 65, kneeR: 80, footR: 10,
});
const bicycleB: Pose = P({
  rootY: 0.16, rootZ: -0.28, rootPitch: 84, rootSpin: 180,
  spineCurl: 26, spineSide: 14, rootTurn: -18, headTurn: -16, headNod: 18,
  armFlexL: 50, armAbdL: 20, elbowL: 135,
  armFlexR: 25, armAbdR: 65, elbowR: 130,
  legFlexL: 18, kneeL: 8, footL: 25,
  legFlexR: 105, kneeR: 110, footR: 15,
});

// ---- 6. Dead Bug ----
const deadBugHome: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 4, headNod: 6,
  armFlexL: 90, armFlexR: 90, armAbdL: 8, armAbdR: 8, elbowL: 4, elbowR: 4,
  legFlexL: 90, legFlexR: 90, kneeL: 90, kneeR: 90, footL: -5, footR: -5,
});
const deadBugReachA: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 4, headNod: 6,
  armFlexL: 90, armAbdL: 8, elbowL: 4,
  armFlexR: 172, armAbdR: 8, elbowR: 4,
  legFlexL: 16, kneeL: 6, footL: 15,
  legFlexR: 90, kneeR: 90, footR: -5,
});
const deadBugReachB: Pose = P({
  rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180,
  spineCurl: 4, headNod: 6,
  armFlexL: 172, armAbdL: 8, elbowL: 4,
  armFlexR: 90, armAbdR: 8, elbowR: 4,
  legFlexL: 90, kneeL: 90, footL: -5,
  legFlexR: 16, kneeR: 6, footR: 15,
});

// ---- 7. Hollow Body Hold ----
const hollowHold1: Pose = P({
  rootY: 0.15, rootZ: -0.28, rootPitch: 86, rootSpin: 180,
  spineCurl: 26, headNod: 20,
  armFlexL: 175, armFlexR: 175, armAbdL: 8, armAbdR: 8, elbowL: 2, elbowR: 2,
  legFlexL: 22, legFlexR: 22, legAbdL: 4, legAbdR: 4, kneeL: 2, kneeR: 2, footL: 35, footR: 35,
});
const hollowHold2: Pose = P({
  rootY: 0.152, rootZ: -0.28, rootPitch: 85, rootSpin: 180,
  spineCurl: 28, headNod: 22,
  armFlexL: 176, armFlexR: 176, armAbdL: 8, armAbdR: 8, elbowL: 2, elbowR: 2,
  legFlexL: 24, legFlexR: 24, legAbdL: 4, legAbdR: 4, kneeL: 2, kneeR: 2, footL: 35, footR: 35,
});

/* ================================================================== */
/*  Exercise Definitions (phase-based with explicit equipment)         */
/* ================================================================== */

export const GYM_EXERCISES: ExerciseDefinition[] = [
  {
    id: "reverse_crunch",
    displayName: "Reverse Crunch",
    emoji: "🔄",
    movementClassification: "isolation",
    targetMuscles: ["Lower Abs", "Hip Flexors", "Core"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "side",
    phases: [
      { name: "Tabletop hold",   pose: reverseCrunchSetup, durationSec: 0.25, holdSec: 0.2, easing: "smooth" },
      { name: "Curl & peel",     pose: reverseCrunchTop,   durationSec: 0.95, holdSec: 0.45, easing: "outCubic" },
      { name: "Controlled lower",pose: reverseCrunchSetup, durationSec: 1.45, holdSec: 0.2, easing: "inOutSine" },
    ],
  },
  {
    id: "crunch",
    displayName: "Crunches",
    emoji: "🔥",
    movementClassification: "isolation",
    targetMuscles: ["Rectus Abdominis", "Core"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "side",
    phases: [
      { name: "Down (inhale)",   pose: crunchDown, durationSec: 0.2,  holdSec: 0.15, easing: "smooth" },
      { name: "Curl (exhale)",   pose: crunchUp,   durationSec: 0.85, holdSec: 0.4,  easing: "outCubic" },
      { name: "Lower (ecc.)",    pose: crunchDown, durationSec: 1.25, holdSec: 0.15, easing: "inOutSine" },
    ],
  },
  {
    id: "lying_leg_raise",
    displayName: "Lying Leg Raises",
    emoji: "🦵",
    movementClassification: "isolation",
    targetMuscles: ["Lower Abs", "Hip Flexors", "Core"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "side",
    phases: [
      { name: "Floor hover",     pose: legRaiseHover,    durationSec: 0.25, holdSec: 0.2,  easing: "smooth" },
      { name: "Raise vertical",  pose: legRaiseVertical, durationSec: 0.95, holdSec: 0.35, easing: "outCubic" },
      { name: "Lower (ecc.)",    pose: legRaiseHover,    durationSec: 1.5,  holdSec: 0.2,  easing: "inOutSine" },
    ],
  },
  {
    id: "plank",
    displayName: "Plank",
    emoji: "🧘",
    movementClassification: "isometric",
    targetMuscles: ["Transverse Abdominis", "Core", "Shoulders", "Glutes"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "side",
    phases: [
      { name: "Rigid hold",      pose: plankHold1, durationSec: 2.2, holdSec: 2.0, easing: "inOutSine" },
      { name: "Exhale & brace",  pose: plankHold2, durationSec: 2.2, holdSec: 2.0, easing: "inOutSine" },
    ],
  },
  {
    id: "bicycle_crunch",
    displayName: "Bicycle Crunches",
    emoji: "🚴",
    movementClassification: "isolation",
    targetMuscles: ["Obliques", "Rectus Abdominis", "Hip Flexors"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "3quarter",
    phases: [
      { name: "Twist left",  pose: bicycleA,   durationSec: 0.75, holdSec: 0.35, easing: "inOutCubic" },
      { name: "Center",      pose: bicycleMid, durationSec: 0.4,  holdSec: 0.05, easing: "smooth" },
      { name: "Twist right", pose: bicycleB,   durationSec: 0.75, holdSec: 0.35, easing: "inOutCubic" },
      { name: "Center",      pose: bicycleMid, durationSec: 0.4,  holdSec: 0.05, easing: "smooth" },
    ],
  },
  {
    id: "dead_bug",
    displayName: "Dead Bug",
    emoji: "🪲",
    movementClassification: "isolation",
    targetMuscles: ["Transverse Abdominis", "Core Stabilizers"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "3quarter",
    phases: [
      { name: "Tabletop brace",      pose: deadBugHome,   durationSec: 0.25, holdSec: 0.2,  easing: "smooth" },
      { name: "Reach (R arm/L leg)", pose: deadBugReachA, durationSec: 0.95, holdSec: 0.35, easing: "inOutCubic" },
      { name: "Return home",         pose: deadBugHome,   durationSec: 0.85, holdSec: 0.15, easing: "inOutSine" },
      { name: "Reach (L arm/R leg)", pose: deadBugReachB, durationSec: 0.95, holdSec: 0.35, easing: "inOutCubic" },
      { name: "Return home",         pose: deadBugHome,   durationSec: 0.85, holdSec: 0.15, easing: "inOutSine" },
    ],
  },
  {
    id: "hollow_body_hold",
    displayName: "Hollow Body Hold",
    emoji: "🛶",
    movementClassification: "isometric",
    targetMuscles: ["Rectus Abdominis", "Transverse Abdominis", "Hip Flexors"],
    equipment: [{ type: "none" }],
    constraints: [],
    cameraPreset: "side",
    phases: [
      { name: "Hollow lock",         pose: hollowHold1, durationSec: 2.2, holdSec: 2.0, easing: "inOutSine" },
      { name: "Braced respiration",  pose: hollowHold2, durationSec: 2.2, holdSec: 2.0, easing: "inOutSine" },
    ],
  },
  {
    id: "box_jump",
    displayName: "Box Jump",
    emoji: "📦",
    movementClassification: "compound",
    targetMuscles: ["Quadriceps", "Glutes", "Calves", "Core"],
    equipment: [{ type: "box" }],
    constraints: ["feetToFloor"],
    cameraPreset: "side",
    phases: [
      { name: "Prep", pose: boxJumpPrep, durationSec: 0.4, holdSec: 0.1, easing: "inOutCubic" },
      { name: "Jump", pose: boxJumpFlight, durationSec: 0.3, holdSec: 0.05, easing: "smooth" },
      { name: "Land", pose: boxJumpLand, durationSec: 0.2, holdSec: 0.2, easing: "smooth" },
      { name: "Stand", pose: boxJumpStand, durationSec: 0.4, holdSec: 0.5, easing: "smooth" },
      { name: "Step down", pose: boxJumpPrep, durationSec: 0.5, holdSec: 0.1, easing: "inOutCubic" },
    ],
  },
  {
    id: "goblet_squat",
    displayName: "Goblet Squat",
    emoji: "🏺",
    movementClassification: "compound",
    targetMuscles: ["Quadriceps", "Glutes"],
    equipment: [{ type: "kettlebell" }],
    constraints: ["feetToFloor"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Stand", pose: gobletSquatTop, durationSec: 0.3, holdSec: 0.2, easing: "smooth" },
      { name: "Squat", pose: gobletSquatBottom, durationSec: 0.9, holdSec: 0.2, easing: "inOutCubic" },
      { name: "Ascent", pose: gobletSquatTop, durationSec: 0.7, holdSec: 0.2, easing: "inOutCubic" },
    ],
  },
  {
    id: "kb_swing",
    displayName: "Kettlebell Swing",
    emoji: "🔔",
    movementClassification: "compound",
    targetMuscles: ["Glutes", "Hamstrings", "Core"],
    equipment: [{ type: "kettlebell" }],
    constraints: ["feetToFloor"],
    cameraPreset: "side",
    phases: [
      { name: "Hinge", pose: kbSwingBottom, durationSec: 0.4, holdSec: 0.05, easing: "smooth" },
      { name: "Swing up", pose: kbSwingTop, durationSec: 0.3, holdSec: 0.1, easing: "inOutCubic" },
      { name: "Drop", pose: kbSwingBottom, durationSec: 0.4, holdSec: 0.05, easing: "smooth" },
    ],
  },
  {
    id: "tricep_dip",
    displayName: "Tricep Dip",
    emoji: "🔻",
    movementClassification: "compound",
    targetMuscles: ["Triceps", "Chest"],
    equipment: [{ type: "bench" }],
    constraints: ["feetToFloor"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Top", pose: dipTop, durationSec: 0.2, holdSec: 0.2, easing: "smooth" },
      { name: "Dip down", pose: dipBottom, durationSec: 0.8, holdSec: 0.2, easing: "inOutSine" },
      { name: "Press up", pose: dipTop, durationSec: 0.6, holdSec: 0.2, easing: "inOutCubic" },
    ],
  },
  {
    id: "band_pull_apart",
    displayName: "Band Pull-Apart",
    emoji: "🎗️",
    movementClassification: "isolation",
    targetMuscles: ["Shoulders", "Upper Back"],
    equipment: [{ type: "band" }],
    constraints: ["feetToFloor"],
    cameraPreset: "front",
    phases: [
      { name: "Start", pose: bandPullStart, durationSec: 0.2, holdSec: 0.1, easing: "smooth" },
      { name: "Pull", pose: bandPullEnd, durationSec: 0.5, holdSec: 0.3, easing: "inOutCubic" },
      { name: "Return", pose: bandPullStart, durationSec: 0.6, holdSec: 0.1, easing: "smooth" },
    ],
  },
  {
    id: "bicep_curl",
    displayName: "Bicep Curls",
    emoji: "💪",
    movementClassification: "isolation",
    targetMuscles: ["Biceps"],
    equipment: [{ type: "dumbbells" }],
    constraints: ["handToDumbbell"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Arms down",     pose: bicepCurlDown, durationSec: 0.15, holdSec: 0.1,  easing: "smooth" },
      { name: "Curl up",       pose: bicepCurlUp,   durationSec: 0.65, holdSec: 0.25, easing: "inOutCubic" },
      { name: "Lower (ecc.)",  pose: bicepCurlDown, durationSec: 0.85, holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
  {
    id: "barbell_squat",
    displayName: "Barbell Squat",
    emoji: "🏋️",
    movementClassification: "compound",
    targetMuscles: ["Quadriceps", "Glutes", "Core"],
    equipment: [{ type: "barbell" }],
    constraints: ["handToBar", "feetToFloor"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Brace",         pose: squatBrace,   durationSec: 0.3,  holdSec: 0.2,  easing: "smooth" },
      { name: "Descent",       pose: squatBottom,   durationSec: 0.9,  holdSec: 0.15, easing: "inOutCubic" },
      { name: "Hole pause",    pose: squatBottom,   durationSec: 0.05, holdSec: 0.25, easing: "linear" },
      { name: "Ascent",        pose: squatTop,      durationSec: 0.7,  holdSec: 0.15, easing: "inOutCubic" },
      { name: "Lockout",       pose: squatTop,      durationSec: 0.1,  holdSec: 0.2,  easing: "smooth" },
    ],
  },
  {
    id: "bench_press",
    displayName: "Bench Press",
    emoji: "🛏️",
    movementClassification: "compound",
    targetMuscles: ["Chest", "Triceps", "Shoulders"],
    equipment: [{ type: "barbell" }, { type: "bench" }],
    constraints: ["handToBar", "backToBench", "feetToFloor"],
    cameraPreset: "side",
    phases: [
      { name: "Lockout top",   pose: benchPressTop,    durationSec: 0.15, holdSec: 0.15, easing: "smooth" },
      { name: "Eccentric",     pose: benchPressBottom,  durationSec: 0.85, holdSec: 0.15, easing: "inOutSine" },
      { name: "Pause at chest",pose: benchPressBottom,  durationSec: 0.05, holdSec: 0.2,  easing: "linear" },
      { name: "Press up",      pose: benchPressTop,     durationSec: 0.6,  holdSec: 0.15, easing: "inOutCubic" },
    ],
  },
  {
    id: "deadlift",
    displayName: "Deadlift",
    emoji: "🏋️‍♂️",
    movementClassification: "compound",
    targetMuscles: ["Hamstrings", "Glutes", "Lower Back", "Core"],
    equipment: [{ type: "barbell" }],
    constraints: ["handToBar", "feetToFloor"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Set hips",      pose: deadliftSetup,     durationSec: 0.3,  holdSec: 0.2,  easing: "smooth" },
      { name: "Break floor",   pose: deadliftBreakFloor,durationSec: 0.5,  holdSec: 0.1,  easing: "inOutCubic" },
      { name: "Drive up",      pose: deadliftLockout,   durationSec: 0.6,  holdSec: 0.15, easing: "inOutCubic" },
      { name: "Lockout",       pose: deadliftLockout,   durationSec: 0.1,  holdSec: 0.25, easing: "smooth" },
      { name: "Lower (ecc.)",  pose: deadliftSetup,     durationSec: 0.9,  holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
  {
    id: "pullup",
    displayName: "Pull-Ups",
    emoji: "🧗",
    movementClassification: "compound",
    targetMuscles: ["Lats", "Biceps", "Upper Back"],
    equipment: [{ type: "pullup_bar" }],
    constraints: ["handToPullupBar"],
    cameraPreset: "front",
    phases: [
      { name: "Dead hang",     pose: pullupHang, durationSec: 0.15, holdSec: 0.2,  easing: "smooth" },
      { name: "Pull (mid)",    pose: pullupMid,  durationSec: 0.45, holdSec: 0.05, easing: "inOutCubic" },
      { name: "Chin over bar", pose: pullupTop,  durationSec: 0.35, holdSec: 0.2,  easing: "inOutCubic" },
      { name: "Lower (ecc.)",  pose: pullupHang, durationSec: 0.85, holdSec: 0.15, easing: "inOutSine" },
    ],
  },
  {
    id: "overhead_press",
    displayName: "Overhead Press",
    emoji: "🏋️‍♀️",
    movementClassification: "compound",
    targetMuscles: ["Shoulders", "Triceps", "Core"],
    equipment: [{ type: "barbell" }],
    constraints: ["handToBar", "feetToFloor"],
    cameraPreset: "front",
    phases: [
      { name: "Rack position", pose: ohpBottom,  durationSec: 0.15, holdSec: 0.15, easing: "smooth" },
      { name: "Press up",      pose: ohpTop,     durationSec: 0.6,  holdSec: 0.2,  easing: "inOutCubic" },
      { name: "Lockout",       pose: ohpTop,     durationSec: 0.05, holdSec: 0.2,  easing: "linear" },
      { name: "Lower (ecc.)",  pose: ohpBottom,  durationSec: 0.8,  holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
  {
    id: "bent_over_row",
    displayName: "Bent-Over Row",
    emoji: "🚣",
    movementClassification: "compound",
    targetMuscles: ["Lats", "Rhomboids", "Biceps"],
    equipment: [{ type: "barbell" }],
    constraints: ["handToBar", "feetToFloor"],
    cameraPreset: "side",
    phases: [
      { name: "Arms extended", pose: rowBottom,  durationSec: 0.15, holdSec: 0.1,  easing: "smooth" },
      { name: "Row up",        pose: rowTop,     durationSec: 0.55, holdSec: 0.2,  easing: "inOutCubic" },
      { name: "Squeeze",       pose: rowTop,     durationSec: 0.05, holdSec: 0.3,  easing: "linear" },
      { name: "Lower (ecc.)",  pose: rowBottom,  durationSec: 0.75, holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
  {
    id: "db_shoulder_press",
    displayName: "DB Shoulder Press",
    emoji: "🤸",
    movementClassification: "compound",
    targetMuscles: ["Shoulders", "Triceps"],
    equipment: [{ type: "dumbbells" }],
    constraints: ["handToDumbbell"],
    cameraPreset: "front",
    phases: [
      { name: "At shoulders",  pose: dbShoulderBottom, durationSec: 0.15, holdSec: 0.1,  easing: "smooth" },
      { name: "Press up",      pose: dbShoulderTop,    durationSec: 0.6,  holdSec: 0.2,  easing: "inOutCubic" },
      { name: "Lower (ecc.)",  pose: dbShoulderBottom, durationSec: 0.8,  holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
  {
    id: "dumbbell_lunge",
    displayName: "Dumbbell Lunges",
    emoji: "🏃",
    movementClassification: "compound",
    targetMuscles: ["Quadriceps", "Glutes", "Hamstrings"],
    equipment: [{ type: "dumbbells" }],
    constraints: ["handToDumbbell", "feetToFloor"],
    cameraPreset: "3quarter",
    phases: [
      { name: "Standing",      pose: lungeStand,  durationSec: 0.15, holdSec: 0.15, easing: "smooth" },
      { name: "Step & lower",  pose: lungeBottom, durationSec: 0.75, holdSec: 0.2,  easing: "inOutCubic" },
      { name: "Drive up",      pose: lungeStand,  durationSec: 0.65, holdSec: 0.15, easing: "inOutCubic" },
    ],
  },
  {
    id: "lat_pulldown",
    displayName: "Lat Pulldown",
    emoji: "💪",
    movementClassification: "compound",
    targetMuscles: ["Lats", "Biceps"],
    equipment: [{ type: "cable" }],
    constraints: ["handToBar"],
    cameraPreset: "front",
    phases: [
      { name: "Arms extended", pose: latPulldownUp,   durationSec: 0.15, holdSec: 0.15, easing: "smooth" },
      { name: "Pull down",     pose: latPulldownDown, durationSec: 0.6,  holdSec: 0.25, easing: "inOutCubic" },
      { name: "Squeeze",       pose: latPulldownDown, durationSec: 0.05, holdSec: 0.3,  easing: "linear" },
      { name: "Release (ecc.)",pose: latPulldownUp,   durationSec: 0.8,  holdSec: 0.1,  easing: "inOutSine" },
    ],
  },
];

export const getGymExercise = (id: string) => GYM_EXERCISES.find((e) => e.id === id);

/* ================================================================== */
/*  Convert ExerciseDefinition phases → existing Keyframe[] format     */
/*  so the existing stepPlayback() can drive them seamlessly           */
/* ================================================================== */

export function exerciseToKeyframes(def: ExerciseDefinition): Keyframe[] {
  return def.phases.map((ph) =>
    kf(ph.name, clonePose(ph.pose), ph.durationSec, ph.holdSec, "smooth"),
  );
}

/**
 * Returns the primary equipment type for a definition.
 * Useful for deciding what 3D props to render.
 */
export function primaryEquipment(def: ExerciseDefinition): EquipmentType {
  return def.equipment.length > 0 ? def.equipment[0].type : "none";
}

/**
 * Checks whether a definition requires a specific constraint.
 */
export function hasConstraint(def: ExerciseDefinition, c: ConstraintId): boolean {
  return def.constraints.includes(c);
}


export const GYM_SEQUENCES = GYM_EXERCISES.map((ex) => ({
  id: ex.id,
  name: ex.displayName,
  emoji: ex.emoji,
  equipment: primaryEquipment(ex),
  equipments: ex.equipment.map((e) => e.type),
  build: () => exerciseToKeyframes(ex),
}));
