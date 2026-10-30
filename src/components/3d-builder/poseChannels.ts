import type { Pose, PoseKey } from "./pose";

/* ================================================================== */
/*  Channel metadata — wrap / clamp / weight for every Pose property  */
/* ================================================================== */

export interface ChannelMeta {
  /** true → use shortest-path angular interpolation (−180 … 180) */
  wrap?: boolean;
  /** hard clamp limits (degrees or metres) */
  min?: number;
  max?: number;
  /** optional blend weight 0..1 (for future layered blending) */
  weight?: number;
}

/**
 * Canonical per-channel rules.
 *
 * "wrap" channels use lerpAngleDeg so the athlete never takes the
 * long way around (e.g. rootSpin going 0 → 180 → 360 instead of
 * 0 → 180 directly).
 *
 * clamp limits prevent hyper-extension and other uncanny poses
 * during blending.
 */
export const CHANNEL_META: Partial<Record<PoseKey, ChannelMeta>> = {
  // root position (metres — no wrap)
  rootX:      { min: -2.0, max: 2.0 },
  rootY:      { min: 0.02, max: 2.5 },
  rootZ:      { min: -2.0, max: 2.0 },

  // root orientation (degrees — wrap)
  rootPitch:  { wrap: true, min: -70, max: 220 },
  rootSpin:   { wrap: true, min: -180, max: 180 },
  rootSide:   { wrap: true, min: -45, max: 45 },
  rootTurn:   { wrap: true, min: -180, max: 180 },

  // spine
  spineCurl:  { wrap: true, min: -70, max: 130 },
  spineSide:  { wrap: true, min: -45, max: 45 },
  headNod:    { wrap: true, min: -55, max: 65 },
  headTurn:   { wrap: true, min: -75, max: 75 },

  // arms
  armFlexL:   { wrap: true, min: -75, max: 190 },
  armFlexR:   { wrap: true, min: -75, max: 190 },
  armAbdL:    { wrap: true, min: 0, max: 125 },
  armAbdR:    { wrap: true, min: 0, max: 125 },
  elbowL:     { min: 0, max: 158 },     // elbows don't wrap
  elbowR:     { min: 0, max: 158 },

  // legs
  legFlexL:   { wrap: true, min: -60, max: 145 },
  legFlexR:   { wrap: true, min: -60, max: 145 },
  legAbdL:    { min: 0, max: 65 },
  legAbdR:    { min: 0, max: 65 },
  kneeL:      { min: 0, max: 152 },
  kneeR:      { min: 0, max: 152 },
  footL:      { wrap: true, min: -55, max: 70 },
  footR:      { wrap: true, min: -55, max: 70 },

  // face (percentage 0..100 — no wrap)
  eyeSquint:  { min: 0, max: 100 },
  browLift:   { min: 0, max: 100 },
  jawOpen:    { min: 0, max: 100 },
  lipPurse:   { min: 0, max: 100 },
  cheekSuck:  { min: 0, max: 100 },
  cheekLift:  { min: 0, max: 100 },
  smile:      { min: 0, max: 100 },
};

/* ================================================================== */
/*  Angle-aware math                                                   */
/* ================================================================== */

/** Normalise any angle to the range −180 … +180 */
export function normalizeDeg180(a: number): number {
  return ((a + 180) % 360 + 360) % 360 - 180;
}

/** Shortest-path linear interpolation for degrees */
export function lerpAngleDeg(a: number, b: number, t: number): number {
  const na = normalizeDeg180(a);
  const nb = normalizeDeg180(b);
  const d = normalizeDeg180(nb - na);
  return normalizeDeg180(na + d * t);
}

/* ================================================================== */
/*  Easing curves                                                      */
/* ================================================================== */

export type EasingCurve =
  | "linear"
  | "inOutCubic"
  | "inOutSine"
  | "inOutQuad"
  | "smooth";     // alias for inOutCubic

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function applyEasing(t: number, curve: EasingCurve = "smooth"): number {
  const x = Math.min(1, Math.max(0, t));
  switch (curve) {
    case "linear": return x;
    case "inOutCubic":
    case "smooth": return easeInOutCubic(x);
    case "inOutSine": return easeInOutSine(x);
    case "inOutQuad": return easeInOutQuad(x);
    default: return easeInOutCubic(x);
  }
}

/* ================================================================== */
/*  Premium lerpPose — channel-aware, wrap-safe, clamped               */
/* ================================================================== */

/**
 * Interpolates every channel of `a → b` at parameter `tLinear`,
 * applying the appropriate easing curve, angular wrapping, and
 * range clamping from CHANNEL_META.
 */
export function lerpPosePremium(
  a: Pose,
  b: Pose,
  tLinear: number,
  out: Pose,
  curve: EasingCurve = "smooth",
): Pose {
  const t = applyEasing(tLinear, curve);

  for (const k of Object.keys(a) as PoseKey[]) {
    const av = a[k], bv = b[k];
    const meta = CHANNEL_META[k];
    let v: number;

    if (meta?.wrap) {
      v = lerpAngleDeg(av, bv, t);
    } else {
      v = av + (bv - av) * t;
    }

    // hard clamp
    if (meta?.min != null) v = Math.max(meta.min, v);
    if (meta?.max != null) v = Math.min(meta.max, v);

    out[k] = v;
  }

  return out;
}

/* ================================================================== */
/*  Fixed-timestep accumulator (eliminates micro-jitter)               */
/* ================================================================== */

const SIM_HZ = 120;
export const FIXED_DT = 1 / SIM_HZ;

export interface FixedStepState {
  accumulator: number;
}

export function createFixedStep(): FixedStepState {
  return { accumulator: 0 };
}

/**
 * Accumulates raw frame delta and calls `tick(FIXED_DT)` in a
 * deterministic loop until the accumulator is drained.
 * Returns the number of ticks executed.
 */
export function advanceFixedStep(
  fs: FixedStepState,
  rawDelta: number,
  tick: (dt: number) => void,
): number {
  // cap to avoid spiral of death on tab-switch
  fs.accumulator += Math.min(rawDelta, 0.1);
  let ticks = 0;
  while (fs.accumulator >= FIXED_DT) {
    tick(FIXED_DT);
    fs.accumulator -= FIXED_DT;
    ticks++;
    if (ticks > 20) break; // safety valve
  }
  return ticks;
}
