/* ============================================================
   Scene / Environment — furniture marketplace, pets, themes, ads
   ============================================================ */

export type FurnishingKind =
  | "plant" | "sofa" | "bench" | "rack" | "lamp" | "tv"
  | "rug" | "locker" | "cooler" | "speaker" | "mirror" | "fan"
  | "ballrack" | "table" | "dumbbells"
  | "pinetree" | "leafytree" | "shrub";

export interface FurnitureDef {
  kind: FurnishingKind;
  name: string;
  emoji: string;
  price: number;
  blurb: string;
  /** default accent colour used by the mesh */
  color: string;
}

export const FURNITURE: FurnitureDef[] = [
  { kind: "plant", name: "Monstera Plant", emoji: "🪴", price: 25, blurb: "Fresh air + good vibes", color: "#2fa35c" },
  { kind: "rug", name: "Studio Rug", emoji: "🟫", price: 20, blurb: "Marks out your training zone", color: "#3b4a6b" },
  { kind: "bench", name: "Flat Bench", emoji: "🛏️", price: 45, blurb: "Presses, dips, step-ups", color: "#8b5cf6" },
  { kind: "rack", name: "Dumbbell Rack", emoji: "🗄️", price: 70, blurb: "Keeps weights off the floor", color: "#64748b" },
  { kind: "lamp", name: "Neon Floor Lamp", emoji: "🛋️", price: 55, blurb: "Adds a warm glow to the room", color: "#22d3ee" },
  { kind: "tv", name: "Wall Screen", emoji: "📺", price: 90, blurb: "Follow along with programs", color: "#0f172a" },
  { kind: "locker", name: "Storage Locker", emoji: "🚪", price: 60, blurb: "Stash your kit", color: "#475569" },
  { kind: "cooler", name: "Water Cooler", emoji: "💧", price: 35, blurb: "Hydration station", color: "#38bdf8" },
  { kind: "speaker", name: "Bass Speaker", emoji: "🔊", price: 50, blurb: "Your workout soundtrack", color: "#1e293b" },
  { kind: "mirror", name: "Studio Mirror", emoji: "🪞", price: 80, blurb: "Check your form", color: "#94a3b8" },
  { kind: "fan", name: "Standing Fan", emoji: "🌀", price: 40, blurb: "Keeps you cool mid-set", color: "#cbd5e1" },
  { kind: "ballrack", name: "Med-Ball Rack", emoji: "⚽", price: 65, blurb: "Slam balls & med balls", color: "#f97316" },
  { kind: "sofa", name: "Recovery Sofa", emoji: "🛋️", price: 110, blurb: "Cool-down corner", color: "#8d5a3b" },
  { kind: "table", name: "Side Table", emoji: "🪑", price: 30, blurb: "Towel, phone, shaker", color: "#a16207" },
  { kind: "dumbbells", name: "Pro Dumbbells", emoji: "🏋️", price: 40, blurb: "Cast-iron hex dumbbells on rubber mat", color: "#64748b" },
  { kind: "pinetree", name: "Pine Tree", emoji: "🌲", price: 30, blurb: "Tall evergreen for outdoor corners", color: "#2e6b46" },
  { kind: "leafytree", name: "Leafy Tree", emoji: "🌳", price: 35, blurb: "Broad leafy canopy, great for parks", color: "#3f8a4e" },
  { kind: "shrub", name: "Garden Shrub", emoji: "🌿", price: 20, blurb: "Round bushy shrub for edges", color: "#4c9a58" },
];

export const furnitureDef = (kind: FurnishingKind) => FURNITURE.find((f) => f.kind === kind)!;

/* ---------------- pets ---------------- */
export type PetKind = "dog" | "cat" | "bird" | "robot" | "dragon";

export interface PetDef {
  kind: PetKind;
  name: string;
  emoji: string;
  price: number;
  color: string;
  accent: string;
  cheers: string[];
}

