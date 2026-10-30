"use client";

import React from "react";
import { motion } from "framer-motion";
import { KawaiiFlame } from "./KawaiiFlame";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="inline-flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-cyan-500/10 dark:from-purple-950/40 dark:via-indigo-950/40 dark:to-cyan-950/40 backdrop-blur-xl border border-pink-200/50 dark:border-purple-700/40 shadow-soft"
    >
      <KawaiiFlame size={32} />

      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 dark:text-purple-300">
            Kawaii Streak
          </span>
          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-pink-500/20 text-pink-700 dark:text-purple-200">
            ON FIRE
          </span>
        </div>
        <span className="text-base font-extrabold text-ink dark:text-snow leading-none mt-0.5">
          {streak} Days Active
        </span>
      </div>
    </motion.div>
  );
}
