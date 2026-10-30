"use client";

import { memo } from "react";
import { motion } from "framer-motion";

/**
 * Circular XP gauge. The math: circumference C = 2πr; we keep dasharray at
 * full C and drive progress purely through dashoffset = C·(1 − p), so the
 * SVG stroke "drains" from a complete circle down to the current ratio p.
 * Animating only the offset keeps it on the compositor — no layout work.
 */
export const XpRing = memo(function XpRing({
  level,
  progress,
  totalXp,
}: {
  level: number;
  progress: number; // 0..1 into current level
  totalXp: number;
}) {
  const r = 40;
  const C = 2 * Math.PI * r;
  const p = Math.min(1, Math.max(0, progress));

  return (
    <div className="relative flex items-center gap-4">
      <div className="relative size-[104px] shrink-0">
        <svg viewBox="0 0 104 104" className="size-full -rotate-90">
          <circle
            cx={52}
            cy={52}
            r={r}
            fill="none"
            strokeWidth={9}
            className="stroke-ink/8 dark:stroke-white/8"
          />
          <motion.circle
            cx={52}
            cy={52}
            r={r}
            fill="none"
            strokeWidth={9}
            strokeLinecap="round"
            className="stroke-mint-deep dark:stroke-amethyst"
            strokeDasharray={C}
            initial={{ strokeDashoffset: C }}
            animate={{ strokeDashoffset: C * (1 - p) }}
            transition={{ type: "spring", stiffness: 90, damping: 22 }}
            style={{ filter: "drop-shadow(0 0 6px var(--glow))" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-ink/45 dark:text-snow/45">
            lvl
          </span>
          <span className="font-display text-[30px] italic leading-none text-ink dark:text-snow">
            {level}
          </span>
        </div>
      </div>
      <div className="min-w-0">
        <p className="text-[13px] font-bold text-ink dark:text-snow">
          {Math.round(p * 100)}% to level {level + 1}
        </p>
        <p className="mt-0.5 text-xs text-ink/55 dark:text-snow/50">
          {totalXp.toLocaleString()} lifetime XP
        </p>
        <div className="mt-2 h-1.5 w-full max-w-[140px] overflow-hidden rounded-full bg-ink/8 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-mint-deep to-mint-strong dark:from-grape dark:to-amethyst"
            initial={false}
            animate={{ width: `${p * 100}%` }}
            transition={{ type: "spring", stiffness: 110, damping: 24 }}
          />
        </div>
      </div>
    </div>
  );
});