export const PETS: PetDef[] = [
  { kind: "dog", name: "Coach Pup", emoji: "🐕", price: 80, color: "#d9a066", accent: "#d4ff3f", cheers: ["Let's go!", "One more rep!", "You got this!", "Strong work!", "Keep pushing!"] },
  { kind: "cat", name: "Zen Cat", emoji: "🐈", price: 80, color: "#8d8d99", accent: "#22d3ee", cheers: ["Breathe…", "Nice form.", "Stay steady.", "Purr-fect.", "Namaste."] },
  { kind: "bird", name: "Cheer Bird", emoji: "🐦", price: 70, color: "#38bdf8", accent: "#fbbf24", cheers: ["Tweet tweet!", "Fly high!", "So fast!", "Wow!", "Chirp chirp!"] },
  { kind: "robot", name: "Rep-Bot", emoji: "🤖", price: 120, color: "#94a3b8", accent: "#ff4d2e", cheers: ["REP COUNTED.", "EFFICIENCY 98%", "ANALYSING FORM…", "BEEP! GREAT.", "REST TIMER SET."] },
  { kind: "dragon", name: "Lil Drake", emoji: "🐉", price: 150, color: "#7c3aed", accent: "#fbbf24", cheers: ["FIRE!", "UNLEASH!", "Beast mode!", "Roar!", "Legendary!"] },
];

export const petDef = (kind: PetKind) => PETS.find((p) => p.kind === kind)!;

/* ---------------- themes ---------------- */
export interface SceneTheme {
  id: string;
  name: string;
  emoji: string;
  price: number;
  bg: string;
  fog: string;
  floor: string;
  gridCell: string;
  gridSection: string;
  mat: string;
  matEdge: string;
  rimA: string;
  rimB: string;
  rimC: string;
  skyTop: string;
  skyBottom: string;
  horizon: string;
  silhouette: string;
  sun: string;
}

export const THEMES: SceneTheme[] = [
  { id: "blank", name: "Blank", emoji: "◼", price: 0, bg: "#0b1016", fog: "#0b1016", floor: "#171b22", gridCell: "#242a34", gridSection: "#333b48", mat: "#1d222b", matEdge: "#4a5262", rimA: "#cdd3dc", rimB: "#9aa6b6", rimC: "#e9a63d", skyTop: "#0b1016", skyBottom: "#0b1016", horizon: "#0b1016", silhouette: "#0b1016", sun: "#0b1016" },
  { id: "neon", name: "Studio Neutral", emoji: "◼", price: 0, bg: "#0e1116", fog: "#0e1116", floor: "#171b22", gridCell: "#242a34", gridSection: "#333b48", mat: "#1d222b", matEdge: "#4a5262", rimA: "#cdd3dc", rimB: "#9aa6b6", rimC: "#e9a63d", skyTop: "#1b2530", skyBottom: "#66717b", horizon: "#8f9b9b", silhouette: "#273039", sun: "#d9d0b6" },
  { id: "sunrise", name: "Sunset Terrace", emoji: "◼", price: 60, bg: "#171018", fog: "#171018", floor: "#21191a", gridCell: "#36282a", gridSection: "#514044", mat: "#291f20", matEdge: "#9b6b54", rimA: "#f0c48d", rimB: "#d77d68", rimC: "#e9a63d", skyTop: "#2c3151", skyBottom: "#d27962", horizon: "#f0ad77", silhouette: "#25283a", sun: "#ffdca8" },
  { id: "zen", name: "Morning Courtyard", emoji: "◼", price: 60, bg: "#0d1513", fog: "#0d1513", floor: "#161d1a", gridCell: "#26332d", gridSection: "#3a4a40", mat: "#1b2421", matEdge: "#5c7a68", rimA: "#d9e4cf", rimB: "#8cb08a", rimC: "#e6b66a", skyTop: "#a5c5d1", skyBottom: "#e5d5a8", horizon: "#c8bb91", silhouette: "#53695e", sun: "#fff0ba" },
  { id: "ice", name: "Blue Hour", emoji: "◼", price: 90, bg: "#0b111a", fog: "#0b111a", floor: "#161d26", gridCell: "#263443", gridSection: "#3a4c60", mat: "#1b212a", matEdge: "#536f8f", rimA: "#d5dde8", rimB: "#5d9bd8", rimC: "#aab6c6", skyTop: "#152844", skyBottom: "#5f829a", horizon: "#a6b3b5", silhouette: "#1d2a38", sun: "#d8e1d9" },
  { id: "ember", name: "Desert Dawn", emoji: "◼", price: 90, bg: "#17100e", fog: "#17100e", floor: "#211817", gridCell: "#392a27", gridSection: "#51403a", mat: "#261d1b", matEdge: "#886355", rimA: "#f0ded3", rimB: "#e2705b", rimC: "#e9a63d", skyTop: "#3f2a38", skyBottom: "#d48660", horizon: "#e6bc81", silhouette: "#31272b", sun: "#ffe0a4" },
];

