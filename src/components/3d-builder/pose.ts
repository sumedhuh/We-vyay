import * as THREE from "three";
import { lerpPosePremium, type EasingCurve } from "./poseChannels";

/* ================= dimensions ================= */
export const DIM = {
  torso: 0.4, neck: 0.09, head: 0.115,
  upperArm: 0.3, foreArm: 0.29, shoulderW: 0.19,
  hipW: 0.105, thigh: 0.45, shin: 0.44, foot: 0.21,
};

/* ================= pose ================= */
export interface Pose {
  rootX: number; rootY: number; rootZ: number;
  rootPitch: number; rootSpin: number; rootSide: number; rootTurn: number;
  spineCurl: number; spineSide: number;
  headNod: number; headTurn: number;
  armFlexL: number; armFlexR: number; armAbdL: number; armAbdR: number;
  elbowL: number; elbowR: number;
  legFlexL: number; legFlexR: number; legAbdL: number; legAbdR: number;
  kneeL: number; kneeR: number;
  footL: number; footR: number;
  /* ---- face studio channels ---- */
  eyeSquint: number;      // 0..100
  browLift: number;       // 0..100
  jawOpen: number;        // 0..100
  lipPurse: number;       // 0..100
  cheekSuck: number;      // 0..100
  cheekLift: number;      // 0..100
  smile: number;          // 0..100
}

export type PoseKey = keyof Pose;

export interface ChannelDef {
  key: PoseKey; label: string; min: number; max: number; step: number; unit: string;
  hint?: string;
}

export interface ChannelGroup { id: string; label: string; icon: string; channels: ChannelDef[] }

const deg = (k: PoseKey, label: string, min: number, max: number, hint?: string): ChannelDef =>
  ({ key: k, label, min, max, step: 1, unit: "°", hint });

export const CHANNEL_GROUPS: ChannelGroup[] = [
  {
    id: "body", label: "Whole Body", icon: "🧍",
    channels: [
      { key: "rootY", label: "Height", min: 0.02, max: 1.25, step: 0.01, unit: "m" },
      { key: "rootX", label: "Side shift", min: -0.7, max: 0.7, step: 0.01, unit: "m" },
      { key: "rootZ", label: "Slide fwd / back", min: -1.2, max: 0.9, step: 0.01, unit: "m" },
      deg("rootPitch", "Fold forward / back", -70, 220, "0 = upright · 90 = lying flat"),
      deg("rootSpin", "Roll onto front / back", -180, 180, "0 = face down · 180 = face up"),
      deg("rootSide", "Side bend", -45, 45),
      deg("rootTurn", "Turn to face", -180, 180),
    ],
  },
  {
    id: "spine", label: "Spine & Head", icon: "🫀",
    channels: [
      deg("spineCurl", "Spine curl / arch", -70, 130, "+ curls forward, − arches back"),
      deg("spineSide", "Spine side bend", -45, 45),
      deg("headNod", "Head nod", -55, 65),
      deg("headTurn", "Head turn", -75, 75),
    ],
  },
  {
    id: "armL", label: "Left Arm", icon: "🫲",
    channels: [
      deg("armFlexL", "Shoulder swing", -75, 190, "0 = by side · 180 = overhead"),
      deg("armAbdL", "Lift out to side", 0, 125),
      deg("elbowL", "Elbow bend", 0, 158),
    ],
  },
  {
    id: "armR", label: "Right Arm", icon: "🫱",
    channels: [
      deg("armFlexR", "Shoulder swing", -75, 190, "0 = by side · 180 = overhead"),
      deg("armAbdR", "Lift out to side", 0, 125),
      deg("elbowR", "Elbow bend", 0, 158),
    ],
  },
  {
    id: "legL", label: "Left Leg", icon: "🦵",
    channels: [
      deg("legFlexL", "Hip swing", -60, 145, "0 = straight down · 90 = leg up front"),
      deg("legAbdL", "Leg out to side", 0, 65),
      deg("kneeL", "Knee bend", 0, 152),
      deg("footL", "Toes point / flex", -55, 70, "+ pointed · − flexed back"),
    ],
  },
  {
    id: "legR", label: "Right Leg", icon: "🦿",
    channels: [
      deg("legFlexR", "Hip swing", -60, 145, "0 = straight down · 90 = leg up front"),
      deg("legAbdR", "Leg out to side", 0, 65),
      deg("kneeR", "Knee bend", 0, 152),
      deg("footR", "Toes point / flex", -55, 70, "+ pointed · − flexed back"),
    ],
  },
  {
    id: "face", label: "Face", icon: "😊",
    channels: [
      { key: "eyeSquint", label: "Eye squint", min: 0, max: 100, step: 1, unit: "%", hint: "For lion face and eye-tightening drills" },
      { key: "browLift", label: "Brow lift", min: 0, max: 100, step: 1, unit: "%", hint: "Forehead smoother / brow lifter" },
      { key: "jawOpen", label: "Jaw open", min: 0, max: 100, step: 1, unit: "%", hint: "Big O, lion face, jaw release" },
      { key: "lipPurse", label: "Lip purse / O", min: 0, max: 100, step: 1, unit: "%", hint: "Big O and lip-plumper style work" },
      { key: "cheekSuck", label: "Cheek suck", min: 0, max: 100, step: 1, unit: "%", hint: "Fish face / cheek hollowing" },
      { key: "cheekLift", label: "Cheek lift", min: 0, max: 100, step: 1, unit: "%", hint: "Smile lines / cheek sculpting" },
      { key: "smile", label: "Smile corners", min: 0, max: 100, step: 1, unit: "%", hint: "Smile smoother / grin hold" },
    ],
  },
];

export const ALL_CHANNELS: ChannelDef[] = CHANNEL_GROUPS.flatMap((g) => g.channels);

export function zeroPose(): Pose {
  const p = {} as Pose;
  for (const c of ALL_CHANNELS) p[c.key] = 0;
  p.rootY = 0.42;
  return p;
}

export function clonePose(p: Pose): Pose {
  return { ...p };
}

