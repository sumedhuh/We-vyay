import { create } from "zustand";
import {
  SCENE_KEY, clampPlacement, uid, ADS, isWallKind, WALLPAPERS,
  type Placement, type FurnishingKind, type PetKind,
  type PlacementType, type Surface, type WallSide, type ScreenConfig, type UploadedAsset,
} from "./data";

/** migrate old 2D placements to the new {x,y,z,surface} shape */
function hydrate(p: Partial<Placement>): Placement {
  const wall = isWallKind(String(p.kind));
  return {
    id: p.id ?? uid(),
    kind: String(p.kind ?? "plant"),
    type: (p.type ?? (wall ? "screen" : "furniture")) as PlacementType,
    x: p.x ?? 0,
    y: p.y ?? (wall ? 1.6 : 0),
    z: p.z ?? 2.3,
    rot: p.rot ?? (wall ? 0 : 0),
    scale: p.scale ?? 1,
    surface: p.surface ?? (wall ? "wall" : "floor"),
    wall: p.wall,
    screen: p.screen ?? (wall ? { source: "wallpaper", wallpaperId: WALLPAPERS[0].id } : undefined),
  };
}

export type PlaceMode = null | "furniture" | "pet";

export interface SceneState {
  gems: number;
  ownedFurniture: FurnishingKind[];
  ownedPets: PetKind[];
  uploadedAssets: UploadedAsset[];
  placements: Placement[];
  activeTheme: string;
  activeWorld: string;
  wallCoveringId: string;
  floorCoveringId: string;
  floorTextureUrl: string | null;
  setFloorCovering: (v: string) => void;
  setFloorTextureUrl: (v: string | null) => void;
  accentLightId: string;
  accentLightsOn: boolean;
  accentLightIntensity: number;
  styleId: string;
  setStyleId: (v: string) => void;
  // interaction
  selectedId: string | null;
  placingKind: FurnishingKind | PetKind | null;
  panelOpen: boolean;
  adIndex: number;
  toast: string;
  // floor-plan planner (top-down preview before committing)
  plannerKind: FurnishingKind | PetKind | null;
  plannerType: PlacementType | "asset";
  plannerX: number;
  plannerZ: number;
  plannerRot: number;
  plannerScale: number;
  plannerEditId: string | null;

  setPanelOpen: (v: boolean) => void;
  setSelected: (id: string | null) => void;
  startPlacing: (kind: FurnishingKind | PetKind) => void;
  cancelPlacing: () => void;
  setTheme: (id: string) => void;
  setWorld: (id: string) => void;
  setWallCovering: (id: string) => void;
  setAccentLight: (id: string) => void;
  setAccentLightsOn: (v: boolean) => void;
  setAccentLightIntensity: (v: number) => void;
  // camera auto-fit (frames the whole stage to the current screen ratio)
  autoFit: boolean;
  setAutoFit: (v: boolean) => void;
  // night mode — dims the world and switches the room lights on
  nightMode: boolean;
  setNightMode: (v: boolean) => void;
  // 3D editor
  editorOpen: boolean;
  setEditorOpen: (v: boolean) => void;
  gizmoMode: "translate" | "rotate";
  setGizmoMode: (m: "translate" | "rotate") => void;
  /** transient HTML5-drag state — only the ghost subscribes, so the canvas stays cheap */
  dragKind: string | null;
  dragType: PlacementType | "asset";
  dragSurface: Surface;
  dragWall?: WallSide;
  dragX: number;
  dragY: number;
  dragZ: number;
  dragRot: number;
  setDrag: (p: Partial<Pick<SceneState, "dragKind" | "dragType" | "dragSurface" | "dragWall" | "dragX" | "dragY" | "dragZ" | "dragRot">>) => void;
  clearDrag: () => void;
  commitDrag: () => void;
  /** live write-back from TransformControls */
  updatePlacement: (id: string, patch: Partial<Placement>) => void;
  setScreenConfig: (id: string, patch: Partial<ScreenConfig>) => void;
  buyWallItem: (kind: string, price: number) => void;
  ownedWallItems: string[];
  uploadAsset: (name: string, dataUrl: string) => void;
  placeUploadedAsset: (assetId: string) => void;
  setSelectedRotation: (rad: number) => void;
  // planner
  openPlanner: (kind: FurnishingKind | PetKind, type: PlacementType) => void;
  editInPlanner: (id: string) => void;
  setPlannerPos: (x: number, z: number) => void;
  setPlannerRot: (r: number) => void;
  setPlannerScale: (s: number) => void;
  confirmPlanner: () => void;
  cancelPlanner: () => void;

