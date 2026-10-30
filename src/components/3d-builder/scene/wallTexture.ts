import * as THREE from "three";
import { wallCoveringById, type WallCovering } from "./diorama";

/* ============================================================
   WALLPAPER TEXTURE FACTORY + LUMINANCE ANALYSIS

   The wall texture and its brightness map are generated from the
   same source, so the accent lighting can react to exactly what
   is painted on the wall: bright regions glow, dark regions dim.
   ============================================================ */

const W = 1024;
const H = 512;

function fillGradient(ctx: CanvasRenderingContext2D, wall: WallCovering, w: number, h: number) {
  const fill = ctx.createLinearGradient(0, 0, w, h);
  fill.addColorStop(0, wall.base);
  fill.addColorStop(1, wall.base2);
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, w, h);
}

/** Draws the procedural covering. Returns the canvas (reused for analysis). */
export function buildWallpaperCanvas(wall: WallCovering): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const w = canvas.width;
  const h = canvas.height;
  fillGradient(ctx, wall, w, h);

  switch (wall.pattern) {
    case "plaster": {
      for (let i = 0; i < 520; i++) {
        const x = (i * 83) % w;
        const y = (i * 137) % h;
        const r = 0.7 + (i % 5) * 0.35;
        ctx.fillStyle = i % 3 === 0 ? `${wall.accent}25` : `${wall.accent2}22`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = `${wall.accent}18`;
      ctx.lineWidth = 1;
      for (let y = 22; y < h; y += 34) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.bezierCurveTo(w * 0.25, y - 5, w * 0.62, y + 7, w, y - 2);
        ctx.stroke();
      }
      break;
    }
    case "grid": {
      ctx.strokeStyle = `${wall.accent}30`;
      ctx.lineWidth = 1.5;
      for (let x = 0; x <= w; x += 64) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      for (let y = 0; y <= h; y += 64) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
      ctx.fillStyle = `${wall.accent2}88`;
      for (let x = 64; x < w; x += 128) {
        for (let y = 64; y < h; y += 128) ctx.fillRect(x - 3, y - 3, 6, 6);
      }
      break;
    }
    case "prism": {
      const cols = 8;
      const rows = 4;
      const cw = w / cols;
      const rh = h / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cw;
          const y = row * rh;
          ctx.fillStyle = (row + col) % 3 === 0 ? `${wall.accent}35` : (row + col) % 2 ? `${wall.accent2}16` : `${wall.base2}88`;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + cw, y);
          ctx.lineTo(x + cw * 0.5, y + rh);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = `${wall.accent}20`;
          ctx.stroke();
        }
      }
      break;
    }
    case "sunset": {
      for (let band = 0; band < 11; band++) {
        ctx.strokeStyle = band % 2 ? `${wall.accent}72` : `${wall.accent2}55`;
        ctx.lineWidth = 3 + (band % 3);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 12) {
          const y = 55 + band * 42 + Math.sin(x * 0.012 + band * 0.7) * (12 + band * 1.5);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      break;
    }
    case "botanical": {
      ctx.lineCap = "round";
      for (let i = 0; i < 22; i++) {
        const x = (i * 97) % w;
        const baseY = h + 25;
        const height = 150 + (i % 5) * 38;
        ctx.strokeStyle = i % 2 ? wall.accent : wall.accent2;
        ctx.globalAlpha = 0.32 + (i % 4) * 0.08;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.bezierCurveTo(x - 35, baseY - height * 0.35, x + 38, baseY - height * 0.72, x + (i % 2 ? 14 : -14), baseY - height);
        ctx.stroke();
        for (let leaf = 1; leaf < 5; leaf++) {
          ctx.save();
          ctx.translate(x + (leaf % 2 ? -18 : 18), baseY - height * (leaf / 5));
          ctx.rotate(leaf % 2 ? -0.6 : 0.6);
          ctx.fillStyle = leaf % 2 ? wall.accent : wall.accent2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 27, 10, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      break;
    }
    case "terrazzo": {
      const colors = [wall.accent, wall.accent2, "#c6ff2e", "#ffc93c", "#2b2638"];
      for (let i = 0; i < 130; i++) {
        const x = (i * 173) % w;
        const y = (i * 97) % h;
        const r = 5 + (i % 11);
        ctx.fillStyle = `${colors[i % colors.length]}bb`;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(i * 0.77);
        ctx.beginPath();
        ctx.moveTo(-r, -r * 0.3);
        ctx.lineTo(r * 0.4, -r);
        ctx.lineTo(r, r * 0.25);
        ctx.lineTo(-r * 0.2, r);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      break;
    }
    case "slats": {
      ctx.fillStyle = wall.base;
      ctx.fillRect(0, 0, w, h);
      for (let x = 7; x < w; x += 29) {
        const slat = ctx.createLinearGradient(x, 0, x + 15, 0);
        slat.addColorStop(0, wall.base2);
        slat.addColorStop(0.55, wall.accent);
        slat.addColorStop(1, wall.base2);
        ctx.fillStyle = slat;
        ctx.fillRect(x, 0, 17, h);
        ctx.fillStyle = `${wall.accent2}30`;
        ctx.fillRect(x + 2, 0, 2, h);
      }
      break;
    }
    case "topography": {
      ctx.strokeStyle = wall.accent;
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 1.8;
      for (let ring = 0; ring < 18; ring++) {
        const cx = (ring % 3) * 380 + 90;
        const cy = ((ring * 91) % h) - 20;
        const rx = 55 + ring * 13;
        const ry = 28 + ring * 7;
        ctx.beginPath();
        for (let a = 0; a <= Math.PI * 2 + 0.08; a += 0.08) {
          const wobble = Math.sin(a * 5 + ring) * 6;
          const x = cx + Math.cos(a) * (rx + wobble);
          const y = cy + Math.sin(a) * (ry + wobble * 0.55);
          if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      break;
    }
  }

  // Fine material grain so the wall never reads as flat UI art.
  ctx.globalAlpha = 0.035;
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = i % 2 ? "#ffffff" : "#000000";
    ctx.fillRect((i * 71) % w, (i * 131) % h, 1, 1);
  }
  ctx.globalAlpha = 1;

  return canvas;
}

let cached: { id: string; texture: THREE.CanvasTexture } | null = null;

export function buildWallpaperTexture(id: string): THREE.CanvasTexture {
  if (cached && cached.id === id) return cached.texture;
  cached?.texture.dispose();
  const canvas = buildWallpaperCanvas(wallCoveringById(id));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  cached = { id, texture };
  return texture;
}

/* ---------------- luminance analysis ---------------- */

export interface WallLuminance {
  avg: number;
  cols: number;
  rows: number;
  /** cells[row][col] → 0..1 relative luminance */
  cells: number[][];
}

/**
 * Reads the generated covering and returns a coarse brightness grid.
 * Used to drive the accent lights: bright wall patches light up,
 * dark patches fade the strips out.
 */
export function analyzeWallLuminance(id: string, cols = 10, rows = 5): WallLuminance {
  const canvas = buildWallpaperCanvas(wallCoveringById(id));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { avg: 0.5, cols, rows, cells: Array.from({ length: rows }, () => Array(cols).fill(0.5)) };

  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  const cells: number[][] = [];
  let total = 0;
  let count = 0;

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      let n = 0;
      const x0 = Math.floor((c / cols) * w);
      const x1 = Math.floor(((c + 1) / cols) * w);
      const y0 = Math.floor((r / rows) * h);
      const y1 = Math.floor(((r + 1) / rows) * h);
      for (let y = y0; y < y1; y += 3) {
        for (let x = x0; x < x1; x += 3) {
          const i = (y * w + x) * 4;
          sum += (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          n++;
        }
      }
      const v = n ? sum / n : 0;
      row.push(v);
      total += v;
      count++;
    }
    cells.push(row);
  }

  return { avg: count ? total / count : 0.5, cols, rows, cells };
}

/**
 * Sample the brightness map in wall-UV space.
 * u = 0..1 across the wall, v = 0 at the floor → 1 at the ceiling.
 */
export function sampleLuminance(a: WallLuminance, u: number, v: number): number {
  const c = Math.min(a.cols - 1, Math.max(0, Math.floor(u * a.cols)));
  const r = Math.min(a.rows - 1, Math.max(0, Math.floor((1 - v) * a.rows)));
  return a.cells[r][c];
}