export function lerpPose(a: Pose, b: Pose, t: number, out: Pose): Pose {
  // Delegate to the premium channel-aware interpolation
  // with angle wrapping, clamping, and easeInOutCubic easing
  return lerpPosePremium(a, b, t, out, "smooth");
}

export function mirrorPose(p: Pose): Pose {
  return {
    ...p,
    armFlexL: p.armFlexR, armFlexR: p.armFlexL,
    armAbdL: p.armAbdR, armAbdR: p.armAbdL,
    elbowL: p.elbowR, elbowR: p.elbowL,
    legFlexL: p.legFlexR, legFlexR: p.legFlexL,
    legAbdL: p.legAbdR, legAbdR: p.legAbdL,
    kneeL: p.kneeR, kneeR: p.kneeL,
    footL: p.footR, footR: p.footL,
    rootX: -p.rootX,
    rootSide: -p.rootSide,
    rootTurn: -p.rootTurn,
    spineSide: -p.spineSide,
    headTurn: -p.headTurn,
  };
}

/* ================= pose library ================= */
export const P = (o: Partial<Pose>): Pose => ({ ...zeroPose(), ...o });

export interface PosePreset { id: string; name: string; emoji: string; pose: Pose }

export const POSE_LIBRARY: PosePreset[] = [
  { id: "stand", name: "Mountain", emoji: "🧍", pose: P({ rootY: 0.95, rootZ: -0.3, armAbdL: 6, armAbdR: 6, elbowL: 4, elbowR: 4, kneeL: 2, kneeR: 2 }) },
  { id: "plankTop", name: "Plank / Push-up Top", emoji: "🤸", pose: P({ rootY: 0.44, rootZ: -0.26, rootPitch: 90, armFlexL: 90, armFlexR: 90, armAbdL: 8, armAbdR: 8, elbowL: 6, elbowR: 6, kneeL: 2, kneeR: 2, footL: 55, footR: 55 }) },
  { id: "plankBottom", name: "Push-up Bottom", emoji: "💪", pose: P({ rootY: 0.3, rootZ: -0.2, rootPitch: 96, armFlexL: 88, armFlexR: 88, armAbdL: 12, armAbdR: 12, elbowL: 86, elbowR: 86, kneeL: 3, kneeR: 3, footL: 55, footR: 55 }) },
  { id: "widePushup", name: "Wide Push-up", emoji: "↔️", pose: P({ rootY: 0.44, rootZ: -0.26, rootPitch: 90, armFlexL: 92, armFlexR: 92, armAbdL: 48, armAbdR: 48, elbowL: 6, elbowR: 6, footL: 55, footR: 55 }) },
  { id: "downDog", name: "Downward Dog", emoji: "🔻", pose: P({ rootY: 0.82, rootZ: -0.28, rootPitch: 125, armFlexL: 96, armFlexR: 96, armAbdL: 14, armAbdR: 14, elbowL: 22, elbowR: 22, legFlexL: -42, legFlexR: -42, kneeL: 14, kneeR: 14, footL: 42, footR: 42 }) },
  { id: "upDog", name: "Upward Dog / Cobra", emoji: "🐍", pose: P({ rootY: 0.3, rootZ: -0.3, rootPitch: -32, spineCurl: -22, armFlexL: 104, armFlexR: 104, elbowL: 14, elbowR: 14, legFlexL: -18, legFlexR: -18, footL: 66, footR: 66 }) },
  { id: "child", name: "Child's Pose", emoji: "🙏", pose: P({ rootY: 0.34, rootZ: -0.62, rootPitch: 152, spineCurl: 28, armFlexL: 104, armFlexR: 104, elbowL: 10, elbowR: 10, legFlexL: 58, legFlexR: 58, kneeL: 122, kneeR: 122, footL: 56, footR: 56 }) },
  { id: "warrior2", name: "Warrior II", emoji: "⚔️", pose: P({ rootY: 0.8, rootZ: -0.3, rootTurn: 28, legAbdL: 38, legAbdR: 38, legFlexR: 24, kneeR: 82, armAbdL: 88, armAbdR: 88, kneeL: 3 }) },
  { id: "chair", name: "Chair Pose", emoji: "🪑", pose: P({ rootY: 0.62, rootZ: -0.3, rootPitch: 14, legFlexL: 42, legFlexR: 42, kneeL: 86, kneeR: 86, footL: -12, footR: -12, armFlexL: 166, armFlexR: 166 }) },
  { id: "tree", name: "Tree Pose", emoji: "🌳", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 172, armFlexR: 172, armAbdL: 16, armAbdR: 16, legFlexL: 72, kneeL: 116, legAbdL: 26, footL: -22 }) },
  { id: "squat", name: "Deep Squat", emoji: "🦿", pose: P({ rootY: 0.44, rootZ: -0.34, rootPitch: 26, legFlexL: 108, legFlexR: 108, kneeL: 124, kneeR: 124, footL: -14, footR: -14, armFlexL: 82, armFlexR: 82, elbowL: 22, elbowR: 22 }) },
  { id: "supineFlat", name: "Lying Flat", emoji: "🛌", pose: P({ rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180, armAbdL: 16, armAbdR: 16, legAbdL: 8, legAbdR: 8, footL: 30, footR: 30 }) },
  { id: "crunchDown", name: "Crunch · Down", emoji: "😴", pose: P({ rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180, spineCurl: 4, legFlexL: 62, legFlexR: 62, kneeL: 82, kneeR: 82, armFlexL: 30, armFlexR: 30, elbowL: 92, elbowR: 92, footL: -8, footR: -8 }) },
  { id: "crunchUp", name: "Crunch · Up", emoji: "🔥", pose: P({ rootY: 0.16, rootZ: -0.28, rootPitch: 90, rootSpin: 180, spineCurl: 62, headNod: 18, legFlexL: 62, legFlexR: 62, kneeL: 82, kneeR: 82, armFlexL: 30, armFlexR: 30, elbowL: 92, elbowR: 92, footL: -8, footR: -8 }) },
  { id: "situpTop", name: "Sit-up · Top", emoji: "⬆️", pose: P({ rootY: 0.34, rootZ: -0.2, rootPitch: 74, rootSpin: 180, spineCurl: 96, legFlexL: 70, legFlexR: 70, kneeL: 88, kneeR: 88, armFlexL: 150, armFlexR: 150, elbowL: 40, elbowR: 40 }) },
  { id: "legRaiseDown", name: "Leg Raise · Down", emoji: "⬇️", pose: P({ rootY: 0.14, rootZ: -0.3, rootPitch: 90, rootSpin: 180, footL: 34, footR: 34, armAbdL: 20, armAbdR: 20 }) },
  { id: "legRaiseUp", name: "Leg Raise · Up", emoji: "🦵", pose: P({ rootY: 0.16, rootZ: -0.3, rootPitch: 90, rootSpin: 180, legFlexL: 92, legFlexR: 92, spineCurl: 14, footL: 44, footR: 44, armAbdL: 20, armAbdR: 20 }) },
  { id: "bridge", name: "Glute Bridge", emoji: "🌉", pose: P({ rootY: 0.44, rootZ: -0.26, rootPitch: 90, rootSpin: 180, spineCurl: -18, legFlexL: 72, legFlexR: 72, kneeL: 96, kneeR: 96, footL: -14, footR: -14, armFlexL: -55, armFlexR: -55, elbowL: 4, elbowR: 4 }) },
  { id: "shoulderStand", name: "Shoulder Stand", emoji: "🙃", pose: P({ rootY: 0.56, rootZ: -0.16, rootPitch: 90, rootSpin: 180, spineCurl: 22, legFlexL: 92, legFlexR: 92, elbowL: 60, elbowR: 60, armFlexL: -30, armFlexR: -30, footL: 46, footR: 46 }) },
  { id: "superman", name: "Superman Hold", emoji: "🦸", pose: P({ rootY: 0.18, rootZ: -0.34, rootPitch: 90, spineCurl: -26, armFlexL: 166, armFlexR: 166, legFlexL: -30, legFlexR: -30, footL: 58, footR: 58 }) },
  { id: "sidePlank", name: "Side Plank", emoji: "📐", pose: P({ rootY: 0.44, rootZ: -0.28, rootPitch: 90, rootSpin: 96, armFlexR: 92, armFlexL: 168, armAbdL: 10, footL: 55, footR: 55 }) },
  { id: "hollow", name: "Hollow Hold", emoji: "🥁", pose: P({ rootY: 0.16, rootZ: -0.3, rootPitch: 90, rootSpin: 180, spineCurl: 26, legFlexL: 26, legFlexR: 26, armFlexL: 166, armFlexR: 166, footL: 46, footR: 46 }) },
  { id: "armsOverhead", name: "Arms Overhead", emoji: "🙌", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 176, armFlexR: 176, armAbdL: 14, armAbdR: 14, kneeL: 2, kneeR: 2 }) },
  { id: "tPose", name: "T-Pose", emoji: "✝️", pose: P({ rootY: 0.95, rootZ: -0.3, armAbdL: 92, armAbdR: 92, kneeL: 2, kneeR: 2 }) },
  { id: "lunge", name: "Runner's Lunge", emoji: "🏃", pose: P({ rootY: 0.62, rootZ: -0.32, rootPitch: 22, legFlexR: 62, kneeR: 96, legFlexL: -34, kneeL: 8, footL: 40, armFlexL: 96, armFlexR: 96, elbowL: 78, elbowR: 78 }) },
  { id: "planche", name: "Planche Hold", emoji: "💪", pose: P({ rootY: 0.35, rootZ: 0, rootPitch: 90, spineCurl: 15, armFlexL: 80, armFlexR: 80, armAbdL: 20, armAbdR: 20, elbowL: 2, elbowR: 2, legFlexL: -15, legFlexR: -15, kneeL: 0, kneeR: 0, footL: 55, footR: 55 }) },
  { id: "lSit", name: "L-Sit", emoji: "📐", pose: P({ rootY: 0.38, rootZ: -0.1, rootPitch: 0, spineCurl: 10, armFlexL: 10, armFlexR: 10, armAbdL: 15, armAbdR: 15, elbowL: 2, elbowR: 2, legFlexL: 90, legFlexR: 90, kneeL: 2, kneeR: 2, footL: -10, footR: -10 }) },
  { id: "handstand", name: "Handstand", emoji: "🤸", pose: P({ rootY: 1.45, rootZ: 0, rootPitch: 180, spineCurl: -10, armFlexL: 180, armFlexR: 180, armAbdL: 10, armAbdR: 10, elbowL: 2, elbowR: 2, legFlexL: 0, legFlexR: 0, kneeL: 2, kneeR: 2, footL: 55, footR: 55 }) },
  { id: "boat", name: "Boat Pose", emoji: "⛵", pose: P({ rootY: 0.22, rootZ: 0, rootPitch: -35, spineCurl: 20, armFlexL: 90, armFlexR: 90, armAbdL: 10, armAbdR: 10, elbowL: 2, elbowR: 2, legFlexL: 125, legFlexR: 125, kneeL: 2, kneeR: 2, footL: 20, footR: 20 }) },
  { id: "crow", name: "Crow Pose", emoji: "🦅", pose: P({ rootY: 0.42, rootZ: -0.15, rootPitch: 75, spineCurl: 35, armFlexL: 75, armFlexR: 75, armAbdL: 25, armAbdR: 25, elbowL: 45, elbowR: 45, legFlexL: 100, legFlexR: 100, kneeL: 130, kneeR: 130, footL: 45, footR: 45 }) },
  // ---- Gym Exercise Poses ----
  { id: "bicepCurlDown", name: "Bicep Curl (Down)", emoji: "💪", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 0, armFlexR: 0, armAbdL: 5, armAbdR: 5, elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2 }) },
  { id: "bicepCurlUp", name: "Bicep Curl (Up)", emoji: "💪", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 10, armFlexR: 10, armAbdL: 5, armAbdR: 5, elbowL: 135, elbowR: 135, kneeL: 2, kneeR: 2 }) },
  { id: "squatTop", name: "Squat (Top)", emoji: "🏋️", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 120, armFlexR: 120, armAbdL: 60, armAbdR: 60, elbowL: 90, elbowR: 90, kneeL: 2, kneeR: 2, legAbdL: 20, legAbdR: 20 }) },
  { id: "squatBottom", name: "Squat (Bottom)", emoji: "🏋️", pose: P({ rootY: 0.55, rootZ: -0.3, rootPitch: 35, legFlexL: 105, legFlexR: 105, kneeL: 120, kneeR: 120, footL: -15, footR: -15, armFlexL: 120, armFlexR: 120, armAbdL: 60, armAbdR: 60, elbowL: 90, elbowR: 90, legAbdL: 20, legAbdR: 20 }) },
  { id: "benchPressTop", name: "Bench Press (Top)", emoji: "🛏️", pose: P({ rootY: 0.45, rootZ: -0.2, rootPitch: 90, rootSpin: 180, armFlexL: 90, armFlexR: 90, armAbdL: 10, armAbdR: 10, elbowL: 5, elbowR: 5, legFlexL: 60, legFlexR: 60, kneeL: 90, kneeR: 90 }) },
  { id: "benchPressBottom", name: "Bench Press (Bottom)", emoji: "🛏️", pose: P({ rootY: 0.45, rootZ: -0.2, rootPitch: 90, rootSpin: 180, armFlexL: 90, armFlexR: 90, armAbdL: 75, armAbdR: 75, elbowL: 90, elbowR: 90, legFlexL: 60, legFlexR: 60, kneeL: 90, kneeR: 90 }) },
  { id: "deadliftBottom", name: "Deadlift (Bottom)", emoji: "🏋️", pose: P({ rootY: 0.6, rootZ: -0.3, rootPitch: 65, legFlexL: 65, legFlexR: 65, kneeL: 75, kneeR: 75, footL: -10, footR: -10, armFlexL: 65, armFlexR: 65, elbowL: 5, elbowR: 5, legAbdL: 10, legAbdR: 10 }) },
  { id: "deadliftTop", name: "Deadlift (Top)", emoji: "🏋️", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 5, armFlexR: 5, armAbdL: 5, armAbdR: 5, elbowL: 5, elbowR: 5, kneeL: 2, kneeR: 2, legAbdL: 10, legAbdR: 10 }) },
  { id: "pullupHang", name: "Pull-Up (Hang)", emoji: "🧗", pose: P({ rootY: 1.1, rootZ: -0.3, armFlexL: 175, armFlexR: 175, armAbdL: 45, armAbdR: 45, elbowL: 5, elbowR: 5, kneeL: 10, kneeR: 10 }) },
  { id: "pullupTop", name: "Pull-Up (Top)", emoji: "🧗", pose: P({ rootY: 1.5, rootZ: -0.3, armFlexL: 135, armFlexR: 135, armAbdL: 60, armAbdR: 60, elbowL: 120, elbowR: 120, kneeL: 10, kneeR: 10 }) },
  { id: "ohpBottom", name: "OHP (Bottom)", emoji: "🏋️", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 90, armFlexR: 90, armAbdL: 80, armAbdR: 80, elbowL: 100, elbowR: 100, kneeL: 2, kneeR: 2 }) },
  { id: "ohpTop", name: "OHP (Top)", emoji: "🏋️", pose: P({ rootY: 0.95, rootZ: -0.3, armFlexL: 170, armFlexR: 170, armAbdL: 20, armAbdR: 20, elbowL: 10, elbowR: 10, kneeL: 2, kneeR: 2 }) },
  { id: "rowBottom", name: "Row (Bottom)", emoji: "🚣", pose: P({ rootY: 0.8, rootZ: -0.3, rootPitch: 50, spineCurl: 10, armFlexL: 50, armFlexR: 50, armAbdL: 5, armAbdR: 5, elbowL: 5, elbowR: 5, kneeL: 15, kneeR: 15, legFlexL: 20, legFlexR: 20 }) },
  { id: "rowTop", name: "Row (Top)", emoji: "🚣", pose: P({ rootY: 0.8, rootZ: -0.3, rootPitch: 50, spineCurl: 10, armFlexL: 50, armFlexR: 50, armAbdL: 15, armAbdR: 15, elbowL: 110, elbowR: 110, kneeL: 15, kneeR: 15, legFlexL: 20, legFlexR: 20 }) },
];

