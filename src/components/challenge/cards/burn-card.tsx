"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Burn to Ash — for Code/Work/Focus tasks.
 * Long-press to ignite. Flame spreads from center. Card turns to ash on completion.
 */
export function BurnCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const [burnProgress, setBurnProgress] = useState(0);
  const [burning, setBurning] = useState(false);
  const [ashed, setAshed] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ashes, setAshes] = useState<{ id: number; x: number; delay: number }[]>([]);

  const startBurn = useCallback(() => {
    if (ashed) return;
    setBurning(true);
    haptic("light");

    intervalRef.current = setInterval(() => {
      setBurnProgress((prev) => {
        const next = prev + 2;
        if (next % 10 === 0) haptic("light");
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          haptic("heavy");
          completeTask(task.id);
          return 100;
        }
        return next;
      });
    }, 60);
  }, [ashed, completeTask, task.id]);

  const stopBurn = useCallback(() => {
    setBurning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[1.6rem] p-4"
      style={{ background: task.color }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {task.deadline && <TimelineFuse deadline={task.deadline} />}

      {/* Flame overlay */}
      <motion.div
        className="absolute inset-0 rounded-[1.6rem] pointer-events-none mix-blend-color-burn"
        style={{
          background: `radial-gradient(circle at 50% 100%, rgba(255,60,0,${burnProgress / 100}), rgba(0,0,0,${burnProgress / 150}), transparent ${100 - burnProgress}%)`,
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{task.emoji}</span>
          <div>
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 capitalize" style={{ fontFamily: "monospace" }}>
              {task.label}
            </p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400" style={{ fontFamily: "monospace" }}>
              {task.target} {task.unit}
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono font-bold text-gray-600 dark:text-gray-300">
          {burnProgress}%
        </span>
      </div>

      {/* Interaction area */}
      <div className="relative">
        <motion.button
          type="button"
          onPointerDown={startBurn}
          onPointerUp={stopBurn}
          onPointerLeave={stopBurn}
          whileTap={{ scale: 0.97 }}
          className="w-full py-6 rounded-xl bg-gray-900/10 dark:bg-white/5 cursor-pointer outline-none flex flex-col items-center gap-2 select-none overflow-hidden relative"
        >
          {burning && (
            <motion.div 
              className="absolute inset-0 bg-gradient-to-t from-orange-600/40 via-red-500/20 to-transparent"
              animate={{ y: [20, 0, 20] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          )}
          <motion.div
            animate={burning ? { scale: [1, 1.4, 1.2], rotate: [0, 10, -10, 0] } : {}}
            transition={burning ? { repeat: Infinity, duration: 0.3 } : {}}
            className="text-4xl relative z-10"
          >
            🔥
          </motion.div>
          <span className="text-[10px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 relative z-10">
            {burning ? "INCINERATING..." : "Hold to burn"}
          </span>
        </motion.button>

      </div>
    </motion.div>
  );
}
