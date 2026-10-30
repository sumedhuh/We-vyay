"use client";

import React, { useState } from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, Trophy, Sparkles, Flame } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { haptic } from "@/lib/haptics";

interface ConfettiButtonProps {
  onComplete?: () => void;
  workoutTitle?: string;
}

export function ConfettiButton({ onComplete, workoutTitle }: ConfettiButtonProps) {
  const [completed, setCompleted] = useState(false);

  const handleClick = () => {
    if (completed) return;

    haptic("success");
    setCompleted(true);

    // Multi-stage confetti celebration stream
    const duration = 2400;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 999 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function () {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);

      // Launch from dual golden spiral foci
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.15, 0.35), y: Math.random() - 0.2 },
        colors: ["#a78bfa", "#f472b6", "#a7f0cf", "#fb923c", "#38bdf8"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.65, 0.85), y: Math.random() - 0.2 },
        colors: ["#c084fc", "#f43f5e", "#6fe3b1", "#fef08a", "#818cf8"],
      });
    }, 250);

    if (onComplete) {
      setTimeout(onComplete, 1200);
    }
  };

  return (
    <div className="w-full flex justify-center py-3">
      <motion.button
        type="button"
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleClick}
        className={`relative w-full max-w-[340px] aspect-[1.618/1] overflow-hidden p-6 cursor-pointer select-none transition-all duration-500 flex flex-col justify-between border shadow-2xl backdrop-blur-xl ${
          completed
            ? "bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-mint/30 border-emerald-400/40 text-emerald-950 dark:text-emerald-100 shadow-[0_20px_50px_-15px_rgba(16,185,129,0.35)]"
            : "bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 dark:from-purple-950/80 dark:via-indigo-950/70 dark:to-violet-900/80 border-purple-300/40 dark:border-purple-500/30 text-purple-950 dark:text-purple-100 shadow-[0_20px_50px_-15px_rgba(139,92,246,0.35)] hover:border-purple-400/60"
        } rounded-tl-[34px] rounded-tr-[21px] rounded-br-[13px] rounded-bl-[8px]`}
      >
        {/* Background Fibonacci Spiral Geometry SVG Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-25 mix-blend-overlay">
          <svg className="w-full h-full" viewBox="0 0 161.8 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Golden Ratio Squares Grid */}
            <rect x="0" y="0" width="100" height="100" stroke="currentColor" strokeWidth="0.75" />
            <rect x="100" y="0" width="61.8" height="61.8" stroke="currentColor" strokeWidth="0.75" />
            <rect x="100" y="61.8" width="38.2" height="38.2" stroke="currentColor" strokeWidth="0.75" />
            <rect x="138.2" y="61.8" width="23.6" height="23.6" stroke="currentColor" strokeWidth="0.75" />
            
            {/* Golden Spiral Arc */}
            <path
              d="M 0 100 A 100 100 0 0 1 100 0 A 61.8 61.8 0 0 1 161.8 61.8 A 38.2 38.2 0 0 1 138.2 100"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              fill="none"
            />
          </svg>
        </div>

        {/* Ambient Glowing Shimmer */}
        <div className="absolute -top-12 -right-12 size-36 rounded-full bg-gradient-to-br from-pink-400/30 to-purple-500/30 blur-2xl pointer-events-none animate-pulse" />

        {/* Top Header Row of the Quadrilateral */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/60 dark:bg-black/30 backdrop-blur-md text-[10px] font-extrabold uppercase tracking-widest text-purple-700 dark:text-purple-300 border border-purple-200/50 dark:border-purple-700/30">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span>Fibonacci Ratio 1:1.618</span>
          </div>

          <span className="text-[11px] font-black uppercase tracking-wider text-pink-600 dark:text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-md">
            {completed ? "DONE" : "FINALE"}
          </span>
        </div>

        {/* Central Content */}
        <div className="relative z-10 my-auto text-left">
          <AnimatePresence mode="wait">
            {completed ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3"
              >
                <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-400/30 shadow-inner">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-100 leading-tight">
                    Workout Completed!
                  </h4>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    +40 XP Claimed · Golden Seal
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300">
                    {workoutTitle || "Routine Finale"}
                  </p>
                  <h3 className="text-xl font-extrabold text-purple-950 dark:text-white leading-tight mt-0.5">
                    Complete Workout
                  </h3>
                  <p className="text-[11px] font-medium text-purple-700/80 dark:text-purple-300/80">
                    Tap to trigger celebration & XP
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/40 border border-purple-300/30">
                  <Trophy className="w-6 h-6 animate-bounce" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Footer Row */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-bold text-purple-800/70 dark:text-purple-200/70 border-t border-purple-200/30 dark:border-purple-800/30 pt-2">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-orange-400" />
            Streak Preserved
          </span>
          <span>Corners: 34 · 21 · 13 · 8</span>
        </div>
      </motion.button>
    </div>
  );
}