export const posePreset = (id: string) => POSE_LIBRARY.find((p) => p.id === id);

/* ================= face studio library ================= */
export interface FacePosePreset {
  id: string;
  name: string;
  emoji: string;
  pose: Pose;
  guides: FaceGuide[];
}

const FP = (name: string, pose: Partial<Pose>, guides: FaceGuide[], emoji: string, id: string): FacePosePreset => ({
  id,
  name,
  emoji,
  pose: { ...zeroPose(), rootY: 0.98, ...pose, armFlexL: 18, armFlexR: 18, elbowL: 68, elbowR: 68, armAbdL: 6, armAbdR: 6 },
  guides,
});

export const facePosePresets: FacePosePreset[] = [
  FP("Relaxed Face", {}, [], "🙂", "faceRelax"),
  FP("Big O Lift", { jawOpen: 78, lipPurse: 92, browLift: 28 }, [
    { id: "mouth-o", label: "Big O mouth", points: [[0.42, 0.67], [0.5, 0.77], [0.58, 0.67], [0.5, 0.57]], color: "#7f9ce8" },
  ], "🅾️", "bigO"),
  FP("Fish Face Hold", { cheekSuck: 100, lipPurse: 58 }, [
    { id: "cheek-in", label: "suck cheeks in", points: [[0.22, 0.6], [0.5, 0.68], [0.78, 0.6]], color: "#ff4d2e" },
  ], "🐟", "fishFace"),
  FP("Cheek Puffer", { cheekLift: 66, jawOpen: 18 }, [
    { id: "puff-left", label: "hold air in cheeks", points: [[0.25, 0.55], [0.75, 0.55]], color: "#ffc93c", dashed: true },
  ], "🎈", "cheekPuffer"),
  FP("Brow Lifter", { browLift: 100, eyeSquint: 16 }, [
    { id: "brow-arc", label: "lift brows", points: [[0.24, 0.26], [0.38, 0.21], [0.5, 0.19], [0.62, 0.21], [0.76, 0.26]], color: "#c6ff2e" },
  ], "🤨", "browLift"),
  FP("Smile Smoother", { smile: 58, cheekLift: 42 }, [
    { id: "smile-lines", label: "lift smile lines", points: [[0.34, 0.58], [0.26, 0.44]], color: "#8b5cf6" },
    { id: "smile-lines-r", label: "lift smile lines", points: [[0.66, 0.58], [0.74, 0.44]], color: "#8b5cf6" },
  ], "😁", "smileSmoother"),
  FP("Jawline Definer", { jawOpen: 52, headNod: -10 }, [
    { id: "jaw-sweep", label: "trace jawline", points: [[0.18, 0.76], [0.33, 0.82], [0.5, 0.86], [0.67, 0.82], [0.82, 0.76]], color: "#22d3ee" },
  ], "🗿", "jawlineDefiner"),
  FP("Lion Face", { jawOpen: 100, eyeSquint: 84, browLift: 40 }, [
    { id: "open-jaw", label: "open wide", points: [[0.42, 0.63], [0.5, 0.85], [0.58, 0.63]], color: "#ff4d2e" },
  ], "🦁", "lionFace"),
  FP("Forehead Smoother", { browLift: 36 }, [
    { id: "forehead-sweep", label: "smooth upward", points: [[0.3, 0.18], [0.32, 0.1], [0.36, 0.04]], color: "#c6ff2e" },
    { id: "forehead-sweep-r", label: "smooth upward", points: [[0.7, 0.18], [0.68, 0.1], [0.64, 0.04]], color: "#c6ff2e" },
  ], "🧠", "foreheadSmoother"),
  FP("Lip Plumper", { lipPurse: 82, smile: 16 }, [
    { id: "lip-circle", label: "purse lips", points: [[0.41, 0.68], [0.5, 0.72], [0.59, 0.68], [0.5, 0.63]], color: "#ff4d94" },
  ], "💋", "lipPlumper"),
  FP("Kiss the Sky", { headNod: -40, lipPurse: 100, jawOpen: 10 }, [
    { id: "neck-stretch", label: "stretch neck upward", points: [[0.5, 0.95], [0.5, 0.75]], color: "#5ce08a" },
  ], "😗", "kissSky"),
];

