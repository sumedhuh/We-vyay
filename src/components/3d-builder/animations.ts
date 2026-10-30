export type RigBase = "plank" | "supine";
export type ArmPose = "head" | "chest";

export interface AnimConfig {
  name: string;
  base: RigBase;
  // plank (hands-on-floor) params
  fromDepth: number; // 0 = arms locked (top), 1 = chest to floor
  toDepth: number;
  pike: number; // hips raised toward downward-dog
  handSpread: number; // multiplier on normal hand/shoulder width
  kneeDrive: number; // mountain-climber style alternating knee drive 0..1
  // supine (lying on back) params
  fromCurl: number; // torso crunch lift
  toCurl: number;
  kneeBend: number; // 0 = straight legs, 1 = feet planted close to glutes
  fromLegRaise: number;
  toLegRaise: number;
  arms: ArmPose;
}

export const DEFAULT_PLANK: AnimConfig = {
  name: "Push-Up",
  base: "plank",
  fromDepth: 0,
  toDepth: 1,
  pike: 0,
  handSpread: 1,
  kneeDrive: 0,
  fromCurl: 0,
  toCurl: 0,
  kneeBend: 1,
  fromLegRaise: 0,
  toLegRaise: 0,
  arms: "head",
};

export const PRESETS: Record<string, AnimConfig> = {
  pushup: { ...DEFAULT_PLANK },
  wide: { ...DEFAULT_PLANK, name: "Wide Push-Up", handSpread: 1.65 },
  diamond: { ...DEFAULT_PLANK, name: "Diamond Push-Up", handSpread: 0.42 },
  pike: { ...DEFAULT_PLANK, name: "Pike Press", pike: 0.62, toDepth: 0.72 },
  climbers: { ...DEFAULT_PLANK, name: "Mountain Climbers", fromDepth: 0.06, toDepth: 0.14, kneeDrive: 0.95 },
  plank: { ...DEFAULT_PLANK, name: "Plank Hold", fromDepth: 0, toDepth: 0 },
  crunch: {
    name: "Crunch",
    base: "supine",
    fromDepth: 0, toDepth: 0, pike: 0, handSpread: 1, kneeDrive: 0,
    fromCurl: 0, toCurl: 1, kneeBend: 1, fromLegRaise: 0, toLegRaise: 0, arms: "head",
  },
  situp: {
    name: "Sit-Up",
    base: "supine",
    fromDepth: 0, toDepth: 0, pike: 0, handSpread: 1, kneeDrive: 0,
    fromCurl: 0, toCurl: 1.35, kneeBend: 0.9, fromLegRaise: 0, toLegRaise: 0, arms: "chest",
  },
  legraise: {
    name: "Lying Leg Raise",
    base: "supine",
    fromDepth: 0, toDepth: 0, pike: 0, handSpread: 1, kneeDrive: 0,
    fromCurl: 0, toCurl: 0.08, kneeBend: 0, fromLegRaise: 0, toLegRaise: 1, arms: "head",
  },
  flutter: {
    name: "Crunch + Leg Raise",
    base: "supine",
    fromDepth: 0, toDepth: 0, pike: 0, handSpread: 1, kneeDrive: 0,
    fromCurl: 0, toCurl: 0.85, kneeBend: 0.15, fromLegRaise: 0.25, toLegRaise: 0.9, arms: "head",
  },
};

export type PresetId = keyof typeof PRESETS;

export const smoothstep = (x: number) => x * x * (3 - 2 * x);

/* ------------------------------------------------------------------ */
/* Custom joint-driven animation studio                                */
/* ------------------------------------------------------------------ */

export type WaveType = "sine" | "triangle" | "pulse";

export interface JointMotion {
  enabled: boolean;
  from: number;
  to: number;
  offset: number; // 0..1 phase delay within the rep cycle
  wave: WaveType;
}

export type CustomJointId =
  | "chest" | "hips" | "spread" | "kneeL" | "kneeR"
  | "curl" | "legL" | "legR" | "bridge" | "head" | "sway";

export type CustomJoints = Record<CustomJointId, JointMotion>;

export interface BreathConfig {
  enabled: boolean;
  inhaleStart: number; // 0..1 cycle fraction
  inhaleEnd: number; // 0..1 cycle fraction (exhale fills the rest)
}

export interface CustomAnim {
  id: string;
  name: string;
  base: RigBase;
  arms: ArmPose;
  kneeBend: number;
  joints: CustomJoints;
  breath: BreathConfig;
  createdAt: number;
}

export interface JointDef {
  id: CustomJointId;
  label: string;
  desc: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  bases: RigBase[];
  defaultFrom: number;
  defaultTo: number;
}

