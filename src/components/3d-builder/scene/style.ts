import type { DioramaTheme } from "./diorama";

/* ============================================================
   STUDIO ART DIRECTION

   A "style" restyles the whole 3D scene — materials, shading,
   lighting balance and atmosphere — independently of the theme
   (which only changes floor/wall/wallpaper colours).

   mode:
     standard → MeshStandardMaterial, physically shaded (photoreal)
     toon     → MeshToonMaterial with a stepped gradient (stylised)
     matte    → rough, desaturated clay look
     emissive → surfaces glow, saturated, heavy atmosphere
     wire     → blueprint / technical line look
   ============================================================ */
export type SceneStyleId = "photoreal" | "toon" | "clay" | "neon" | "blueprint" | "vapor";
export type StyleMode = "standard" | "toon" | "matte" | "emissive" | "wire";

export interface SceneStyle {
  id: SceneStyleId;
  name: string;
  tagline: string;
  emoji: string;
  /** live preview swatch for the picker */
  swatch: string;
  mode: StyleMode;

  /* lighting multipliers */
  ambientMul: number;
  hemiMul: number;
  keyMul: number;

  /* atmosphere multipliers */
  fogMul: number;       // >1 pulls fog closer
  fogColor: string | null;  // null → keep theme colour

  /* material treatment */
  roughness: number;
  metalness: number;
  flatShading: boolean;
  desaturate: number;   // 0..1
  lighten: number;      // 0..1
  darken: number;       // 0..1
  tint: string | null;  // multiply colour by this
  emissiveBoost: number; // extra emissive intensity on lit materials
  hideTextures: boolean;
  toonSteps: number;
}

export const SCENE_STYLES: SceneStyle[] = [
  {
    id: "photoreal",
    name: "Photoreal",
    tagline: "Physically shaded, natural materials",
    emoji: "📷",
    swatch: "linear-gradient(135deg,#c9ccd2,#7d8590 55%,#3c4249)",
    mode: "standard",
    ambientMul: 1, hemiMul: 1, keyMul: 1,
    fogMul: 1, fogColor: null,
    roughness: 1, metalness: 1,
    flatShading: false,
    desaturate: 0, lighten: 0, darken: 0,
    tint: null, emissiveBoost: 0,
    hideTextures: false, toonSteps: 3,
  },
  {
    id: "toon",
    name: "Toon Shaded",
    tagline: "Cel-shaded, bold shapes, flat colour",
    emoji: "🎨",
    swatch: "linear-gradient(135deg,#ffd166,#f4845f 50%,#5b8e7d)",
    mode: "toon",
    ambientMul: 1.25, hemiMul: 1.2, keyMul: 1.05,
    fogMul: 1.05, fogColor: null,
    roughness: 1, metalness: 0,
    flatShading: true,
    desaturate: 0.12, lighten: 0.14, darken: 0,
    tint: null, emissiveBoost: 0,
    hideTextures: false, toonSteps: 3,
  },
  {
    id: "clay",
    name: "Soft Clay",
    tagline: "Matte sculpted clay, warm and soft",
    emoji: "🏺",
    swatch: "linear-gradient(135deg,#f4d9c6,#e0a184 55%,#a9705c)",
    mode: "matte",
    ambientMul: 1.2, hemiMul: 1.35, keyMul: 0.85,
    fogMul: 0.9, fogColor: "#efe3d8",
    roughness: 1, metalness: 0,
    flatShading: false,
    desaturate: 0.3, lighten: 0.2, darken: 0,
    tint: null, emissiveBoost: 0,
    hideTextures: false, toonSteps: 3,
  },
  {
    id: "neon",
    name: "Neon Absurd",
    tagline: "Everything glows, fully saturated",
    emoji: "🟣",
    swatch: "linear-gradient(135deg,#c6ff2e,#a855f7 55%,#ff2d95)",
    mode: "emissive",
    ambientMul: 0.6, hemiMul: 0.7, keyMul: 0.7,
    fogMul: 1.3, fogColor: "#0a0410",
    roughness: 0.2, metalness: 0.1,
    flatShading: false,
    desaturate: 0.1, lighten: 0, darken: 0.12,
    tint: null, emissiveBoost: 0.85,
    hideTextures: false, toonSteps: 3,
  },
  {
    id: "blueprint",
    name: "Blueprint",
    tagline: "Technical line look, clean and graphic",
    emoji: "📐",
    swatch: "linear-gradient(135deg,#0b2233,#1d5b7a 55%,#4fd1c5)",
    mode: "wire",
    ambientMul: 1.1, hemiMul: 1.15, keyMul: 0.9,
    fogMul: 1.15, fogColor: "#07202c",
    roughness: 1, metalness: 0,
    flatShading: false,
    desaturate: 1, lighten: 0, darken: 0.25,
    tint: "#9fe8ff", emissiveBoost: 0.15,
    hideTextures: true, toonSteps: 3,
  },
  {
    id: "vapor",
    name: "Vaporwave",
    tagline: "Magenta & cyan haze, retro glow",
    emoji: "🌆",
    swatch: "linear-gradient(135deg,#ff71ce,#01cdfe 55%,#b967ff)",
    mode: "emissive",
    ambientMul: 0.85, hemiMul: 1, keyMul: 0.9,
    fogMul: 1.45, fogColor: "#2b0f3a",
    roughness: 0.35, metalness: 0.15,
    flatShading: false,
    desaturate: 0.35, lighten: 0.05, darken: 0.05,
    tint: "#ff9be0", emissiveBoost: 0.4,
    hideTextures: false, toonSteps: 3,
  },
];

export const styleById = (id: string): SceneStyle =>
  SCENE_STYLES.find((s) => s.id === id) ?? SCENE_STYLES[0];

/* ---------------- resolved atmosphere ---------------- */

export interface ResolvedAtmosphere {
  bg: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambient: number;
  hemi: number;
  key: number;
}

/** Folds a style into the active theme + night state into concrete values. */
export function resolveAtmosphere(style: SceneStyle, theme: DioramaTheme, night: boolean): ResolvedAtmosphere {
  const sky = night ? theme.night.sky : theme.sky;
  const baseNear = night ? theme.night.fogNear : 26;
  const baseFar = night ? theme.night.fogFar : 88;

  return {
    bg: sky.top,
    fogColor: style.fogColor ?? (night ? theme.night.sky.horizon : theme.sky.horizon),
    fogNear: baseNear / style.fogMul,
    fogFar: baseFar / style.fogMul,
    ambient: 0.34 * style.ambientMul * (night ? 0.75 : 1),
    hemi: (night ? 0.34 : theme.indoor ? 0.55 : 0.95) * style.hemiMul,
    key: (night ? theme.night.keyIntensity : theme.keyIntensity) * style.keyMul,
  };
}
