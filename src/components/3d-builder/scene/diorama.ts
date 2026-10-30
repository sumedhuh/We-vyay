/* ============================================================
   MODULAR DIORAMA — stage geometry, themes, snapping, boundaries
   Pure environment logic. Nothing here touches the workout character.
   ============================================================ */

/** The floating stage. Top surface sits at y = 0 so the athlete's
 *  existing floor-based animation lands on it unchanged. */
export const STAGE = {
  size: 11.5,      // open diorama — the athlete should never feel boxed in
  cell: 0.75,      // snap-grid resolution, scaled with the room
  wallHeight: 3.3, // taller walls for a proper room feel
  thickness: 0.42, // slab thickness (makes it read as a floating block)
  inset: 0.6,      // how far items must stay from the edge
};

/** The athlete owns the middle of the stage — nothing may be dropped on him. */
export const CENTER_KEEP_OUT = 1.5;

export type DioramaThemeId = "bedroom" | "park" | "garage" | "rooftop";

export interface DioramaTheme {
  id: DioramaThemeId;
  name: string;
  icon: string;
  blurb: string;
  /** indoor themes get cutaway walls; outdoor themes get none at all */
  indoor: boolean;
  floor: string;
  floorAccent: string;
  floorRoughness: number;
  wall: string;
  wallTrim: string;
  sky: {
    top: string;
    horizon: string;
    bottom: string;
    sun: string;
    sunPos: [number, number, number];
    stars: boolean;
  };
  cloud: { color: string; opacity: number; count: number; speed: number };
  ambientColor: string;
  keyColor: string;
  keyIntensity: number;
  /** ── NIGHT MODE ───────────────────────────────
   *  When nightMode is on the sky dims, the sun becomes a moon, and
   *  the room's own lights switch on (lamps, screen glow, ceiling). */
  night: {
    sky: { top: string; horizon: string; bottom: string; sun: string; sunPos: [number, number, number] };
    cloud: { color: string; opacity: number };
    ambientColor: string;
    keyColor: string;
    keyIntensity: number;
    floor: string;
    wall: string;
    wallTrim: string;
    /** warm tone used by the practical room lights */
    lampColor: string;
    lampIntensity: number;
    ceilingLightColor: string;
    ceilingLightIntensity: number;
    fogNear: number;
    fogFar: number;
  };
}

/* ------------------------------------------------------------------
   THEMES — swapping one changes floor, walls and skybox only.
   Placed items and pets are stored separately, so they survive.
   ------------------------------------------------------------------ */
