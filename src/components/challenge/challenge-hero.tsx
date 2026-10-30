"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Zap, Brain, Leaf } from "lucide-react";
import {
  useChallengeStore,
  CHALLENGE_PRESETS,
  type PresetId,
} from "@/stores/challenge-store";
import { useSettingsStore } from "@/stores/settings-store";
import { haptic } from "@/lib/haptics";

import { StretchSnapCard } from "./cards/stretch-snap-card";
import { BubblePopCard } from "./cards/bubble-pop-card";
import { BurnCard } from "./cards/burn-card";
import { ChiselCard } from "./cards/chisel-card";
import { ExhaleCard } from "./cards/exhale-card";
import { LiquidFillCard } from "./cards/liquid-fill-card";
import { ProgressRingCard } from "./cards/progress-ring-card";
import { ChecklistCard } from "./cards/checklist-card";
import { GullakVault } from "./gullak-vault";
import type { ChallengeTask } from "@/stores/challenge-store";

export const CARD_COMPONENTS: Record<string, React.ComponentType<{ task: ChallengeTask }>> = {
  "stretch-snap": StretchSnapCard,
  "bubble-pop": BubblePopCard,
  burn: BurnCard,
  chisel: ChiselCard,
  exhale: ExhaleCard,
  "liquid-fill": LiquidFillCard,
  "progress-ring": ProgressRingCard,
  checklist: ChecklistCard,
};

const PRESET_ICONS: Record<PresetId, React.ComponentType<{ className?: string }>> = {
  "morning-grind": Zap,
  "body-mind": Brain,
  "active-recovery": Leaf,
};

/**
 * Challenge Hero — the dominant section at the top of the Feed.
 * Text input + preset pills → renders parsed task cards + Gullak vault.
 */
export function ChallengeHero() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const tasks = useChallengeStore((s) => s.tasks);
  const challengeText = useChallengeStore((s) => s.challengeText);
  const allCompleted = useChallengeStore((s) => s.allCompleted);
  const crushed = useChallengeStore((s) => s.crushed);
  const submitChallenge = useChallengeStore((s) => s.submitChallenge);
  const loadPreset = useChallengeStore((s) => s.loadPreset);
  const clearChallenge = useChallengeStore((s) => s.clearChallenge);
  const challengeDate = useChallengeStore((s) => s.challengeDate);
  const displayName = useSettingsStore((s) => s.displayName);

  const [inputText, setInputText] = useState("");
  const [inputFocused, setInputFocused] = useState(false);

  // Auto-reset if it's a new day
  useEffect(() => {
    if (hydrated && challengeDate && challengeDate !== new Date().toDateString()) {
      clearChallenge();
    }
  }, [hydrated, challengeDate, clearChallenge]);

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    haptic("success");
    submitChallenge(inputText.trim());
    setInputText("");
  }, [inputText, submitChallenge]);

  const handlePreset = useCallback(
    (presetId: PresetId) => {
      haptic("medium");
      loadPreset(presetId);
    },
    [loadPreset],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const hasTasks = hydrated && tasks.length > 0;
  const showInput = !hasTasks || crushed;

  return (
    <div className="flex flex-col gap-4">
      {/* Hero header with gradient */}
      <motion.div
        layout
        className="relative overflow-hidden rounded-[2rem] p-5"
        style={{
          background: "linear-gradient(135deg, #FF69B4, #FFB347, #FF6B6B)",
        }}
      >
        {/* Floating decorative orb */}
        <div
          aria-hidden
          className="animate-float absolute -right-8 -top-8 size-28 rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, #FFD700, transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="animate-float-slow absolute -left-6 bottom-0 size-20 rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, #fff, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="size-4 text-white/80" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
              Daily Challenge
            </span>
          </div>

          <h2 className="text-xl font-black text-white leading-tight">
            {hasTasks && !crushed
              ? allCompleted
                ? "All tasks done! 🎉"
                : "Crush your goals today"
              : `What's the plan, ${hydrated ? displayName : "You"}?`}
          </h2>

          {hasTasks && !crushed && (
            <p className="mt-1 text-[11px] font-semibold text-white/70">
              {tasks.filter((t) => t.completed).length}/{tasks.length} completed
            </p>
          )}
        </div>
      </motion.div>

      {/* Input section */}
      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {/* Text input */}
            <div
              className={`surface-solid rounded-[1.4rem] p-3 transition-shadow ${
                inputFocused ? "shadow-soft ring-2 ring-pink-300/50 dark:ring-purple-500/50" : ""
              }`}
            >
              <div className="flex items-start gap-2">
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="e.g. 50 pushups, drink 8 glasses water, 20 min yoga, read 10 pages..."
                  rows={2}
                  className="flex-1 resize-none bg-transparent text-[13px] font-medium text-ink dark:text-snow placeholder:text-ink/30 dark:placeholder:text-snow/25 outline-none"
                />
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                  whileTap={{ scale: 0.9 }}
                  className="mt-1 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-orange-400 text-white outline-none disabled:opacity-40 shadow-lg"
                >
                  <Send className="size-4" />
                </motion.button>
              </div>
            </div>

            {/* Presets */}
            <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CHALLENGE_PRESETS.map((preset) => {
                const Icon = PRESET_ICONS[preset.id];
                return (
                  <motion.button
                    key={preset.id}
                    type="button"
                    onClick={() => handlePreset(preset.id)}
                    whileTap={{ scale: 0.95 }}
                    className="surface-solid flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-bold text-ink/70 dark:text-snow/65 outline-none cursor-pointer hover:shadow-sm transition-shadow"
                  >
                    <Icon className="size-3.5" />
                    <span>{preset.emoji}</span>
                    {preset.label}
                  </motion.button>
                );
              })}
            </div>

            {crushed && (
              <motion.button
                type="button"
                onClick={() => {
                  haptic("light");
                  clearChallenge();
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2 w-full text-center text-[11px] font-bold text-ink/40 dark:text-snow/35 cursor-pointer outline-none hover:text-ink/60 dark:hover:text-snow/50 transition-colors"
              >
                Start a fresh challenge →
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task cards */}
      <AnimatePresence>
        {hasTasks && !crushed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-3"
          >
            <AnimatePresence>
              {tasks.filter(t => !t.completed).map((task) => {
                const CardComponent = CARD_COMPONENTS[task.cardType] || ChecklistCard;
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, height: 0, x: -50 }}
                    animate={{ opacity: 1, height: "auto", x: 0 }}
                    exit={{ opacity: 0, height: 0, x: 300, marginBottom: 0 }}
                    transition={{ 
                      opacity: { duration: 0.2 },
                      x: { type: "spring", stiffness: 400, damping: 30 },
                      height: { duration: 0.3 }
                    }}
                    className="w-full overflow-hidden"
                  >
                    <div className="pb-3">
                      <CardComponent task={task} />
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Gullak Vault */}
            <GullakVault />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
