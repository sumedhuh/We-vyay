"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Progress Ring — for Calories/Food/Meal tasks.
 * Animated circular progress with tap +/- to increment.
 */
export function ProgressRingCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const updateProgress = useChallengeStore((s) => s.updateProgress);
  const [value, setValue] = useState(0);
  const [completed, setCompleted] = useState(false);

  const stepSize = task.target >= 1000 ? 100 : task.target >= 100 ? 10 : 1;
  const percent = Math.min((value / task.target) * 100, 100);

  const circumference = 2 * Math.PI * 48;
  const dashOffset = circumference - (percent / 100) * circumference;

  const increment = useCallback(() => {
    if (completed) return;
    haptic("light");
    const next = Math.min(value + stepSize, task.target);
    setValue(next);
    updateProgress(task.id, next);

    if (next >= task.target) {
      haptic("success");
      completeTask(task.id);
    }
  }, [value, stepSize, task.target, completeTask, task.id, updateProgress]);

  useEffect(() => {
    if (value > 0 && value >= task.target) {
      haptic("success");
      completeTask(task.id);
    }
  }, [value, task.target, completeTask, task.id]);

  const decrement = useCallback(() => {
    if (completed) return;
    haptic("light");
    const next = Math.max(value - stepSize, 0);
    setValue(next);
    updateProgress(task.id, next);
  }, [value, stepSize, completed, task.id, updateProgress]);

  // Gradient color based on progress
  const ringColor = percent >= 100
    ? "#48BB78"
    : percent >= 66
      ? "#F6AD55"
      : percent >= 33
        ? "#FC8181"
        : "#FEB2B2";

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
            Target: {task.target} {task.unit}
          </p>
        </div>
      </div>

      {/* Ring + Controls */}
      <div className="flex items-center justify-center gap-6 py-2">
        {/* Decrement */}
        <motion.button
          type="button"
          onClick={decrement}
          disabled={completed || value <= 0}
          whileTap={{ scale: 0.85 }}
          className="w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 flex items-center justify-center cursor-pointer outline-none text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-30"
        >
          −
        </motion.button>

        {/* Ring */}
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 108 108">
            <circle
              cx="54" cy="54" r="48"
              fill="none"
              stroke="rgba(0,0,0,0.06)"
              strokeWidth="6"
            />
            <motion.circle
              cx="54" cy="54" r="48"
              fill="none"
              stroke={ringColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              style={{
                filter: completed ? "drop-shadow(0 0 8px rgba(72,187,120,0.5))" : "none",
              }}
            />
          </svg>

          {/* Center value */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              key={value}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              className="text-xl font-black text-gray-800 dark:text-gray-100 leading-none"
            >
              {value}
            </motion.span>
            <span className="text-[9px] font-semibold text-gray-500 dark:text-gray-400 uppercase">
              {task.unit}
            </span>
          </div>
        </div>

        {/* Increment */}
        <motion.button
          type="button"
          onClick={increment}
          disabled={completed}
          whileTap={{ scale: 0.85 }}
          className="w-10 h-10 rounded-full bg-white/40 dark:bg-white/10 flex items-center justify-center cursor-pointer outline-none text-lg font-bold text-gray-700 dark:text-gray-200 disabled:opacity-30"
        >
          +
        </motion.button>
      </div>

      {completed && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-[11px] font-black uppercase tracking-wider text-green-600 dark:text-green-300 mt-1"
        >
          Target reached! 🎯
        </motion.p>
      )}
    </motion.div>
  );
}
