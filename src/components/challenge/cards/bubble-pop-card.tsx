"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Bubble Wrap Pop — for Study/Read/Pages tasks.
 * Grid of bubbles mapped to target count. Each tap = pop + haptic.
 * Last bubble triggers card flip to reveal "DONE" stamp.
 */
export function BubblePopCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);
  const updateProgress = useChallengeStore((s) => s.updateProgress);
  const bubbleCount = Math.min(task.target, 24); // cap at 24 for visual grid
  const [popped, setPopped] = useState<Set<number>>(new Set());
  const [flipped, setFlipped] = useState(false);

  const handlePop = useCallback(
    (index: number) => {
      if (popped.has(index) || flipped) return;
      haptic("medium");

      const newPopped = new Set(popped);
      newPopped.add(index);
      setPopped(newPopped);
      updateProgress(task.id, newPopped.size);

      if (newPopped.size >= bubbleCount) {
        haptic("success");
        completeTask(task.id);
      }
    },
    [popped, flipped, bubbleCount, completeTask, task.id, updateProgress],
  );

  // Calculate grid columns based on bubble count
  const cols = bubbleCount <= 4 ? 2 : bubbleCount <= 9 ? 3 : bubbleCount <= 16 ? 4 : 6;

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[1.6rem]"
      style={{ background: task.color, perspective: 800 }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {task.deadline && <TimelineFuse deadline={task.deadline} />}

      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front: Bubbles */}
        <div
          className="p-4"
          style={{ backfaceVisibility: "hidden" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-2xl">{task.emoji}</span>
            <div>
              <p className="text-[13px] font-bold text-gray-800 dark:text-gray-100 capitalize">{task.label}</p>
              <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                {popped.size}/{bubbleCount} popped
              </p>
            </div>
          </div>

          <div
            className="grid gap-2 justify-items-center"
            style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          >
            {Array.from({ length: bubbleCount }, (_, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => handlePop(i)}
                disabled={popped.has(i)}
                whileTap={!popped.has(i) ? { scale: 0.7 } : undefined}
                className="cursor-pointer outline-none"
              >
                <AnimatePresence mode="wait">
                  {!popped.has(i) ? (
                    <motion.div
                      key="bubble"
                      initial={{ scale: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 15 }}
                      className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/20 shadow-inner border border-white/80 dark:border-white/20 flex items-center justify-center hover:bg-white/90 transition-colors"
                      style={{
                        background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(255,255,255,0.3))",
                      }}
                    >
                      <div className="w-2 h-2 rounded-full bg-white/80" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="popped"
                      initial={{ scale: 1.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.3 }}
                      className="w-9 h-9 rounded-full bg-gray-300/30 dark:bg-gray-600/20 flex items-center justify-center"
                    >
                      <span className="text-[10px]">💨</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Back: DONE stamp */}
        <div
          className="absolute inset-0 p-4 flex flex-col items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={flipped ? { scale: 1, rotate: -12 } : {}}
            transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.2 }}
            className="px-8 py-4 rounded-2xl border-4 border-amber-500 dark:border-amber-400"
          >
            <p className="text-3xl font-black text-amber-600 dark:text-amber-300 uppercase tracking-widest">
              Done
            </p>
          </motion.div>
          <p className="mt-3 text-[11px] font-bold text-gray-600 dark:text-gray-300">
            All bubbles popped! 🎉
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
