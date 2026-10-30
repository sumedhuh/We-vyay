/** Color helpers used to derive a full accent ramp from one user-picked hex. */

export type Hsl = { h: number; s: number; l: number };

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        h = ((g - b) / d) % 6;
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      default:
        h = (r - g) / d + 4;
    }
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, l };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let rgb: [number, number, number];
  if (h < 60) rgb = [c, x, 0];
  else if (h < 120) rgb = [x, c, 0];
  else if (h < 180) rgb = [0, c, x];
  else if (h < 240) rgb = [0, x, c];
  else if (h < 300) rgb = [x, 0, c];
  else rgb = [c, 0, x];

  return (
    "#" +
    rgb
      .map((v) =>
        Math.round((v + m) * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Shift lightness (and optionally saturation) around a base color. */
export function shade(hex: string, dl: number, ds = 0): string {
  const { h, s, l } = hexToHsl(hex);
  return hslToHex({ h, s: clamp01(s + ds), l: clamp01(l + dl) });
}

/**
 * A five-stop accent ramp derived from one base hex:
 * soft (fills) → base → strong (gradient end) → deep (text/stroke) → tint.
 */
export type AccentRamp = {
  soft: string;
  base: string;
  strong: string;
  deep: string;
  tint: string;
};

export function buildRamp(hex: string): AccentRamp {
  return {
    soft: shade(hex, 0.16, -0.05),
    base: hex,
    strong: shade(hex, -0.08, 0.04),
    deep: shade(hex, -0.24, 0.08),
    tint: shade(hex, 0.26, -0.1),
  };
}

/** Readable ink color for text sitting on top of a given background. */
export function readableInk(hex: string): string {
  const { l, s, h } = hexToHsl(hex);
  return l > 0.62 ? hslToHex({ h, s: Math.min(1, s + 0.2), l: 0.16 }) : "#ffffff";
}

/** Pet fur triple derived from one base hex. */
export function furFromHex(hex: string) {
  return {
    fill: shade(hex, 0.06),
    deep: shade(hex, -0.22, 0.06),
    belly: shade(hex, 0.3, -0.12),
  };
}
