"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Chisel It Out — for Gym/Workout/Lift tasks.
 * Rapid tapping chips away stone segments. Shatters to reveal glowing core.
 */
export function ChiselCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const updateProgress = useChallengeStore((s) => s.updateProgress);
  const tapTarget = Math.max(task.target, 8);
  const [taps, setTaps] = useState(0);
  const [shattered, setShattered] = useState(false);
  const [fragments, setFragments] = useState<{ id: number; x: number; y: number; r: number; s: number }[]>([]);
  const [cracks, setCracks] = useState<{ id: number; x: number; y: number; angle: number }[]>([]);

  const progress = Math.min(taps / tapTarget, 1);

  const handleTap = useCallback(() => {
    if (shattered) return;
    haptic("heavy");

    const newTaps = taps + 1;
    setTaps(newTaps);
    updateProgress(task.id, newTaps);

    // Add a crack line at random position
    if (newTaps % 3 === 0) {
      setCracks((prev) => [
        ...prev,
        {
          id: newTaps,
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
          angle: Math.random() * 180,
        },
      ]);
    }

    if (newTaps >= tapTarget) {
      haptic("success");
      completeTask(task.id);
    }
  }, [taps, tapTarget, shattered, completeTask, task.id, updateProgress]);

  useEffect(() => {
    if (taps > 0 && taps >= tapTarget) {
      haptic("success");
      completeTask(task.id);
    }
  }, [taps, tapTarget, completeTask, task.id]);

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[1.6rem] p-4"
      style={{ background: task.color }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={shattered ? { scale: [1, 1.02, 1] } : { opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {task.deadline && <TimelineFuse deadline={task.deadline} />}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{task.emoji}</span>
          <div>
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 capitalize">{task.label}</p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {taps}/{tapTarget} strikes
            </p>
          </div>
        </div>
      </div>

      {/* Stone / Interaction */}
      <motion.button
        type="button"
        onClick={handleTap}
        disabled={shattered}
        whileTap={!shattered ? { scale: 0.95 } : undefined}
        className="relative w-full h-28 rounded-2xl cursor-pointer outline-none overflow-hidden"
        style={{
          background: shattered
            ? "transparent"
            : `linear-gradient(145deg, #8E8E8E, #B8B8B8, #9A9A9A)`,
          boxShadow: shattered ? "none" : "inset 0 2px 8px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        {!shattered && (
          <>
            {/* Stone texture noise */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
              }}
            />

            {/* Crack SVG lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {cracks.map((c) => (
                <motion.line
                  key={c.id}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.6 }}
                  transition={{ duration: 0.2 }}
                  x1={`${c.x}%`}
                  y1={`${c.y}%`}
                  x2={`${c.x + 15 * Math.cos((c.angle * Math.PI) / 180)}%`}
                  y2={`${c.y + 15 * Math.sin((c.angle * Math.PI) / 180)}%`}
                  stroke="#444"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              ))}
            </svg>

            {/* Chisel icon */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
              <motion.span
                className="text-3xl"
                animate={taps > 0 ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.15 }}
                key={taps}
              >
                ⛏️
              </motion.span>
              <span className="text-[10px] font-black uppercase tracking-wider text-white/80 drop-shadow">
                Tap to chisel
              </span>
            </div>

            {/* Chip-away opacity mask */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-transparent to-transparent"
              style={{ opacity: progress * 0.5 }}
            />
          </>
        )}

        {/* Shatter fragments */}
        {shattered && (
          <>
            {fragments.map((f) => (
              <motion.div
                key={f.id}
                initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
                animate={{ x: f.x, y: f.y, rotate: f.r, scale: 0, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute left-1/2 top-1/2 rounded-sm"
                style={{
                  width: 12 * f.s,
                  height: 8 * f.s,
                  background: `linear-gradient(145deg, #8E8E8E, #B8B8B8)`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                }}
              />
            ))}

            {/* Glowing core */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-300 via-yellow-200 to-amber-400 shadow-[0_0_30px_rgba(255,200,0,0.5)] flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
            </motion.div>
          </>
        )}
      </motion.button>

      {/* Progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-gray-400/30 dark:bg-gray-600/30 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gray-600 dark:bg-gray-300"
          animate={{ width: `${progress * 100}%` }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      </div>
    </motion.div>
  );
}