export const themeById = (id: string) => THEMES.find((t) => t.id === id) ?? THEMES[0];

/* ---------------- open worlds ---------------- */
export type WorldId = "room" | "forest" | "river" | "alpine" | "meadow" | "moon";

export interface WorldDef {
  id: WorldId;
  name: string;
  description: string;
  icon: string;
  skyTop: string;
  skyHorizon: string;
  ground: string;
  groundFar: string;
  fog: string;
  sun: string;
  sunPosition: [number, number, number];
  mountainNear: string;
  mountainFar: string;
  tree: string;
  trunk: string;
  water?: string;
  night?: boolean;
}

export const WORLDS: WorldDef[] = [
  { id: "room", name: "Studio Room", description: "Walls, roof and configurable screens", icon: "▣", skyTop: "#18212b", skyHorizon: "#66717b", ground: "#171b22", groundFar: "#171b22", fog: "#111820", sun: "#f1e4bd", sunPosition: [18, 16, -28], mountainNear: "#35414c", mountainFar: "#53616d", tree: "#375044", trunk: "#514438" },
  { id: "forest", name: "Deep Forest", description: "A quiet cedar clearing under morning light", icon: "♣", skyTop: "#6f9cac", skyHorizon: "#d1c99e", ground: "#28372c", groundFar: "#17281f", fog: "#8ba69a", sun: "#fff0bd", sunPosition: [-22, 18, -35], mountainNear: "#40584e", mountainFar: "#617b70", tree: "#234434", trunk: "#59483a" },
  { id: "river", name: "River Valley", description: "Train beside moving water and wide valleys", icon: "≈", skyTop: "#709fbd", skyHorizon: "#ddd4b7", ground: "#506a4b", groundFar: "#304631", fog: "#a9bdba", sun: "#fff1c7", sunPosition: [25, 17, -32], mountainNear: "#556b61", mountainFar: "#809187", tree: "#34553b", trunk: "#634d38", water: "#3e8193" },
  { id: "alpine", name: "Alpine Sunrise", description: "High mountains, cool air and first light", icon: "△", skyTop: "#526f91", skyHorizon: "#e8a47d", ground: "#4f5c48", groundFar: "#303b35", fog: "#9ca8ad", sun: "#ffd6a0", sunPosition: [-28, 13, -38], mountainNear: "#46505b", mountainFar: "#687381", tree: "#283d35", trunk: "#52443b" },
  { id: "meadow", name: "Open Meadow", description: "Soft hills beneath an endless afternoon sky", icon: "⌁", skyTop: "#78a8c9", skyHorizon: "#dce0c4", ground: "#5f7950", groundFar: "#3e5e3d", fog: "#bac9bd", sun: "#fff2bd", sunPosition: [30, 20, -26], mountainNear: "#66816b", mountainFar: "#8da28f", tree: "#426246", trunk: "#67513d" },
  { id: "moon", name: "Moonlit Ridge", description: "A calm night overlook under stars", icon: "◐", skyTop: "#07101f", skyHorizon: "#26344c", ground: "#1b2827", groundFar: "#101c20", fog: "#1d2b37", sun: "#dbe9ef", sunPosition: [23, 19, -34], mountainNear: "#18242d", mountainFar: "#293948", tree: "#132a27", trunk: "#302e2d", water: "#244f61", night: true },
];

