"use client";

import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { VIBE_AXES, DEFAULT_VIBES, type Vibes } from "@/db/schema";
import { cn } from "@/lib/utils";

const LABELS: Record<string, string> = {
  cardio: "Cardio",
  strength: "Strength",
  mobility: "Mobility",
  intensity: "Intensity",
  endurance: "Endurance",
};

/** Human-readable headline for the dominant axis. */
export function vibeSummary(vibes: Vibes | null | undefined): {
  label: string;
  axis: string;
} {
  const v = { ...DEFAULT_VIBES, ...(vibes ?? {}) };
  let axis: string = VIBE_AXES[0];
  let best = -1;
  for (const a of VIBE_AXES) {
    if (v[a] > best) {
      best = v[a];
      axis = a;
    }
  }
  const intensity = v.intensity;
  const tone =
    best >= 80 ? "Heavy" : best >= 60 ? "Solid" : best >= 40 ? "Balanced" : "Easy";

  const named: Record<string, string> = {
    cardio: "Cardio",
    strength: "Strength",
    mobility: "Mobility & flow",
    intensity: "All-out effort",
    endurance: "Endurance",
  };

  return {
    label: intensity >= 85 ? `Max intensity · ${named[axis]}` : `${tone} ${named[axis].toLowerCase()}`,
    axis,
  };
}

/**
 * Radar (spider) chart over the 5 vibe axes.
 * Geometry: axis i sits at θ = i·(2π/5) − π/2 (so axis 0 points straight up).
 * A value v∈[0,100] maps to radius r = (v/100)·R, and the point is
 * (cx + r·cosθ, cy + r·sinθ). The filled polygon is those 5 points joined.
 */
export const VibeChart = memo(function VibeChart({
  vibes,
  size = 208,
  className,
}: {
  vibes: Vibes | null | undefined;
  size?: number;
  className?: string;
}) {
  const v = useMemo(() => ({ ...DEFAULT_VIBES, ...(vibes ?? {}) }), [vibes]);

  const { rings, spokes, polygon, dots, labels } = useMemo(() => {
    const cx = size / 2;
    const cy = size / 2;
    const R = size / 2 - 30; // leave room for the axis captions
    const step = (Math.PI * 2) / VIBE_AXES.length;

    const pointAt = (i: number, ratio: number) => {
      const t = i * step - Math.PI / 2;
      return [cx + Math.cos(t) * R * ratio, cy + Math.sin(t) * R * ratio] as const;
    };

    const ringPoly = (ratio: number) =>
      VIBE_AXES.map((_, i) => pointAt(i, ratio).join(",")).join(" ");

    return {
      rings: [0.25, 0.5, 0.75, 1].map(ringPoly),
      spokes: VIBE_AXES.map((_, i) => {
        const [x, y] = pointAt(i, 1);
        return { x1: cx, y1: cy, x2: x, y2: y };
      }),
      polygon: VIBE_AXES.map((a, i) => pointAt(i, v[a] / 100).join(",")).join(" "),
      dots: VIBE_AXES.map((a, i) => {
        const [x, y] = pointAt(i, v[a] / 100);
        return { x, y, a };
      }),
      labels: VIBE_AXES.map((a, i) => {
        const [x, y] = pointAt(i, 1.2);
        return { x, y, a };
      }),
    };
  }, [v, size]);

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className={cn("block", className)}
      role="img"
      aria-label={VIBE_AXES.map((a) => `${LABELS[a]} ${v[a]} of 100`).join(", ")}
    >
      {rings.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          className="fill-none stroke-ink/10 dark:stroke-white/12"
          strokeWidth={1}
        />
      ))}
      {spokes.map((s, i) => (
        <line
          key={i}
          {...s}
          className="stroke-ink/10 dark:stroke-white/12"
          strokeWidth={1}
        />
      ))}

      {/* the value polygon grows from the center on mount */}
      <motion.polygon
        points={polygon}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
        style={{ transformOrigin: "50% 50%" }}
        className="fill-mint-strong/35 stroke-mint-deep dark:fill-grape/35 dark:stroke-amethyst"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      {dots.map((d) => (
        <motion.circle
          key={d.a}
          cx={d.x}
          cy={d.y}
          r={3.5}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.15 }}
          style={{ transformOrigin: `${d.x}px ${d.y}px` }}
          className="fill-mint-deep dark:fill-amethyst"
        />
      ))}

      {labels.map((l) => (
        <text
          key={l.a}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-ink/55 text-[9px] font-bold dark:fill-snow/55"
          style={{ fontSize: 9, letterSpacing: "0.04em" }}
        >
          {LABELS[l.a]}
        </text>
      ))}
    </svg>
  );
});

/** Compact horizontal bars — used where a full radar is too heavy. */
export const VibeBars = memo(function VibeBars({ vibes }: { vibes: Vibes | null | undefined }) {
  const v = { ...DEFAULT_VIBES, ...(vibes ?? {}) };
  return (
    <div className="flex flex-col gap-1.5">
      {VIBE_AXES.map((a) => (
        <div key={a} className="flex items-center gap-2">
          <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/45 dark:text-snow/40">
            {LABELS[a]}
          </span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
            <motion.span
              className="block h-full rounded-full bg-gradient-to-r from-mint-strong to-mint-deep dark:from-grape dark:to-amethyst"
              initial={{ width: 0 }}
              animate={{ width: `${v[a]}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </span>
          <span className="w-6 shrink-0 text-right text-[10px] font-bold text-ink/50 dark:text-snow/45">
            {v[a]}
          </span>
        </div>
      ))}
    </div>
  );
});