  buy: (kind: FurnishingKind | PetKind, type: "furniture" | "pet", price: number) => void;
  placeAt: (x: number, z: number) => void;
  moveSelected: (x: number, z: number) => void;
  rotateSelected: (delta: number) => void;
  scaleSelected: (delta: number) => void;
  removeSelected: () => void;
  clearAll: () => void;

  nextAd: () => void;
  rewardAd: (amount: number) => void;
  showToast: (msg: string) => void;
}

interface Persisted {
  gems: number;
  ownedFurniture: FurnishingKind[];
  ownedPets: PetKind[];
  uploadedAssets: UploadedAsset[];
  placements: Placement[];
  activeTheme: string;
  activeWorld: string;
  wallCoveringId: string;
  accentLightId: string;
  accentLightsOn: boolean;
  accentLightIntensity: number;
  styleId: string;
  floorCoveringId: string;
  floorTextureUrl: string | null;
}

// Tight corner layout: everything hugs the back wall, scaled up so the
// props read as real equipment rather than miniatures.
const defaultStationPlacements: Placement[] = [
  hydrate({ id: "p-dumbbells", kind: "dumbbells", type: "furniture", x: -1.75, y: 0, z: -2.5, rot: 0.14, scale: 1.55 }),
  hydrate({ id: "p-screen", kind: "tv", type: "furniture", x: 0.15, y: 0, z: -2.72, rot: -0.05, scale: 1.5 }),
  hydrate({ id: "p-speaker", kind: "speaker", type: "furniture", x: 2.0, y: 0, z: -2.45, rot: -0.3, scale: 1.4 }),
];

const defaultOwnedFurniture: FurnishingKind[] = ["plant", "rug", "dumbbells", "tv", "speaker", "pinetree", "leafytree", "shrub"];

/** Map legacy world ids (pre-diorama saves) onto current diorama themes. */
function migrateWorld(id: string): string {
  if (["bedroom", "park", "garage", "rooftop"].includes(id)) return id;
  if (id === "moon") return "rooftop";
  if (["forest", "river", "alpine", "meadow"].includes(id)) return "park";
  return "bedroom"; // "room" and anything unknown
}