export const DIORAMA_THEMES: DioramaTheme[] = [
  {
    id: "bedroom",
    name: "Home Studio",
    icon: "🏠",
    blurb: "Charcoal corner, subtle violet trim, golden window light",
    indoor: true,
    floor: "#23282e",
    floorAccent: "#2a3038",
    floorRoughness: 1,
    wall: "#33373f",
    wallTrim: "#4b4457",
    sky: { top: "#5f93c8", horizon: "#e6d3ae", bottom: "#9aa4ad", sun: "#fff2c8", sunPos: [-26, 21, -30], stars: false },
    cloud: { color: "#ffffff", opacity: 0.32, count: 6, speed: 0.006 },
    ambientColor: "#e8e2d2",
    keyColor: "#ffe2b0",
    keyIntensity: 1.5,
    night: {
      sky: { top: "#060a12", horizon: "#1a2230", bottom: "#0b0f16", sun: "#e9eef7", sunPos: [22, 18, -28] },
      cloud: { color: "#8ea4c4", opacity: 0.16 },
      ambientColor: "#4a5a7c",
      keyColor: "#c9d8ee",
      keyIntensity: 0.5,
      floor: "#1a1e23",
      wall: "#23272e",
      wallTrim: "#33313d",
      lampColor: "#ffc98a",
      lampIntensity: 26,
      ceilingLightColor: "#ffe3b8",
      ceilingLightIntensity: 34,
      fogNear: 20,
      fogFar: 70,
    },
  },
  {
    id: "park",
    name: "Outdoor Park",
    icon: "🌳",
    blurb: "Dark training ground under an open sky — no walls at all",
    indoor: false,
    floor: "#22282a",
    floorAccent: "#2a3134",
    floorRoughness: 1,
    wall: "#22282a",
    wallTrim: "#3a4149",
    sky: { top: "#3f8fd6", horizon: "#cfeaf2", bottom: "#9fc0c8", sun: "#fff6d8", sunPos: [28, 24, -26], stars: false },
    cloud: { color: "#ffffff", opacity: 0.45, count: 9, speed: 0.011 },
    ambientColor: "#e2ecef",
    keyColor: "#fff3d4",
    keyIntensity: 2.4,
    night: {
      sky: { top: "#04091a", horizon: "#16223c", bottom: "#080e1c", sun: "#f2f6fb", sunPos: [-24, 20, -26] },
      cloud: { color: "#7f95b5", opacity: 0.12 },
      ambientColor: "#3d4c6b",
      keyColor: "#c4d5ee",
      keyIntensity: 0.4,
      floor: "#233a26",
      wall: "#233a26",
      wallTrim: "#1a2c1d",
      lampColor: "#ffd9a0",
      lampIntensity: 22,
      ceilingLightColor: "#ffdfae",
      ceilingLightIntensity: 28,
      fogNear: 22,
      fogFar: 78,
    },
  },
  {
    id: "garage",
    name: "Garage Gym",
    icon: "🔧",
    blurb: "Dark concrete corner, industrial walls, low warm light",
    indoor: true,
    floor: "#23262b",
    floorAccent: "#2b3037",
    floorRoughness: 1,
    wall: "#30353d",
    wallTrim: "#444a54",
    sky: { top: "#54667f", horizon: "#d8c2a4", bottom: "#6a6f75", sun: "#ffdf9e", sunPos: [-30, 13, -22], stars: false },
    cloud: { color: "#c9d3dd", opacity: 0.2, count: 5, speed: 0.005 },
    ambientColor: "#aab4bf",
    keyColor: "#ffc98a",
    keyIntensity: 1.7,
    night: {
      sky: { top: "#030713", horizon: "#131d33", bottom: "#070c17", sun: "#e6edf6", sunPos: [-26, 16, -20] },
      cloud: { color: "#7688a3", opacity: 0.1 },
      ambientColor: "#3a4459",
      keyColor: "#bfcede",
      keyIntensity: 0.45,
      floor: "#2f333b",
      wall: "#3d434e",
      wallTrim: "#282d36",
      lampColor: "#ffd39b",
      lampIntensity: 30,
      ceilingLightColor: "#ffe8c4",
      ceilingLightIntensity: 40,
      fogNear: 18,
      fogFar: 64,
    },
  },
  {
    id: "rooftop",
    name: "Rooftop Night",
    icon: "🌙",
    blurb: "Near-black platform under a slowly turning starfield",
    indoor: false,
    floor: "#1d2126",
    floorAccent: "#252b33",
    floorRoughness: 1,
    wall: "#1d2126",
    wallTrim: "#2e3340",
    sky: { top: "#060c1a", horizon: "#1d2b45", bottom: "#0a1120", sun: "#e8f0f5", sunPos: [24, 19, -30], stars: true },
    cloud: { color: "#8fa3bd", opacity: 0.14, count: 4, speed: 0.004 },
    ambientColor: "#5d6f88",
    keyColor: "#cfe0f0",
    keyIntensity: 0.95,
    night: {
      sky: { top: "#02060f", horizon: "#0f1a30", bottom: "#050a14", sun: "#f4f8ff", sunPos: [26, 21, -30] },
      cloud: { color: "#6d82a3", opacity: 0.08 },
      ambientColor: "#33415c",
      keyColor: "#d5e4f5",
      keyIntensity: 0.6,
      floor: "#1e232f",
      wall: "#1e232f",
      wallTrim: "#161a24",
      lampColor: "#9fd2ff",
      lampIntensity: 24,
      ceilingLightColor: "#cfe6ff",
      ceilingLightIntensity: 30,
      fogNear: 20,
      fogFar: 72,
    },
  },
];

export const dioramaThemeById = (id: string): DioramaTheme =>
  DIORAMA_THEMES.find((t) => t.id === id) ?? DIORAMA_THEMES[0];

export const isIndoorTheme = (id: string) => dioramaThemeById(id).indoor;

/* ------------------------------------------------------------------
   WALLPAPER LIBRARY
   These are procedural wall coverings, not external images. Each one
   has a CSS preview for the editor and a canvas-rendered 3D texture.
   ------------------------------------------------------------------ */
export type WallPattern =
  | "plaster"
  | "grid"
  | "prism"
  | "sunset"
  | "botanical"
  | "terrazzo"
  | "slats"
  | "topography";

export interface WallCovering {
  id: string;
  name: string;
  description: string;
  pattern: WallPattern;
  base: string;
  base2: string;
  accent: string;
  accent2: string;
  /** CSS used by the picker card. The 3D wall uses the same palette. */
  preview: string;
}

