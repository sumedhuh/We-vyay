"use client";

import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Stretch & Snap — for Run/Walk/Steps tasks.
 * User drags a ribbon downward. Past threshold → ribbon snaps with confetti.
 */
export function StretchSnapCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const [snapped, setSnapped] = useState(false);
  const [confetti, setConfetti] = useState<{ id: number; x: number; y: number; r: number; color: string }[]>([]);

  const y = useMotionValue(0);
  const ribbonScale = useTransform(y, [0, 180], [1, 1.8]);
  const ribbonOpacity = useTransform(y, [0, 140, 180], [1, 0.7, 0.3]);
  const tension = useTransform(y, [0, 180], [0, 100]);
  const pullOpacity = useTransform(y, [0, 80], [1, 0]);
  const tensionOpacity = useTransform(y, [0, 40], [0, 1]);

  const handleDragEnd = useCallback(() => {
    if (y.get() > 140) {
      haptic("heavy");
      completeTask(task.id);
    } else {
      haptic("light");
    }
  }, [y, completeTask, task.id]);

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
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{task.emoji}</span>
          <div>
            <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 capitalize">{task.label}</p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              {task.target} {task.unit}
            </p>
          </div>
        </div>
        {snapped && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 20 }}
            className="text-[11px] font-black uppercase tracking-wider text-green-600 bg-green-100 dark:bg-green-900/40 dark:text-green-300 px-3 py-1 rounded-full"
          >
            Done!
          </motion.span>
        )}
      </div>

      {/* Ribbon */}
      {!snapped ? (
        <div className="relative h-20 flex items-center justify-center">
          <div className="absolute inset-x-4 h-3 rounded-full bg-white/50 dark:bg-white/10" />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.8}
            style={{ y, scaleX: ribbonScale, opacity: ribbonOpacity }}
            onDragEnd={handleDragEnd}
            className="relative z-10 h-6 w-32 cursor-grab active:cursor-grabbing rounded-full bg-gradient-to-r from-orange-400 via-pink-400 to-red-400 shadow-lg flex items-center justify-center"
          >
            <motion.span
              className="text-[10px] font-black text-white uppercase tracking-wider"
              style={{ opacity: pullOpacity }}
            >
              Pull to snap ↓
            </motion.span>
          </motion.div>

          {/* Tension indicator */}
          <motion.div
            className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-gray-500"
            style={{ opacity: tensionOpacity }}
          >
            <motion.span>{tension}</motion.span>% tension
          </motion.div>
        </div>
      ) : (
        <div className="relative h-20 flex items-center justify-center">
          {/* Confetti burst */}
          {confetti.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ x: p.x, y: p.y, scale: 0, opacity: 0, rotate: p.r }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full"
              style={{ background: p.color }}
            />
          ))}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-3xl"
          >
            🎉
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
