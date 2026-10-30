"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Footprints, Flame, Timer, Sparkles } from "lucide-react";
import { usePetStore } from "@/stores/pet-store";

/**
 * StatsChips — Horizontal scroll row of glassmorphic stat chips.
 * Inspired by the Health Snapshot reference (Image 4).
 */

type StatChip = {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  chipClass: string;
  badge?: string;
};

export function StatsChips() {
  const [hydrated, setHydrated] = useState(false);
  const xp = usePetStore((s) => s.xp);
  const pulses = usePetStore((s) => s.pulses);
  useEffect(() => setHydrated(true), []);

  // Mock fitness stats + real XP from pet store
  const stats: StatChip[] = [
    {
      id: "steps",
      label: "Steps",
      value: 5400,
      displayValue: "5,400",
      unit: "steps",
      icon: Footprints,
      chipClass: "chip-steps",
      badge: "Good",
    },
    {
      id: "calories",
      label: "Cal burnt",
      value: 312,
      displayValue: "312",
      unit: "kcal",
      icon: Flame,
      chipClass: "chip-calories",
    },
    {
      id: "active",
      label: "Active",
      value: 45,
      displayValue: "45",
      unit: "min",
      icon: Timer,
      chipClass: "chip-active",
    },
    {
      id: "xp",
      label: "XP today",
      value: hydrated ? Math.min(xp, 999) : 0,
      displayValue: hydrated ? `${Math.min(xp, 999)}` : "0",
      unit: "xp",
      icon: Sparkles,
      chipClass: "chip-xp",
    },
  ];

  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: "spring", stiffness: 400, damping: 30 }}
          className={`${stat.chipClass} relative flex-shrink-0 rounded-[1.2rem] px-3.5 py-3 min-w-[120px]`}
        >
          {/* Badge */}
          {stat.badge && (
            <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider bg-green-500/20 text-green-700 dark:bg-green-400/15 dark:text-green-300">
              {stat.badge}
            </span>
          )}

          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-white/40 dark:bg-white/10">
              <stat.icon className="size-3.5 text-gray-700 dark:text-gray-200" />
            </span>
          </div>

          <p className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">
            {stat.label}
          </p>

          <div className="flex items-baseline gap-1 mt-0.5">
            <AnimatedCounter target={stat.value} display={stat.displayValue} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Animated counting number on mount */
function AnimatedCounter({ target, display }: { target: number; display: string }) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (target === 0) {
      setDone(true);
      return;
    }

    let frame: number;
    const duration = 800; // ms
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));

      if (progress < 1) {
        frame = requestAnimationFrame(step);
      } else {
        setDone(true);
      }
    };

    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return (
    <span className="text-[18px] font-black text-gray-800 dark:text-gray-100 leading-none tabular-nums">
      {done ? display : count.toLocaleString()}
    </span>
  );
}