export const worldById = (id: string) => WORLDS.find((w) => w.id === id) ?? WORLDS[0];

/* ---------------- ads ---------------- */
export interface AdDef {
  id: string;
  brand: string;
  headline: string;
  sub: string;
  cta: string;
  from: string;
  to: string;
  reward: number;
}

export const ADS: AdDef[] = [
  { id: "gems", brand: "MOTION GEMS", headline: "Double your gems", sub: "Watch a short clip, unlock new furniture", cta: "CLAIM +15", from: "#d4ff3f", to: "#22d3ee", reward: 15 },
  { id: "protein", brand: "PEAK PROTEIN", headline: "Fuel every rep", sub: "24g protein · zero added sugar", cta: "LEARN MORE", from: "#f97316", to: "#ef4444", reward: 8 },
  { id: "shoes", brand: "VELOCITY X", headline: "Grip that won't quit", sub: "Training shoes built for floor work", cta: "SHOP NOW", from: "#8b5cf6", to: "#22d3ee", reward: 8 },
  { id: "coach", brand: "PRO COACHING", headline: "1-on-1 form review", sub: "Upload a clip, get coached in 24h", cta: "TRY FREE", from: "#22d3ee", to: "#3b82f6", reward: 8 },
];

/* ---------------- placement ---------------- */
export const PET_KINDS: PetKind[] = ["dog", "cat", "bird", "robot", "dragon"];

/* ============================================================
   THE VIRTUAL BOX — room geometry
   ============================================================ */
export const ROOM = { half: 6.4, height: 4.3 };

export type PlacementType = "furniture" | "pet" | "screen";
export type Surface = "floor" | "wall";
export type WallSide = "back" | "front" | "left" | "right";

/** dynamic texture configuration for TV screens / poster boards */
export interface ScreenConfig {
  source: "wallpaper" | "upload" | "ad";
  wallpaperId?: string;
  dataUrl?: string;
  adId?: string;
}

/** custom texture set on the floor itself — id or "custom" (upload) */
export type FloorCoveringId = "theme" | "upload" | string;

export interface UploadedAsset {
  id: string;
  name: string;
  emoji: string;
  dataUrl: string;
  thumb?: string;
  uploadedAt: number;
}

export interface Placement {
  id: string;
  kind: string;
  type: PlacementType | "asset";
  /** full 3D position, saved to state */
  x: number;
  y: number;
  z: number;
  rot: number; // radians (Y axis)
  scale: number;
  surface: Surface;
  wall?: WallSide;
  screen?: ScreenConfig;
  assetId?: string;
}

/* ---------------- wall-mounted items ---------------- */
export interface WallItemDef {
  kind: string;
  name: string;
  emoji: string;
  price: number;
  blurb: string;
  width: number;
  height: number;
  frame: string;
}

export const WALL_ITEMS: WallItemDef[] = [
  { kind: "tvscreen", name: "Big Screen TV", emoji: "📺", price: 90, blurb: "Upload a photo or run ads", width: 2.0, height: 1.15, frame: "#0b0e14" },
  { kind: "poster", name: "Poster Board", emoji: "🖼️", price: 35, blurb: "Stick any image on the wall", width: 1.1, height: 1.5, frame: "#1e293b" },
  { kind: "mirrorwall", name: "Wall Mirror", emoji: "🪞", price: 80, blurb: "Check your form mid-set", width: 1.5, height: 2.0, frame: "#334155" },
];

export const wallItemDef = (kind: string) => WALL_ITEMS.find((w) => w.kind === kind);