function load(): Persisted {
  const fallback: Persisted = {
    gems: 150,
    ownedFurniture: defaultOwnedFurniture,
    ownedPets: [],
    uploadedAssets: [],
    placements: defaultStationPlacements,
    activeTheme: "neon",
    activeWorld: "bedroom",
    wallCoveringId: "graphite-grid",
    accentLightId: "lime",
    accentLightsOn: false, // no neon trim by default — the room is sunlit
    accentLightIntensity: 1,
    styleId: "photoreal",
    floorCoveringId: "theme",
    floorTextureUrl: null,
  };
  try {
    const raw = localStorage.getItem(SCENE_KEY);
    if (!raw) return fallback;
    const p = JSON.parse(raw) as Partial<Persisted>;
    const loadedPlacements = Array.isArray(p.placements) ? p.placements : [];

    // Ensure screen, dumbbells, and speakers exist beside each other
    let finalPlacements = loadedPlacements.length === 0 ? defaultStationPlacements : loadedPlacements;
    const hasScreen = finalPlacements.some((item) => item.kind === "tv" || item.type === "screen");
    const hasDumbbells = finalPlacements.some((item) => item.kind === "dumbbells" || item.kind === "rack");
    const hasSpeaker = finalPlacements.some((item) => item.kind === "speaker");

    if (!hasScreen || !hasDumbbells || !hasSpeaker) {
      const missing: Placement[] = [];
      if (!hasDumbbells) missing.push(defaultStationPlacements[0]);
      if (!hasScreen) missing.push(defaultStationPlacements[1]);
      if (!hasSpeaker) missing.push(defaultStationPlacements[2]);
      finalPlacements = [...finalPlacements, ...missing];
    }

    const existingOwned = Array.isArray(p.ownedFurniture) ? p.ownedFurniture : [];
    const mergedOwned = Array.from(new Set([...existingOwned, ...defaultOwnedFurniture])) as FurnishingKind[];

    return {
      gems: typeof p.gems === "number" ? p.gems : fallback.gems,
      ownedFurniture: mergedOwned,
      ownedPets: Array.isArray(p.ownedPets) ? p.ownedPets : [],
      uploadedAssets: Array.isArray(p.uploadedAssets) ? p.uploadedAssets as UploadedAsset[] : [],
      placements: finalPlacements,
      activeTheme: typeof p.activeTheme === "string" ? p.activeTheme : fallback.activeTheme,
      activeWorld: migrateWorld(typeof p.activeWorld === "string" ? p.activeWorld : fallback.activeWorld),
      wallCoveringId: typeof p.wallCoveringId === "string" ? p.wallCoveringId : fallback.wallCoveringId,
      floorCoveringId: typeof p.floorCoveringId === "string" ? p.floorCoveringId : fallback.floorCoveringId,
      floorTextureUrl: typeof p.floorTextureUrl === "string" || p.floorTextureUrl === null ? p.floorTextureUrl ?? null : fallback.floorTextureUrl,
      accentLightId: typeof p.accentLightId === "string" ? p.accentLightId : fallback.accentLightId,
      accentLightsOn: typeof p.accentLightsOn === "boolean" ? p.accentLightsOn : fallback.accentLightsOn,
      accentLightIntensity: typeof p.accentLightIntensity === "number" ? p.accentLightIntensity : fallback.accentLightIntensity,
      styleId: typeof p.styleId === "string" ? p.styleId : fallback.styleId,
    };
  } catch {
    return fallback;
  }
}