export const JOINT_DEFS: JointDef[] = [
  { id: "chest", label: "Chest Depth", desc: "Arms locked ↔ chest to floor", min: 0, max: 100, step: 1, unit: "%", bases: ["plank"], defaultFrom: 0, defaultTo: 100 },
  { id: "hips", label: "Hip Lift", desc: "Flat plank ↔ hips to sky", min: 0, max: 100, step: 1, unit: "%", bases: ["plank"], defaultFrom: 0, defaultTo: 45 },
  { id: "spread", label: "Arm Spread", desc: "Diamond narrow ↔ wide", min: 40, max: 180, step: 1, unit: "%", bases: ["plank"], defaultFrom: 70, defaultTo: 130 },
  { id: "kneeL", label: "Left Knee Tuck", desc: "Leg straight ↔ knee to chest", min: 0, max: 100, step: 1, unit: "%", bases: ["plank"], defaultFrom: 0, defaultTo: 100 },
  { id: "kneeR", label: "Right Knee Tuck", desc: "Leg straight ↔ knee to chest", min: 0, max: 100, step: 1, unit: "%", bases: ["plank"], defaultFrom: 0, defaultTo: 100 },
  { id: "curl", label: "Torso Curl", desc: "Flat back ↔ crunch / sit-up", min: 0, max: 140, step: 1, unit: "%", bases: ["supine"], defaultFrom: 0, defaultTo: 100 },
  { id: "legL", label: "Left Leg Lift", desc: "Floor ↔ straight up", min: 0, max: 100, step: 1, unit: "%", bases: ["supine"], defaultFrom: 0, defaultTo: 100 },
  { id: "legR", label: "Right Leg Lift", desc: "Floor ↔ straight up", min: 0, max: 100, step: 1, unit: "%", bases: ["supine"], defaultFrom: 0, defaultTo: 100 },
  { id: "bridge", label: "Hip Bridge", desc: "Hips down ↔ thrust up", min: 0, max: 100, step: 1, unit: "%", bases: ["supine"], defaultFrom: 0, defaultTo: 100 },
  { id: "head", label: "Head Nod", desc: "Tuck chin ↔ look up", min: -50, max: 50, step: 1, unit: "°", bases: ["plank", "supine"], defaultFrom: -15, defaultTo: 15 },
  { id: "sway", label: "Side Sway", desc: "Shift body left ↔ right", min: -100, max: 100, step: 1, unit: "%", bases: ["plank", "supine"], defaultFrom: -60, defaultTo: 60 },
];

export const jointDef = (id: CustomJointId): JointDef => JOINT_DEFS.find((d) => d.id === id)!;

const blankJoint = (): JointMotion => ({ enabled: false, from: 0, to: 0, offset: 0, wave: "sine" });

export function defaultJoints(): CustomJoints {
  const j: CustomJoints = {
    chest: blankJoint(), hips: blankJoint(), spread: blankJoint(),
    kneeL: blankJoint(), kneeR: blankJoint(), curl: blankJoint(),
    legL: blankJoint(), legR: blankJoint(), bridge: blankJoint(),
    head: blankJoint(), sway: blankJoint(),
  };
  // sensible starter: a push-up
  j.chest = { enabled: true, from: 0, to: 100, offset: 0, wave: "sine" };
  return j;
}

export const DEFAULT_BREATH: BreathConfig = { enabled: true, inhaleStart: 0, inhaleEnd: 0.5 };

export function makeCustomAnim(partial?: Partial<CustomAnim>): CustomAnim {
  return {
    id: `c${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`,
    name: "My Custom Move",
    base: "plank",
    arms: "head",
    kneeBend: 1,
    joints: defaultJoints(),
    breath: { ...DEFAULT_BREATH },
    createdAt: Date.now(),
    ...partial,
  };
}

/** envelope 0..1 for a cycle position t in 0..1 */
export function waveEnvelope(t: number, wave: WaveType): number {
  const x = ((t % 1) + 1) % 1;
  if (wave === "triangle") return 1 - Math.abs(1 - 2 * x);
  if (wave === "pulse") {
    if (x < 0.35) return smoothstep(x / 0.35);
    if (x < 0.6) return 1;
    return 1 - smoothstep((x - 0.6) / 0.4);
  }
  const raw = (1 - Math.cos(x * Math.PI * 2)) / 2;
  return raw * 0.35 + smoothstep(raw) * 0.65;
}

/** evaluate a joint's value at global cycle fraction (0..1) */
export function evalJoint(j: JointMotion, frac: number): number {
  if (!j.enabled) return j.from;
  const e = waveEnvelope(frac + j.offset, j.wave);
  return j.from + (j.to - j.from) * e;
}

/** default breath for built-in presets */
export function presetBreath(base: RigBase): BreathConfig {
  // push-ups: inhale while lowering (first half). crunches: exhale on effort (first half).
  return base === "plank"
    ? { enabled: true, inhaleStart: 0, inhaleEnd: 0.5 }
    : { enabled: true, inhaleStart: 0.5, inhaleEnd: 1 };
}

/** is the breath an inhale at cycle fraction f? handles wrap windows */
export function isInhaleAt(f: number, b: BreathConfig): boolean {
  const { inhaleStart: s, inhaleEnd: e } = b;
  if (Math.abs(e - s) < 1e-4) return true;
  if (Math.abs(e - s) > 0.999) return true;
  if (s <= e) return f >= s && f < e;
  return f >= s || f < e;
}

/** progress 0..1 within the current breath stage + length of stage */
export function breathStageProgress(f: number, b: BreathConfig): { inhale: boolean; progress: number } {
  const inhale = isInhaleAt(f, b);
  const { inhaleStart: s, inhaleEnd: e } = b;
  let start: number, len: number;
  if (inhale) {
    start = s;
    len = s <= e ? e - s : 1 - s + e;
  } else {
    start = e;
    len = s <= e ? 1 - (e - s) : s - e;
  }
  if (len < 1e-4) return { inhale, progress: 0 };
  let d = f - start;
  if (d < 0) d += 1;
  return { inhale, progress: Math.min(1, Math.max(0, d / len)) };
}
