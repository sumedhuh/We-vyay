"use client";

import { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ChallengeTask } from "@/stores/challenge-store";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { TimelineFuse } from "../timeline-fuse";

/**
 * Checklist — default fallback for unrecognized tasks.
 * Enhanced spring-animated checkmarks (not browser defaults).
 */
export function ChecklistCard({ task }: { task: ChallengeTask }) {
  const completeTask = useChallengeStore((s) => s.completeTask);

  const handleCheck = useCallback(() => {
    if (task.completed) return;
    haptic("success");
    completeTask(task.id);
  }, [task.completed, task.id, completeTask]);

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

      <motion.button
        type="button"
        onClick={handleCheck}
        disabled={task.completed}
        whileTap={!task.completed ? { scale: 0.97 } : undefined}
        className="w-full flex items-center gap-3 cursor-pointer outline-none select-none"
      >
        {/* Custom checkbox */}
        <div className="relative w-7 h-7 flex-shrink-0">
          <motion.div
            className="absolute inset-0 rounded-lg border-2"
            animate={{
              borderColor: task.completed ? "#48BB78" : "rgba(0,0,0,0.2)",
              backgroundColor: task.completed ? "#48BB78" : "transparent",
            }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />

          <AnimatePresence>
            {task.completed && (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                className="absolute inset-0 w-full h-full p-1"
                viewBox="0 0 24 24"
                fill="none"
              >
                <motion.path
                  d="M5 13l4 4L19 7"
                  stroke="white"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="flex-1 text-left">
          <motion.p
            className="text-[13px] font-bold capitalize"
            animate={{
              color: task.completed ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.8)",
              textDecoration: task.completed ? "line-through" : "none",
            }}
          >
            <span className="mr-2">{task.emoji}</span>
            {task.label}
          </motion.p>
          {task.target > 1 && (
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
              {task.target} {task.unit}
            </p>
          )}
        </div>

        {task.completed && (
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            className="text-lg"
          >
            ✅
          </motion.span>
        )}
      </motion.button>
    </motion.div>
  );
}