export const WALL_COVERINGS: WallCovering[] = [
  {
    id: "warm-plaster",
    name: "Warm Plaster",
    description: "Cream mineral finish with a soft natural grain",
    pattern: "plaster",
    base: "#eee8dc",
    base2: "#d8cfbf",
    accent: "#b7aa96",
    accent2: "#f8f4ec",
    preview: "linear-gradient(135deg,#f4f0e7,#d8cfbf)",
  },
  {
    id: "graphite-grid",
    name: "Graphite Grid",
    description: "Dark performance wall with lime micro-lines",
    pattern: "grid",
    base: "#11131a",
    base2: "#20242f",
    accent: "#c6ff2e",
    accent2: "#8b5cf6",
    preview: "linear-gradient(135deg,#11131a,#252938)",
  },
  {
    id: "violet-prism",
    name: "Violet Prism",
    description: "Premium faceted violet with electric highlights",
    pattern: "prism",
    base: "#211538",
    base2: "#4b2384",
    accent: "#a78bfa",
    accent2: "#c6ff2e",
    preview: "linear-gradient(135deg,#1d1233 0%,#6d35bc 55%,#a78bfa 100%)",
  },
  {
    id: "sunset-pulse",
    name: "Sunset Pulse",
    description: "Violet-to-orange gradient with flowing contour bands",
    pattern: "sunset",
    base: "#27143d",
    base2: "#ff4d2e",
    accent: "#ffc93c",
    accent2: "#8b5cf6",
    preview: "linear-gradient(135deg,#2d1745 0%,#8b2f75 48%,#ff4d2e 100%)",
  },
  {
    id: "night-botanical",
    name: "Night Botanical",
    description: "Deep green foliage with bright leaf accents",
    pattern: "botanical",
    base: "#0c211a",
    base2: "#183b2e",
    accent: "#77d48c",
    accent2: "#c6ff2e",
    preview: "linear-gradient(145deg,#081b15,#235b43)",
  },
  {
    id: "play-terrazzo",
    name: "Play Terrazzo",
    description: "Cream backdrop with violet, lime and orange chips",
    pattern: "terrazzo",
    base: "#f1ecdf",
    base2: "#ddd4c2",
    accent: "#8b5cf6",
    accent2: "#ff4d2e",
    preview: "linear-gradient(135deg,#f4f1e8,#ded4c1)",
  },
  {
    id: "walnut-slats",
    name: "Walnut Slats",
    description: "Acoustic timber slats on a black backing",
    pattern: "slats",
    base: "#111114",
    base2: "#4b2d1d",
    accent: "#9c653d",
    accent2: "#d49a61",
    preview: "repeating-linear-gradient(90deg,#151417 0 7px,#7a4b2c 7px 13px,#a36d42 13px 15px)",
  },
  {
    id: "midnight-topo",
    name: "Midnight Topo",
    description: "Deep navy with layered topographic contours",
    pattern: "topography",
    base: "#080d1a",
    base2: "#13213a",
    accent: "#22d3ee",
    accent2: "#8b5cf6",
    preview: "radial-gradient(circle at 30% 30%,#1b3156,#080d1a 68%)",
  },
];

export const wallCoveringById = (id: string): WallCovering =>
  WALL_COVERINGS.find((wallpaper) => wallpaper.id === id) ?? WALL_COVERINGS[0];

/* ------------------------------------------------------------------
   ACCENT LIGHTING
   Neon strips tracing the wall corners, wall edges and platform rim.
   The colour is user-selectable from the Scene panel.
   ------------------------------------------------------------------ */
export interface AccentLightColor {
  id: string;
  name: string;
  hex: string;
}

export const ACCENT_LIGHT_COLORS: AccentLightColor[] = [
  { id: "lime", name: "Neon Lime", hex: "#c6ff2e" },
  { id: "violet", name: "Electric Violet", hex: "#8b5cf6" },
  { id: "cyan", name: "Ice Cyan", hex: "#22d3ee" },
  { id: "flame", name: "Orange Red", hex: "#ff4d2e" },
  { id: "sun", name: "Sunny Yellow", hex: "#ffc93c" },
  { id: "pink", name: "Hot Pink", hex: "#ff4d94" },
  { id: "mint", name: "Fresh Mint", hex: "#3ce6a4" },
  { id: "ice", name: "Pure White", hex: "#f2f6ff" },
];

export const accentLightColorById = (id: string): AccentLightColor =>
  ACCENT_LIGHT_COLORS.find((c) => c.id === id) ?? ACCENT_LIGHT_COLORS[0];