export const facePreset = (id: string) => facePosePresets.find((p) => p.id === id);

export const FACE_SEQUENCES: { id: string; name: string; emoji: string; build: () => Workout }[] = [
  {
    id: "jawline",
    name: "Jawline Sculpt",
    emoji: "🗿",
    build: () => ({
      ...makeWorkout("Jawline Sculpt", "face"),
      mode: "face",
      keyframes: [
        kf("Neutral", facePreset("faceRelax")!.pose, 0.45, 0.25),
        kf("Jawline Definer", facePreset("jawlineDefiner")!.pose, 0.65, 0.35),
        kf("Big O Lift", facePreset("bigO")!.pose, 0.55, 0.25),
      ],
      guides: facePreset("jawlineDefiner")!.guides,
    }),
  },
  {
    id: "cheeks",
    name: "Cheek Lift Flow",
    emoji: "🎈",
    build: () => ({
      ...makeWorkout("Cheek Lift Flow", "face"),
      mode: "face",
      keyframes: [
        kf("Relaxed Face", facePreset("faceRelax")!.pose, 0.45, 0.25),
        kf("Cheek Puffer", facePreset("cheekPuffer")!.pose, 0.65, 0.4),
        kf("Fish Face", facePreset("fishFace")!.pose, 0.6, 0.3),
        kf("Smile Smoother", facePreset("smileSmoother")!.pose, 0.65, 0.35),
      ],
      guides: facePreset("cheekPuffer")!.guides,
    }),
  },
  {
    id: "brow",
    name: "Brow + Forehead Reset",
    emoji: "🤨",
    build: () => ({
      ...makeWorkout("Brow + Forehead Reset", "face"),
      mode: "face",
      keyframes: [
        kf("Relaxed Face", facePreset("faceRelax")!.pose, 0.45, 0.25),
        kf("Brow Lifter", facePreset("browLift")!.pose, 0.6, 0.35),
        kf("Forehead Smoother", facePreset("foreheadSmoother")!.pose, 0.6, 0.3),
      ],
      guides: facePreset("browLift")!.guides,
    }),
  },
  {
    id: "trendmix",
    name: "Trending Face Yoga Mix",
    emoji: "✨",
    build: () => ({
      ...makeWorkout("Trending Face Yoga Mix", "face"),
      mode: "face",
      keyframes: [
        kf("Lion Face", facePreset("lionFace")!.pose, 0.6, 0.25),
        kf("Big O Lift", facePreset("bigO")!.pose, 0.55, 0.25),
        kf("Fish Face", facePreset("fishFace")!.pose, 0.55, 0.25),
        kf("Smile Smoother", facePreset("smileSmoother")!.pose, 0.6, 0.35),
        kf("Lip Plumper", facePreset("lipPlumper")!.pose, 0.55, 0.3),
      ],
      guides: facePreset("lionFace")!.guides,
    }),
  },
  {
    id: "neck",
    name: "Neck & Jaw Stretch",
    emoji: "🦒",
    build: () => ({
      ...makeWorkout("Neck & Jaw Stretch", "face"),
      mode: "face",
      keyframes: [
        kf("Relaxed Face", facePreset("faceRelax")!.pose, 0.45, 0.25),
        kf("Kiss the Sky", facePreset("kissSky")!.pose, 0.7, 0.4),
        kf("Jawline Definer", facePreset("jawlineDefiner")!.pose, 0.6, 0.3),
      ],
      guides: facePreset("kissSky")!.guides,
    }),
  },
];