function persist(s: SceneState) {
  try {
    const data: Persisted = {
      gems: s.gems,
      ownedFurniture: s.ownedFurniture,
      ownedPets: s.ownedPets,
      uploadedAssets: s.uploadedAssets,
      placements: s.placements,
      activeTheme: s.activeTheme,
      activeWorld: s.activeWorld,
      wallCoveringId: s.wallCoveringId,
      floorCoveringId: s.floorCoveringId,
      floorTextureUrl: s.floorTextureUrl,
      accentLightId: s.accentLightId,
      accentLightsOn: s.accentLightsOn,
      accentLightIntensity: s.accentLightIntensity,
      styleId: s.styleId,
    };
    localStorage.setItem(SCENE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

const initial = load();
const initialPlacements = initial.placements.map(hydrate);
const initialWallItems = initialPlacements.filter((p) => p.type === "screen").map((p) => p.kind);

export const useSceneStore = create<SceneState>((set, get) => ({
  gems: initial.gems,
  ownedFurniture: initial.ownedFurniture,
  ownedPets: initial.ownedPets,
  uploadedAssets: initial.uploadedAssets,
  ownedWallItems: initialWallItems.length ? Array.from(new Set(initialWallItems)) : ["tvscreen", "poster"],
  placements: initialPlacements,
  activeTheme: initial.activeTheme,
  activeWorld: initial.activeWorld,
  wallCoveringId: initial.wallCoveringId,
  floorCoveringId: initial.floorCoveringId,
  floorTextureUrl: initial.floorTextureUrl,
  setFloorCovering: (v) =>
    set((s) => {
      const next = { ...s, floorCoveringId: v, ...(v !== "upload" ? { floorTextureUrl: null } : {}) };
      persist(next);
      return { floorCoveringId: v, ...(v !== "upload" ? { floorTextureUrl: null } : {}) };
    }),
  setFloorTextureUrl: (v) =>
    set((s) => {
      const next = { ...s, floorTextureUrl: v, ...(v ? { floorCoveringId: "upload" } : {}) };
      persist(next);
      return { floorTextureUrl: v, ...(v ? { floorCoveringId: "upload" } : {}) };
    }),
  accentLightId: initial.accentLightId,
  accentLightsOn: initial.accentLightsOn,
  accentLightIntensity: initial.accentLightIntensity,
  styleId: initial.styleId,
  selectedId: null,
  placingKind: null,
  panelOpen: false,
  autoFit: false,
  setAutoFit: (v) => set({ autoFit: v }),
  nightMode: false,
  setNightMode: (v) => set({ nightMode: v }),
  editorOpen: false,
  gizmoMode: "translate",
  dragKind: null,
  dragType: "furniture",
  dragSurface: "floor",
  dragX: 0,
  dragY: 0,
  dragZ: 2.3,
  dragRot: 0,
  adIndex: 0,
  toast: "",
  plannerKind: null,
  plannerType: "furniture",
  plannerX: 0,
  plannerZ: 2.3,
  plannerRot: 0,
  plannerScale: 1,
  plannerEditId: null,

  setPanelOpen: (v) => set({ panelOpen: v, ...(v ? {} : { selectedId: null, placingKind: null, plannerKind: null, plannerEditId: null }) }),
  setSelected: (id) => set({ selectedId: id, placingKind: null }),
  startPlacing: (kind) => set({ placingKind: kind, selectedId: null, toast: "Tap the floor to place it" }),
  cancelPlacing: () => set({ placingKind: null }),

  /* ---------- floor-plan planner ---------- */
  openPlanner: (kind, type: PlacementType) => {
    // drop the new item in a free-ish spot to the front-right of the athlete
    const s = get();
    let x = 1.9, z = 1.9;
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2 + 0.6;
      const cx = Math.cos(a) * 2.6;
      const cz = Math.sin(a) * 2.6;
      const clash = s.placements.some((p) => Math.hypot(p.x - cx, p.z - cz) < 0.95);
      if (!clash) { x = cx; z = cz; break; }
    }
    set({ plannerKind: kind, plannerType: type, plannerX: x, plannerZ: z, plannerRot: 0, plannerScale: 1, plannerEditId: null, selectedId: null, placingKind: null });
  },

  editInPlanner: (id) => {
    const s = get();
    const p = s.placements.find((q) => q.id === id);
    if (!p) return;
    set({
      plannerKind: p.kind as FurnishingKind, plannerType: p.type, plannerX: p.x, plannerZ: p.z,
      plannerRot: p.rot, plannerScale: p.scale, plannerEditId: p.id, selectedId: null, placingKind: null,
    });
  },

  setPlannerPos: (x, z) => {
    const c = clampPlacement(x, z);
    set({ plannerX: c.x, plannerZ: c.z });
  },
  setPlannerRot: (r) => set({ plannerRot: r }),
  setPlannerScale: (v) => set({ plannerScale: Math.max(0.6, Math.min(1.8, +v.toFixed(2))) }),

  /* ---------- 3D editor ---------- */
  setEditorOpen: (v) => set({ editorOpen: v, ...(v ? { panelOpen: false } : { selectedId: null, dragKind: null }) }),
  setGizmoMode: (m) => set({ gizmoMode: m }),

  setDrag: (p) => set(p as Partial<SceneState>),
  clearDrag: () => set({ dragKind: null }),

  commitDrag: () => {
    const s = get();
    if (!s.dragKind) return;
    if (s.placements.length >= 24) {
      set({ toast: "Room is full — remove something first", dragKind: null });
      return;
    }
    const np = hydrate({
      id: uid(),
      kind: s.dragKind,
      type: s.dragType,
      x: s.dragX, y: s.dragY, z: s.dragZ,
      rot: s.dragRot, scale: 1,
      surface: s.dragSurface, wall: s.dragWall,
      screen: s.dragType === "screen" ? { source: "wallpaper", wallpaperId: WALLPAPERS[0].id } : undefined,
    });
    set({ placements: [...s.placements, np], dragKind: null, selectedId: np.id, toast: "Placed!" });
    persist({ ...s, placements: [...s.placements, np] });
  },

  updatePlacement: (id, patch) => {
    const s = get();
    const placements = s.placements.map((p) => (p.id === id ? { ...p, ...patch } : p));
    set({ placements });
    persist({ ...s, placements });
  },

  setScreenConfig: (id, patch) => {
    const s = get();
    const placements = s.placements.map((p) =>
      p.id === id ? { ...p, screen: { ...(p.screen ?? { source: "wallpaper" as const }), ...patch } } : p
    );
    set({ placements });
    persist({ ...s, placements });
  },

  buyWallItem: (kind, price) => {
    const s = get();
    if (s.ownedWallItems.includes(kind)) return;
    if (s.gems < price) {
      set({ toast: `Need ${price - s.gems} more gems` });
      return;
    }
    const ownedWallItems = [...s.ownedWallItems, kind];
    set({ gems: s.gems - price, ownedWallItems, toast: "Unlocked! Drag it onto a wall" });
    persist({ ...s, gems: s.gems - price, ownedWallItems });
  },

  uploadAsset: (name, dataUrl) => {
    const s = get();
    const asset: UploadedAsset = {
      id: uid("asset"),
      name: name.replace(/\.(glb|gltf)$/i, "") || "Custom Object",
      emoji: "📦",
      dataUrl,
      uploadedAt: Date.now(),
    };
    const uploadedAssets = [asset, ...s.uploadedAssets];
    set({ uploadedAssets, toast: "3D object uploaded — drag it into the world" });
    persist({ ...s, uploadedAssets });
  },

  placeUploadedAsset: (assetId) => {
    const s = get();
    const asset = s.uploadedAssets.find((a) => a.id === assetId);
    if (!asset) return;
    set({
      dragKind: assetId,
      dragType: "asset",
      dragSurface: "floor",
      dragX: 2.2,
      dragY: 0,
      dragZ: 2.2,
      dragRot: 0,
      toast: "Drag into the world to place your model",
    });
  },

  setSelectedRotation: (rad) => {
    const s = get();
    if (!s.selectedId) return;
    const placements = s.placements.map((p) => (p.id === s.selectedId ? { ...p, rot: rad } : p));
    set({ placements });
    persist({ ...s, placements });
  },

  confirmPlanner: () => {
    const s = get();
    if (!s.plannerKind) return;
    const c = clampPlacement(s.plannerX, s.plannerZ);
    let placements: Placement[];
    if (s.plannerEditId) {
      placements = s.placements.map((p) =>
        p.id === s.plannerEditId ? { ...p, x: c.x, z: c.z, rot: s.plannerRot, scale: s.plannerScale } : p
      );
    } else {
      if (s.placements.length >= 18) {
        set({ toast: "Scene is full — remove something first", plannerKind: null });
        return;
      }
      placements = [...s.placements, hydrate({
        id: uid(), kind: s.plannerKind, type: s.plannerType,
        x: c.x, z: c.z, rot: s.plannerRot, scale: s.plannerScale,
      })];
    }
    set({ placements, plannerKind: null, plannerEditId: null, toast: s.plannerEditId ? "Updated!" : "Added to your space!" });
    persist({ ...s, placements });
  },

  cancelPlanner: () => set({ plannerKind: null, plannerEditId: null }),
  setTheme: (id) =>
    set((s) => {
      const next = { ...s, activeTheme: id };
      persist(next);
      return { activeTheme: id };
    }),
  setWorld: (id) =>
    set((s) => {
      const next = { ...s, activeWorld: id, selectedId: null, dragKind: null };
      persist(next);
      return { activeWorld: id, selectedId: null, dragKind: null };
    }),
  setWallCovering: (id) =>
    set((s) => {
      const next = { ...s, wallCoveringId: id };
      persist(next);
      return { wallCoveringId: id };
    }),

  setAccentLight: (id) =>
    set((s) => {
      const next = { ...s, accentLightId: id, accentLightsOn: true };
      persist(next);
      return { accentLightId: id, accentLightsOn: true };
    }),

  setAccentLightsOn: (v) =>
    set((s) => {
      const next = { ...s, accentLightsOn: v };
      persist(next);
      return { accentLightsOn: v };
    }),

  setAccentLightIntensity: (v) =>
    set((s) => {
      const clamped = Math.max(0.2, Math.min(2, +v.toFixed(2)));
      const next = { ...s, accentLightIntensity: clamped };
      persist(next);
      return { accentLightIntensity: clamped };
    }),

  setStyleId: (v) =>
    set((s) => {
      const next = { ...s, styleId: v };
      persist(next);
      return { styleId: v };
    }),

  buy: (kind, type, price) => {
    const s = get();
    if (s.gems < price) {
      set({ toast: `Not enough gems — need ${price - s.gems} more` });
      return;
    }
    const ownedFurniture = type === "furniture" && !s.ownedFurniture.includes(kind as FurnishingKind)
      ? [...s.ownedFurniture, kind as FurnishingKind] : s.ownedFurniture;
    const ownedPets = type === "pet" && !s.ownedPets.includes(kind as PetKind)
      ? [...s.ownedPets, kind as PetKind] : s.ownedPets;
    set({ gems: s.gems - price, ownedFurniture, ownedPets, placingKind: kind, toast: "Unlocked! Tap the floor to place it" });
    persist({ ...s, gems: s.gems - price, ownedFurniture, ownedPets });
  },

  placeAt: (x, z) => {
    const s = get();
    const kind = s.placingKind;
    if (!kind) return;
    if (s.placements.length >= 18) {
      set({ toast: "Scene is full — remove something first", placingKind: null });
      return;
    }
    const pos = clampPlacement(x, z);
    const type: Placement["type"] = s.ownedPets.includes(kind as PetKind) && ["dog", "cat", "bird", "robot", "dragon"].includes(kind)
      ? "pet" : "furniture";
    const p: Placement = hydrate({ id: uid(), kind, type, x: pos.x, z: pos.z, rot: 0, scale: 1 });
    set({ placements: [...s.placements, p], placingKind: null, selectedId: p.id, toast: "Placed! Drag it to move" });
    persist({ ...s, placements: [...s.placements, p] });
  },

  moveSelected: (x, z) => {
    const s = get();
    const pos = clampPlacement(x, z);
    const placements = s.placements.map((p) => (p.id === s.selectedId ? { ...p, x: pos.x, z: pos.z } : p));
    set({ placements });
    persist({ ...s, placements });
  },

  rotateSelected: (delta) => {
    const s = get();
    const placements = s.placements.map((p) => (p.id === s.selectedId ? { ...p, rot: p.rot + delta } : p));
    set({ placements });
    persist({ ...s, placements });
  },

  scaleSelected: (delta) => {
    const s = get();
    const placements = s.placements.map((p) =>
      p.id === s.selectedId ? { ...p, scale: Math.max(0.6, Math.min(1.8, +(p.scale + delta).toFixed(2))) } : p
    );
    set({ placements });
    persist({ ...s, placements });
  },

  removeSelected: () => {
    const s = get();
    const placements = s.placements.filter((p) => p.id !== s.selectedId);
    set({ placements, selectedId: null, toast: "Removed" });
    persist({ ...s, placements });
  },

  clearAll: () => {
    const s = get();
    set({ placements: [], selectedId: null, toast: "Scene cleared" });
    persist({ ...s, placements: [] });
  },

  nextAd: () => set((s) => ({ adIndex: (s.adIndex + 1) % ADS.length })),
  rewardAd: (amount) => {
    const s = get();
    set({ gems: s.gems + amount, toast: `+${amount} gems earned!` });
    persist({ ...s, gems: s.gems + amount });
  },
  showToast: (msg) => set({ toast: msg }),
}));
