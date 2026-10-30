"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock3, Gauge } from "lucide-react";
import { VIBE_AXES, type Vibes, type VibeAxis } from "@/db/schema";
import { VibeChart, vibeSummary } from "@/components/feed/vibe-chart";

const LABELS: Record<VibeAxis, string> = {
  cardio: "Cardio",
  strength: "Strength",
  mobility: "Mobility",
  intensity: "Intensity",
  endurance: "Endurance",
};

/**
 * Read-only: the workout's vibe is DERIVED from the exercises on the canvas,
 * weighted by the volume the creator picked for each one. Change a move's
 * sets/reps and this repaints instantly.
 */
export const ComputedVibePanel = memo(function ComputedVibePanel({
  vibes,
  moveCount,
  estMinutes,
}: {
  vibes: Vibes;
  moveCount: number;
  estMinutes: number;
}) {
  const summary = vibeSummary(vibes);
  const empty = moveCount === 0;

  return (
    <div className="surface-solid shadow-soft rounded-[1.6rem] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            workout vibe
          </p>
          <p className="mt-0.5 text-[13px] font-bold text-ink dark:text-snow">
            {empty ? "Add a move to begin" : summary.label}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-[10.5px] text-ink/45 dark:text-snow/40">
            <Sparkles className="size-3" aria-hidden />
            auto-calculated from your moves
          </p>

          <div className="mt-2 flex flex-wrap gap-1.5">
            <span className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[10px] font-bold text-ink/60 dark:bg-white/[0.07] dark:text-snow/55">
              <Gauge className="size-3" aria-hidden /> {moveCount} moves
            </span>
            <span className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2.5 py-1 text-[10px] font-bold text-ink/60 dark:bg-white/[0.07] dark:text-snow/55">
              <Clock3 className="size-3" aria-hidden /> ≈{estMinutes} min
            </span>
          </div>
        </div>

        <motion.div layout className="shrink-0" style={{ opacity: empty ? 0.35 : 1 }}>
          <VibeChart vibes={vibes} size={124} className="w-[124px]" />
        </motion.div>
      </div>

      {/* per-axis readout */}
      <div className="mt-3 flex flex-col gap-1.5">
        {VIBE_AXES.map((axis) => (
          <div key={axis} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[10px] font-bold uppercase tracking-[0.1em] text-ink/45 dark:text-snow/40">
              {LABELS[axis]}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
              <motion.span
                className="block h-full rounded-full bg-gradient-to-r from-mint-strong to-mint-deep dark:from-grape dark:to-amethyst"
                initial={false}
                animate={{ width: `${empty ? 0 : vibes[axis]}%` }}
                transition={{ type: "spring", stiffness: 160, damping: 26 }}
              />
            </span>
            <span className="w-6 shrink-0 text-right text-[10px] font-bold tabular-nums text-ink/50 dark:text-snow/45">
              {empty ? "–" : vibes[axis]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