/* ================= timeline ================= */
export type Ease = "smooth" | "linear" | "snap" | "bounce";

export interface Keyframe {
  id: string;
  name: string;
  pose: Pose;
  dur: number; // seconds spent easing INTO this pose
  hold: number; // seconds to hold it
  ease: Ease;
}

export interface BreathConfig {
  enabled: boolean;
  inhaleStart: number;
  inhaleEnd: number;
}

export type WorkoutMode = "body" | "face";

export interface FaceGuide {
  id: string;
  label: string;
  /** points in 0..1 facial UV space, left→right and top→bottom */
  points: Array<[number, number]>;
  color: string;
  dashed?: boolean;
}

export type EquipmentType =
  | "none"
  | "dumbbells"
  | "barbell"
  | "pullup_bar"
  | "bench"
  | "cable"
  | "kettlebell"
  | "machine"
  | "cardio"
  | "band"
  | "box"
  | "plates";

export interface Workout {
  id: string;
  name: string;
  loop: boolean;
  autoGround: boolean;
  breath: BreathConfig;
  keyframes: Keyframe[];
  createdAt: number;
  mode: WorkoutMode;
  guides?: FaceGuide[];
  /** explicit equipment binding — drives equipment rendering and IK constraints */
  equipment?: EquipmentType;
  equipments?: EquipmentType[];
}