/* ---------------- wallpapers (procedural canvas textures) ---------------- */
export interface WallpaperDef { id: string; name: string; emoji: string; from: string; to: string; accent: string }

export const WALLPAPERS: WallpaperDef[] = [
  { id: "aurora", name: "Aurora", emoji: "🌌", from: "#0b1026", to: "#1e3a5f", accent: "#22d3ee" },
  { id: "sunset", name: "Sunset", emoji: "🌇", from: "#2a1020", to: "#7a2f3f", accent: "#fb923c" },
  { id: "jungle", name: "Jungle", emoji: "🌴", from: "#06170f", to: "#14442a", accent: "#a3e635" },
  { id: "mono", name: "Mono", emoji: "⬛", from: "#101317", to: "#2b3138", accent: "#94a3b8" },
  { id: "violet", name: "Violet", emoji: "🔮", from: "#150c2a", to: "#3b1d6b", accent: "#a78bfa" },
];

export const wallpaperDef = (id?: string) => WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0];

/* ---------------- floor coverings (painterly, not GIF textures) ---------------- */
export interface FloorCovering {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  base: string;
  base2: string;
  accent: string;
  preview: string;
}

export const FLOOR_COVERINGS: FloorCovering[] = [
  { id: "slate", name: "Slate Studio", emoji: "▦", blurb: "Deep graphite grid", base: "#20252b", base2: "#2a3036", accent: "#4a5563", preview: "linear-gradient(135deg,#20252b,#2b3138)" },
  { id: "wood", name: "Oak Deck", emoji: "🪵", blurb: "Warm timber planks", base: "#5c452e", base2: "#7a5c40", accent: "#a07a52", preview: "repeating-linear-gradient(90deg,#5c452e 0 14px,#7a5c40 14px 24px,#937457 24px 26px)" },
  { id: "terrazzo-ink", name: "Ink Terrazzo", emoji: "◆", blurb: "Dark speckled stone", base: "#1b1e24", base2: "#262a31", accent: "#c6ff2e", preview: "linear-gradient(135deg,#1b1e24,#272b33)" },
  { id: "heckerboard", name: "Checker", emoji: "▣", blurb: "Classic gym checkerboard", base: "#1c2229", base2: "#30383f", accent: "#d8dde2", preview: "repeating-conic-gradient(#1c2229 0% 25%,#2b343c 0% 50%) 0 0/22px 22px" },
  { id: "sage-rubber", name: "Sage Rubber", emoji: "🟩", blurb: "Muted green rubber mat", base: "#1f2a23", base2: "#28352c", accent: "#8cb08a", preview: "linear-gradient(135deg,#1f2a23,#2c382e)" },
  { id: "violet-stone", name: "Violet Stone", emoji: "🟪", blurb: "Deep violet speckle", base: "#1d1726", base2: "#292038", accent: "#a78bfa", preview: "linear-gradient(135deg,#1d1726,#2c2240)" },
  { id: "clay-tiles", name: "Clay Tiles", emoji: "🧱", blurb: "Terracotta ceramic grid", base: "#35201b", base2: "#4a2e24", accent: "#e08b73", preview: "linear-gradient(135deg,#35201b,#4e3026)" },
];

/* ============================================================
   SURFACE PICKING — shared by drag-and-drop + TransformControls
   ============================================================ */
export interface SurfaceHit {
  x: number; y: number; z: number;
  surface: Surface;
  wall?: WallSide;
  rot: number;
  valid: boolean;
}

/** snap a floor position into the room, keeping clear of the athlete */
export function clampFloor(x: number, z: number) {
  const lim = ROOM.half - 0.55;
  const r = Math.hypot(x, z);
  if (r < MIN_RADIUS) {
    const s = MIN_RADIUS / (r || 1);
    x *= s; z *= s;
  }
  return { x: Math.max(-lim, Math.min(lim, x)), z: Math.max(-lim, Math.min(lim, z)) };
}

