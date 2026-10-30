"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Exhale Hold — for Yoga/Meditate/Breathe tasks.
 * Long-press to hold breath. Ring fills while held. Release before threshold resets.
 * On completion: dandelion seeds float away.
 */
export function ExhaleCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [seeds, setSeeds] = useState<{ id: number; x: number; delay: number; drift: number }[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdTarget = Math.max(task.target, 5); // seconds to hold

  const startHold = useCallback(() => {
    if (completed) return;
    setHolding(true);
    haptic("light");

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (100 / (holdTarget * 20)); // 50ms interval × 20 = 1 second
        if (next >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 100;
        }
        return next;
      });
    }, 50);
  }, [completed, holdTarget, completeTask, task.id]);

  const stopHold = useCallback(() => {
    setHolding(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (!completed && progress < 100) {
      haptic("light");
      setProgress(0); // Reset on release
    }
  }, [completed, progress]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100 && !completed) {
      haptic("success");
      completeTask(task.id);
    }
  }, [progress, completed, completeTask, task.id]);

  const circumference = 2 * Math.PI * 44;
  const dashOffset = circumference - (progress / 100) * circumference;

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

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{task.emoji}</span>
        <div>
          <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 capitalize">{task.label}</p>
          <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            Hold for {holdTarget}s
          </p>
        </div>
      </div>

      {/* Dandelion + Ring */}
      <motion.button
        type="button"
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        disabled={completed}
        className="relative w-full flex flex-col items-center py-4 cursor-pointer outline-none select-none"
      >
        <div className="relative w-28 h-28">
          {/* Ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="rgba(0,0,0,0.08)"
              strokeWidth="4"
            />
            <motion.circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={completed ? "#48bb78" : holding ? "#68D391" : "#9AE6B4"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                filter: holding ? "drop-shadow(0 0 6px rgba(72,187,120,0.5))" : "none",
              }}
            />
          </svg>

          {/* Center dandelion / result */}
          <div className="absolute inset-0 flex items-center justify-center">
            {!completed ? (
              <motion.div
                animate={holding ? { scale: [1, 1.05, 1] } : {}}
                transition={holding ? { repeat: Infinity, duration: 1.5 } : {}}
                className="text-4xl"
              >
                🌸
              </motion.div>
            ) : (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-xl font-black text-green-600 dark:text-green-300"
              >
                ✓
              </motion.span>
            )}
          </div>
        </div>

        {/* Seeds */}
        {seeds.map((seed) => (
          <motion.div
            key={seed.id}
            initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            animate={{
              y: 80 + Math.random() * 40,
              x: seed.x + seed.drift,
              opacity: 0,
              scale: 0.5,
              rotate: 180,
            }}
            transition={{ duration: 2, delay: seed.delay, ease: "easeOut" }}
            className="absolute text-sm"
            style={{ top: "40%" }}
          >
            🌿
          </motion.div>
        ))}

        <span className="mt-2 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">
          {completed ? "Breathe complete" : holding ? "Hold..." : "Press & hold"}
        </span>
      </motion.button>
    </motion.div>
  );
}