/* ------------------------------------------------------------------
   GRID SNAPPING + BOUNDARIES
   ------------------------------------------------------------------ */

export const stageHalf = () => STAGE.size / 2;

/** nearest cell centre */
export const snapToCell = (v: number) => Math.round(v / STAGE.cell) * STAGE.cell;

/** keep a point on the platform — nothing may be dragged into the void */
export function clampToStage(x: number, z: number, inset = STAGE.inset) {
  const lim = stageHalf() - inset;
  return { x: Math.max(-lim, Math.min(lim, x)), z: Math.max(-lim, Math.min(lim, z)) };
}

/** is this point inside the athlete's keep-out circle? */
export const insideKeepOut = (x: number, z: number) => Math.hypot(x, z) < CENTER_KEEP_OUT;

/**
 * Authoritative placement resolve for any dragged floor item:
 * snap to grid → push out of the athlete's circle → clamp to the stage.
 */
export function resolveFloorPlacement(x: number, z: number) {
  let sx = snapToCell(x);
  let sz = snapToCell(z);
  if (insideKeepOut(sx, sz)) {
    const d = Math.hypot(sx, sz) || 1;
    const k = (CENTER_KEEP_OUT + STAGE.cell * 0.5) / d;
    sx = snapToCell(sx * k);
    sz = snapToCell(sz * k);
  }
  return clampToStage(sx, sz);
}

/** snap a wall-mounted height into a comfortable band */
export function clampWallHeight(y: number) {
  return Math.max(1.0, Math.min(STAGE.wallHeight - 0.7, y));
}

/* ------------------------------------------------------------------
   STAGE RAYCAST — floor plane plus the two cutaway walls
   ------------------------------------------------------------------ */

export type StageWall = "back" | "left";

export interface StageHit {
  x: number;
  y: number;
  z: number;
  surface: "floor" | "wall";
  wall?: StageWall;
  rot: number;
}

/** push a free (unsnapped) point out of the athlete circle and onto the stage */
export function resolveFloorFree(x: number, z: number) {
  let fx = x;
  let fz = z;
  const d = Math.hypot(fx, fz);
  if (d < CENTER_KEEP_OUT) {
    const k = CENTER_KEEP_OUT / (d || 1);
    fx *= k;
    fz *= k;
  }
  return clampToStage(fx, fz);
}

/**
 * Intersect a ray (origin + direction) with the diorama.
 * `preferWall` routes screens/posters to the cutaway walls,
 * everything else to the floor.
 *
 * `snap` = false gives a smooth, unsnapped position so dragging
 * follows the cursor 1:1. Snapping is applied on release instead.
 */
export function pickStage(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  preferWall: boolean,
  snap = true
): StageHit | null {
  const half = stageHalf();
  let best: { t: number; hit: StageHit } | null = null;
  const consider = (t: number, hit: StageHit) => {
    if (t <= 0.01) return;
    if (!best || t < best.t) best = { t, hit };
  };

  if (preferWall) {
    // back wall: plane z = -half, faces +Z
    if (Math.abs(dz) > 1e-6) {
      const t = (-half - oz) / dz;
      if (t > 0) {
        const x = ox + dx * t;
        const y = oy + dy * t;
        if (y >= 0 && y <= STAGE.wallHeight && Math.abs(x) <= half) {
          consider(t, { x, y: clampWallHeight(y), z: -half + 0.08, surface: "wall", wall: "back", rot: 0 });
        }
      }
    }
    // left wall: plane x = -half, faces +X
    if (Math.abs(dx) > 1e-6) {
      const t = (-half - ox) / dx;
      if (t > 0) {
        const z = oz + dz * t;
        const y = oy + dy * t;
        if (y >= 0 && y <= STAGE.wallHeight && Math.abs(z) <= half) {
          consider(t, { x: -half + 0.08, y: clampWallHeight(y), z, surface: "wall", wall: "left", rot: Math.PI / 2 });
        }
      }
    }
  }

  // floor plane y = 0
  if (Math.abs(dy) > 1e-6) {
    const t = -oy / dy;
    if (t > 0) {
      const x = ox + dx * t;
      const z = oz + dz * t;
      if (Math.abs(x) <= half && Math.abs(z) <= half) {
        const p = snap ? resolveFloorPlacement(x, z) : resolveFloorFree(x, z);
        consider(t, { x: p.x, y: 0, z: p.z, surface: "floor", rot: 0 });
      }
    }
  }

  return best ? (best as { t: number; hit: StageHit }).hit : null;
}