/** wall definition table: plane offset, inward normal, rotation so an item faces into the room */
const WALLS: Array<{ side: WallSide; axis: "x" | "z"; at: number; rot: number }> = [
  { side: "back", axis: "z", at: -ROOM.half, rot: 0 },
  { side: "front", axis: "z", at: ROOM.half, rot: Math.PI },
  { side: "left", axis: "x", at: -ROOM.half, rot: Math.PI / 2 },
  { side: "right", axis: "x", at: ROOM.half, rot: -Math.PI / 2 },
];

/** clamp a wall hit to a sensible mounted height and horizontal span */
function clampWall(side: WallSide, x: number, y: number, z: number): SurfaceHit {
  const wall = WALLS.find((w) => w.side === side)!;
  const lim = ROOM.half - 0.3;
  const top = ROOM.height - 0.55;
  const yy = Math.max(0.9, Math.min(top, y));
  if (wall.axis === "z") {
    return { x: Math.max(-lim, Math.min(lim, x)), y: yy, z: wall.at + (side === "back" ? 0.09 : -0.09), surface: "wall", wall: side, rot: wall.rot, valid: true };
  }
  return { x: wall.at + (side === "left" ? 0.09 : -0.09), y: yy, z: Math.max(-lim, Math.min(lim, z)), surface: "wall", wall: side, rot: wall.rot, valid: true };
}

/**
 * Ray→room intersection. `preferWall` routes screens/posters to walls,
 * everything else to the floor. Returns null when the ray misses the room.
 */
export function pickSurface(
  origin: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  preferWall: boolean
): SurfaceHit | null {
  const o = origin, d = dir;
  let best: { t: number; hit: SurfaceHit } | null = null;

  const consider = (t: number, hit: SurfaceHit) => {
    if (t <= 0.05) return;
    if (!best || t < best.t) best = { t, hit };
  };

  if (preferWall) {
    for (const w of WALLS) {
      // solve origin + t*dir against the wall plane
      const od = w.axis === "z" ? o.z - w.at : o.x - w.at;
      const dd = w.axis === "z" ? d.z : d.x;
      if (Math.abs(dd) < 1e-6) continue;
      const t = -od / dd;
      const px = o.x + d.x * t;
      const py = o.y + d.y * t;
      const pz = o.z + d.z * t;
      if (py < 0 || py > ROOM.height) continue;
      if (Math.abs(px) > ROOM.half || Math.abs(pz) > ROOM.half) continue;
      consider(t, clampWall(w.side, px, py, pz));
    }
  }

  if (!best && Math.abs(d.y) > 1e-6) {
    const t = -o.y / d.y;
    const px = o.x + d.x * t;
    const pz = o.z + d.z * t;
    if (Math.abs(px) <= ROOM.half && Math.abs(pz) <= ROOM.half) {
      const c = clampFloor(px, pz);
      consider(t, { x: c.x, y: 0, z: c.z, surface: "floor", rot: 0, valid: true });
    }
  }
  return best ? (best as { t: number; hit: SurfaceHit }).hit : null;
}

/** does this kind live on a wall? */
export const isWallKind = (kind: string) => WALL_ITEMS.some((w) => w.kind === kind);

// v2 — tighter diorama, sunlit room, no neon trim. Bumped so existing
// saves don't restore the old oversized stage + neon defaults.
export const SCENE_KEY = "motionlab-scene-v2";
export const MAX_PLACEMENTS = 18;
export const MIN_RADIUS = 1.45;
export const MAX_RADIUS = 6.2;

export function clampPlacement(x: number, z: number) {
  const r = Math.hypot(x, z);
  if (r < MIN_RADIUS) {
    const s = MIN_RADIUS / (r || 1);
    return { x: x * s, z: z * s };
  }
  if (r > MAX_RADIUS) {
    const s = MAX_RADIUS / r;
    return { x: x * s, z: z * s };
  }
  return { x, z };
}

export const uid = (p = "p") => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e5).toString(36)}`;