const uid = () => `k${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

export function kf(name: string, pose: Pose, dur = 0.7, hold = 0.35, ease: Ease = "smooth"): Keyframe {
  return { id: uid(), name, pose: clonePose(pose), dur, hold, ease };
}

export function makeWorkout(name = "My Workout", mode: WorkoutMode = "body", equipment: EquipmentType = "none"): Workout {
  return {
    id: uid(),
    name,
    loop: true,
    autoGround: true,
    breath: { enabled: true, inhaleStart: 0, inhaleEnd: 0.5 },
    keyframes: mode === "body"
      ? [
        kf("Plank top", clonePose(posePreset("plankTop")!.pose), 0.6, 0.3),
        kf("Chest to floor", clonePose(posePreset("plankBottom")!.pose), 0.7, 0.25),
      ]
      : [kf("Relaxed face", facePosePresets[0].pose, 0.6, 0.4)],
    createdAt: Date.now(),
    mode,
    guides: mode === "face" ? facePosePresets[0].guides : undefined,
    equipment,
  };
}

/** ready-made multi-keyframe workouts */
export const SEQUENCES: { id: string; name: string; emoji: string; equipment?: EquipmentType; build: () => Keyframe[] }[] = [
  { id: "pushup", name: "Push-Up", emoji: "💪", build: () => [kf("Top", clonePose(posePreset("plankTop")!.pose), 0.55, 0.25), kf("Bottom", clonePose(posePreset("plankBottom")!.pose), 0.65, 0.2)] },
  { id: "crunch", name: "Crunches", emoji: "🔥", build: () => [kf("Down", clonePose(posePreset("crunchDown")!.pose), 0.5, 0.2), kf("Up", clonePose(posePreset("crunchUp")!.pose), 0.55, 0.2)] },
  { id: "legraise", name: "Leg Raises", emoji: "🦵", build: () => [kf("Down", clonePose(posePreset("legRaiseDown")!.pose), 0.6, 0.2), kf("Up", clonePose(posePreset("legRaiseUp")!.pose), 0.6, 0.25)] },
  {
    id: "sun", name: "Sun Salutation", emoji: "🌞", build: () => [
      kf("Mountain", clonePose(posePreset("armsOverhead")!.pose), 1.0, 0.6),
      kf("Forward fold", P({ rootY: 0.72, rootZ: -0.3, rootPitch: 118, kneeL: 12, kneeR: 12, armFlexL: 12, armFlexR: 12 }), 0.9, 0.4),
      kf("Plank", clonePose(posePreset("plankTop")!.pose), 0.8, 0.4),
      kf("Upward dog", clonePose(posePreset("upDog")!.pose), 0.9, 0.7),
      kf("Downward dog", clonePose(posePreset("downDog")!.pose), 0.8, 0.8),
    ]
  },
  {
    id: "flow", name: "Core Flow", emoji: "🌊", build: () => [
      kf("Hollow", clonePose(posePreset("hollow")!.pose), 0.7, 0.5),
      kf("Crunch", clonePose(posePreset("crunchUp")!.pose), 0.6, 0.3),
      kf("Legs up", clonePose(posePreset("legRaiseUp")!.pose), 0.7, 0.4),
      kf("Bridge", clonePose(posePreset("bridge")!.pose), 0.8, 0.5),
    ]
  },
  {
    id: "yoga", name: "Yoga Balance", emoji: "🧘", build: () => [
      kf("Mountain", clonePose(posePreset("stand")!.pose), 0.9, 0.8),
      kf("Tree", clonePose(posePreset("tree")!.pose), 1.1, 1.4),
      kf("Warrior II", clonePose(posePreset("warrior2")!.pose), 1.0, 1.2),
      kf("Chair", clonePose(posePreset("chair")!.pose), 0.9, 1.0),
    ]
  },
  {
    id: "calisthenics", name: "Calisthenics Hold", emoji: "💪", build: () => [
      kf("L-Sit", clonePose(posePreset("lSit")!.pose), 1.0, 1.5),
      kf("Tuck Planche", P({ rootY: 0.45, rootZ: 0, rootPitch: 85, spineCurl: 45, armFlexL: 85, armFlexR: 85, armAbdL: 20, armAbdR: 20, elbowL: 10, elbowR: 10, legFlexL: 110, legFlexR: 110, kneeL: 140, kneeR: 140 }), 1.2, 1.0),
      kf("Full Planche", clonePose(posePreset("planche")!.pose), 1.5, 2.0),
    ]
  },
  {
    id: "advancedyoga", name: "Advanced Yoga Flow", emoji: "🧘‍♀️", build: () => [
      kf("Boat Pose", clonePose(posePreset("boat")!.pose), 1.0, 1.5),
      kf("Crow Pose", clonePose(posePreset("crow")!.pose), 1.2, 1.5),
      kf("Handstand", clonePose(posePreset("handstand")!.pose), 1.5, 2.0),
      kf("Child's Pose", clonePose(posePreset("child")!.pose), 1.0, 1.0),
    ]
  },
];

/* ================= easing ================= */
export function easeFn(e: Ease, t: number): number {
  const x = Math.min(1, Math.max(0, t));
  switch (e) {
    case "linear": return x;
    case "snap": return x < 0.7 ? smoothstep(x / 0.7) : 1;
    case "bounce": {
      // slight overshoot then settle
      if (x < 0.75) {
        const u = x / 0.75;
        return u * u * (3 - 2 * u) * 1.08;
      }
      const u = (x - 0.75) / 0.25;
      return 1.08 - 0.08 * smoothstep(u);
    }
    default: return smoothstep(x);
  }
}
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

/* ================= forward kinematics ================= */
export interface Skeleton {
  pelvis: THREE.Vector3; chest: THREE.Vector3; headPos: THREE.Vector3;
  up: THREE.Vector3; fwd: THREE.Vector3; right: THREE.Vector3; spineDir: THREE.Vector3;
  shoulderL: THREE.Vector3; shoulderR: THREE.Vector3;
  elbowL: THREE.Vector3; elbowR: THREE.Vector3;
  wristL: THREE.Vector3; wristR: THREE.Vector3;
  hipL: THREE.Vector3; hipR: THREE.Vector3;
  kneeL: THREE.Vector3; kneeR: THREE.Vector3;
  ankleL: THREE.Vector3; ankleR: THREE.Vector3;
  toeL: THREE.Vector3; toeR: THREE.Vector3;
  footDirL: THREE.Vector3; footDirR: THREE.Vector3;
  kneeOutL: THREE.Vector3; kneeOutR: THREE.Vector3;
  effort: number;
}

export function makeSkeleton(): Skeleton {
  const v = () => new THREE.Vector3();
  return {
    pelvis: v(), chest: v(), headPos: v(),
    up: v(), fwd: v(), right: v(), spineDir: v(),
    shoulderL: v(), shoulderR: v(), elbowL: v(), elbowR: v(), wristL: v(), wristR: v(),
    hipL: v(), hipR: v(), kneeL: v(), kneeR: v(), ankleL: v(), ankleR: v(),
    toeL: v(), toeR: v(), footDirL: v(), footDirR: v(), kneeOutL: v(), kneeOutR: v(),
    effort: 0,
  };
}

const qYaw = new THREE.Quaternion();
const qPitch = new THREE.Quaternion();
const qSide = new THREE.Quaternion();
const qSpin = new THREE.Quaternion();
const qBody = new THREE.Quaternion();
const AX = new THREE.Vector3(1, 0, 0);
const AY = new THREE.Vector3(0, 1, 0);
const AZ = new THREE.Vector3(0, 0, 1);
const tV = new THREE.Vector3();
const tV2 = new THREE.Vector3();
const tHinge = new THREE.Vector3();
const tFoot = new THREE.Vector3();
const RAD = Math.PI / 180;

/** local-space limb direction helper: hinge about local X (flex) then local Z (abduct) */
function limbDir(flex: number, abd: number, side: number, out: THREE.Vector3) {
  out.set(0, -1, 0);
  if (flex) out.applyAxisAngle(AX, -flex * RAD);
  if (abd) out.applyAxisAngle(AZ, abd * RAD * side);
  return out;
}

/** axis = local X made perpendicular to dir */
function hingeAxis(dir: THREE.Vector3, out: THREE.Vector3) {
  out.copy(AX).addScaledVector(dir, -AX.dot(dir));
  if (out.lengthSq() < 1e-5) out.set(0, 0, 1);
  return out.normalize();
}

export function solvePose(pose: Pose, sk: Skeleton, autoGround = true) {
  // body orientation: spin about spine, then side bend, then pitch, then turn
  qSpin.setFromAxisAngle(AY, pose.rootSpin * RAD);
  qSide.setFromAxisAngle(AZ, pose.rootSide * RAD);
  qPitch.setFromAxisAngle(AX, pose.rootPitch * RAD);
  qYaw.setFromAxisAngle(AY, pose.rootTurn * RAD);
  qBody.copy(qYaw).multiply(qPitch).multiply(qSide).multiply(qSpin);

  sk.up.set(0, 1, 0).applyQuaternion(qBody);
  sk.fwd.set(0, 0, 1).applyQuaternion(qBody);
  sk.right.set(1, 0, 0).applyQuaternion(qBody);

  sk.pelvis.set(pose.rootX, pose.rootY, pose.rootZ);

  // spine: curl bends toward the chest-facing direction, side bends laterally
  sk.spineDir.copy(sk.up);
  if (pose.spineCurl) sk.spineDir.applyAxisAngle(sk.right, pose.spineCurl * RAD);
  if (pose.spineSide) sk.spineDir.applyAxisAngle(sk.fwd, pose.spineSide * RAD).normalize();

  sk.chest.copy(sk.pelvis).addScaledVector(sk.spineDir, DIM.torso);
  sk.headPos.copy(sk.chest).addScaledVector(sk.spineDir, DIM.neck + DIM.head * 0.62);
  if (pose.headNod) sk.headPos.applyAxisAngle(sk.right, pose.headNod * 0.35 * RAD);
  if (pose.headTurn) sk.headPos.applyAxisAngle(sk.up, pose.headTurn * 0.3 * RAD);

  // contact points, used for auto-grounding
  let minY = Infinity;

  const arms: Array<{ side: number; flex: number; abd: number; elb: number; sh: THREE.Vector3; el: THREE.Vector3; wr: THREE.Vector3 }> = [
    { side: -1, flex: pose.armFlexL, abd: pose.armAbdL, elb: pose.elbowL, sh: sk.shoulderL, el: sk.elbowL, wr: sk.wristL },
    { side: 1, flex: pose.armFlexR, abd: pose.armAbdR, elb: pose.elbowR, sh: sk.shoulderR, el: sk.elbowR, wr: sk.wristR },
  ];
  const legs: Array<{ side: number; flex: number; abd: number; knee: number; foot: number; hip: THREE.Vector3; kn: THREE.Vector3; an: THREE.Vector3; toe: THREE.Vector3; fdir: THREE.Vector3; kout: THREE.Vector3 }> = [
    { side: -1, flex: pose.legFlexL, abd: pose.legAbdL, knee: pose.kneeL, foot: pose.footL, hip: sk.hipL, kn: sk.kneeL, an: sk.ankleL, toe: sk.toeL, fdir: sk.footDirL, kout: sk.kneeOutL },
    { side: 1, flex: pose.legFlexR, abd: pose.legAbdR, knee: pose.kneeR, foot: pose.footR, hip: sk.hipR, kn: sk.kneeR, an: sk.ankleR, toe: sk.toeR, fdir: sk.footDirR, kout: sk.kneeOutR },
  ];

  const build = (groundOffset: number) => {
    minY = Infinity;
    sk.pelvis.set(pose.rootX, pose.rootY + groundOffset, pose.rootZ);
    sk.chest.copy(sk.pelvis).addScaledVector(sk.spineDir, DIM.torso);
    sk.headPos.copy(sk.chest).addScaledVector(sk.spineDir, DIM.neck + DIM.head * 0.62);

    for (const a of arms) {
      a.sh.copy(sk.chest).addScaledVector(sk.right, a.side * DIM.shoulderW).addScaledVector(sk.spineDir, 0.015);
      // arm dir in body space -> world
      limbDir(a.flex, a.abd, a.side, tV);
      tV.applyQuaternion(qBody).normalize();
      a.el.copy(a.sh).addScaledVector(tV, DIM.upperArm);
      // elbow flexes toward the body's front
      hingeAxis(tV, tHinge);
      tV2.copy(tV).applyAxisAngle(tHinge, -a.elb * RAD).normalize();
      a.wr.copy(a.el).addScaledVector(tV2, DIM.foreArm);
      minY = Math.min(minY, a.wr.y);
    }

    for (const l of legs) {
      l.hip.copy(sk.pelvis).addScaledVector(sk.right, l.side * DIM.hipW);
      limbDir(l.flex, l.abd, l.side, tV);
      tV.applyQuaternion(qBody).normalize();
      l.kn.copy(l.hip).addScaledVector(tV, DIM.thigh);
      hingeAxis(tV, tHinge);
      // knee flexes toward the back of the knee
      l.kout.copy(tHinge).applyQuaternion(qBody).normalize();
      tV2.copy(tV).applyAxisAngle(tHinge, l.knee * RAD).normalize();
      l.an.copy(l.kn).addScaledVector(tV2, DIM.shin);
      // foot: perpendicular to shin, then point / flex
      tFoot.copy(sk.fwd).addScaledVector(tV2, -sk.fwd.dot(tV2));
      if (tFoot.lengthSq() < 1e-4) tFoot.copy(sk.up).addScaledVector(tV2, -sk.up.dot(tV2));
      tFoot.normalize().applyAxisAngle(tHinge, l.foot * RAD).normalize();
      l.fdir.copy(tFoot);
      l.toe.copy(l.an).addScaledVector(tFoot, DIM.foot);
      minY = Math.min(minY, l.toe.y, l.kn.y, l.an.y);
    }
    minY = Math.min(minY, sk.headPos.y - DIM.head);
  };

  build(0);
  if (autoGround) {
    const target = 0.055;
    if (minY < target - 0.001 || minY > target + 0.001) {
      build(target - minY);
    }
  }

  // effort: how much the joints are loaded (0..1) — drives muscle + glow readouts
  const load =
    (Math.abs(pose.spineCurl) / 130) * 0.5 +
    (Math.max(pose.armFlexL, pose.armFlexR) / 190) * 0.25 +
    ((pose.kneeL + pose.kneeR) / 2 / 152) * 0.15 +
    (Math.abs(pose.rootPitch - 90) < 45 ? 0.15 : 0);
  sk.effort = Math.min(1, load);
  return sk;
}

/* ================= playback ================= */
export interface PlayState { idx: number; t: number; kf: Keyframe | null; pose: Pose; loopFrac: number }

export function totalDuration(w: Workout): number {
  return w.keyframes.reduce((a, k) => a + Math.max(0.05, k.dur) + Math.max(0, k.hold), 0);
}

/** advance playback; returns the interpolated pose */
export function stepPlayback(w: Workout, st: PlayState, dt: number, out: Pose): PlayState {
  const kfs = w.keyframes;
  if (kfs.length === 0) return st;
  if (kfs.length === 1) {
    Object.assign(out, kfs[0].pose);
    st.kf = kfs[0];
    st.loopFrac = 0;
    return st;
  }
  st.t += dt;
  let guard = 0;
  while (guard++ < 400) {
    const k = kfs[st.idx];
    const dur = Math.max(0.05, k.dur);
    const hold = Math.max(0, k.hold);
    if (st.t < dur + hold) {
      st.kf = k;
      if (st.t <= dur) {
        const prev = kfs[(st.idx - 1 + kfs.length) % kfs.length];
        const e = easeFn(k.ease, st.t / dur);
        lerpPose(prev.pose, k.pose, e, out);
      } else {
        Object.assign(out, k.pose);
      }
      break;
    }
    st.t -= dur + hold;
    st.idx = (st.idx + 1) % kfs.length;
    if (st.idx === 0) (st as PlayState & { wrapped?: boolean }).wrapped = true;
  }
  const total = totalDuration(w);
  let acc = 0;
  for (let i = 0; i < st.idx; i++) acc += Math.max(0.05, kfs[i].dur) + Math.max(0, kfs[i].hold);
  st.loopFrac = total > 0 ? (acc + st.t) / total : 0;
  return st;
}
