"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Liquid Fill — for Water/Coffee/Hydration tasks.
 * Tap to fill container with wave animation. Once full, transforms to stretch-snap.
 */
export function LiquidFillCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const updateProgress = useChallengeStore((s) => s.updateProgress);
  const [fills, setFills] = useState(0);
  const [filled, setFilled] = useState(false);
  const fillTarget = Math.max(task.target, 1);
  const fillPercent = Math.min((fills / fillTarget) * 100, 100);

  // Determine if this is a water or coffee-type task
  const isWater = task.label.toLowerCase().match(/water|hydrat/);
  const liquidColor = isWater ? "#4FC3F7" : "#8D6E63";
  const liquidColorDark = isWater ? "#29B6F6" : "#795548";

  const handleTap = useCallback(() => {
    if (filled) return;
    haptic("medium");

    const next = fills + 1;
    setFills(next);
    updateProgress(task.id, next);

    if (next >= fillTarget) {
      haptic("success");
      completeTask(task.id);
    }
  }, [fills, fillTarget, completeTask, task.id, updateProgress]);

  useEffect(() => {
    if (fills > 0 && fills >= fillTarget) {
      haptic("success");
      completeTask(task.id);
    }
  }, [fills, fillTarget, completeTask, task.id]);

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
              {fills}/{fillTarget} {task.unit}
            </p>
          </div>
        </div>
        {filled && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-300 px-3 py-1 rounded-full"
          >
            Full!
          </motion.span>
        )}
      </div>

      {/* Container / Segmented Circle */}
      <motion.button
        type="button"
        onClick={handleTap}
        disabled={filled}
        whileTap={!filled ? { scale: 0.95 } : undefined}
        className="relative w-full h-40 flex items-center justify-center rounded-2xl overflow-hidden cursor-pointer outline-none bg-white/20 border-2 border-white/40"
      >
        <div className="relative w-28 h-28">
          {/* Segmented Circle */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {Array.from({ length: fillTarget }).map((_, i) => {
              const startAngle = (i * 360) / fillTarget;
              const endAngle = ((i + 1) * 360) / fillTarget;
              const gap = fillTarget > 1 ? 4 : 0; // 4 degree gap
              
              // SVG arc math
              const x1 = 50 + 44 * Math.cos((Math.PI * (startAngle + gap/2)) / 180);
              const y1 = 50 + 44 * Math.sin((Math.PI * (startAngle + gap/2)) / 180);
              const x2 = 50 + 44 * Math.cos((Math.PI * (endAngle - gap/2)) / 180);
              const y2 = 50 + 44 * Math.sin((Math.PI * (endAngle - gap/2)) / 180);
              
              const largeArcFlag = endAngle - startAngle - gap <= 180 ? "0" : "1";
              
              const isFilled = i < fills;
              
              return (
                <motion.path
                  key={i}
                  d={`M 50 50 L ${x1} ${y1} A 44 44 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                  fill={isFilled ? liquidColor : "rgba(0,0,0,0.15)"}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                />
              );
            })}
          </svg>
          
          {/* Center hole for donut look + emoji */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/30 dark:bg-black/30 backdrop-blur-md rounded-full flex flex-col items-center justify-center shadow-inner border border-white/20">
              <motion.span
                className="text-2xl"
                animate={fills > 0 ? { scale: [1, 1.3, 1], rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                key={fills}
              >
                {isWater ? "💧" : "☕"}
              </motion.span>
            </div>
          </div>
        </div>
        
        {/* Helper text overlay */}
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-md">
            {filled ? "Hydrated!" : "Tap to drink"}
          </span>
        </div>
      </motion.button>
    </motion.div>
  );
}
