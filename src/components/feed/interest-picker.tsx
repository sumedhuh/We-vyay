"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  useSettingsStore,
  FITNESS_INTERESTS,
  type FitnessInterestId,
} from "@/stores/settings-store";
import { haptic } from "@/lib/haptics";

/**
 * InterestPicker — Organic blob-shaped pills for fitness preferences.
 * Inspired by the "Pick your passions" reference (Image 2).
 */

const BLOB_CLASSES = ["blob-1", "blob-2", "blob-3", "blob-4"];

export function InterestPicker() {
  const [hydrated, setHydrated] = useState(false);
  const fitnessPreferences = useSettingsStore((s) => s.fitnessPreferences);
  const togglePreference = useSettingsStore((s) => s.togglePreference);
  const interestPickerSeen = useSettingsStore((s) => s.interestPickerSeen);
  const setInterestPickerSeen = useSettingsStore((s) => s.setInterestPickerSeen);

  useEffect(() => setHydrated(true), []);

  const [showPicker, setShowPicker] = useState(false);

  // Auto-show on first visit
  useEffect(() => {
    if (hydrated && !interestPickerSeen && fitnessPreferences.length === 0) {
      const timer = setTimeout(() => setShowPicker(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [hydrated, interestPickerSeen, fitnessPreferences.length]);

  const handleDismiss = () => {
    setShowPicker(false);
    setInterestPickerSeen();
  };

  const handleToggle = (id: FitnessInterestId) => {
    haptic("selection");
    togglePreference(id);
  };

  if (!hydrated) return null;

  // Compact pill strip for when picker is closed but preferences exist
  if (!showPicker && fitnessPreferences.length > 0) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar flex-1">
          {fitnessPreferences.map((id) => {
            const interest = FITNESS_INTERESTS.find((x) => x.id === id);
            if (!interest) return null;
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => handleToggle(id)}
                whileTap={{ scale: 0.9 }}
                className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold cursor-pointer outline-none"
                style={{
                  background: `${interest.color}25`,
                  color: interest.color,
                }}
              >
                <span>{interest.emoji}</span>
                {interest.label}
                <X className="size-2.5 opacity-50" />
              </motion.button>
            );
          })}
        </div>
        <motion.button
          type="button"
          onClick={() => setShowPicker(true)}
          whileTap={{ scale: 0.9 }}
          className="text-[10px] font-bold text-ink/40 dark:text-snow/35 cursor-pointer outline-none hover:text-ink/60 dark:hover:text-snow/50 transition-colors shrink-0"
        >
          Edit
        </motion.button>
      </div>
    );
  }

  // Compact strip when no preferences and picker was dismissed
  if (!showPicker && fitnessPreferences.length === 0) {
    return (
      <motion.button
        type="button"
        onClick={() => setShowPicker(true)}
        whileTap={{ scale: 0.97 }}
        className="w-full surface-solid rounded-[1.2rem] px-4 py-2.5 text-[11px] font-bold text-ink/50 dark:text-snow/45 cursor-pointer outline-none hover:shadow-sm transition-shadow text-left"
      >
        🎯 Pick your fitness interests to personalize your feed →
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      {showPicker && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div
            className="rounded-[1.6rem] p-4"
            style={{
              background: "linear-gradient(135deg, #EDE7F6, #E1D5F0, #DDD0F2)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-[16px] font-black text-gray-800 dark:text-gray-100">
                  Pick your passions ✨
                </h3>
                <p className="text-[11px] font-semibold text-gray-600/70 dark:text-gray-300/60 mt-0.5">
                  We'll personalize your feed
                </p>
              </div>
              <motion.button
                type="button"
                onClick={handleDismiss}
                whileTap={{ scale: 0.8 }}
                className="size-8 flex items-center justify-center rounded-full bg-white/40 cursor-pointer outline-none"
              >
                <X className="size-4 text-gray-600" />
              </motion.button>
            </div>

            <div className="flex flex-wrap gap-2">
              {FITNESS_INTERESTS.map((interest, i) => {
                const selected = fitnessPreferences.includes(interest.id);
                const blobClass = BLOB_CLASSES[i % BLOB_CLASSES.length];

                return (
                  <motion.button
                    key={interest.id}
                    type="button"
                    onClick={() => handleToggle(interest.id)}
                    whileTap={{ scale: 0.92 }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className={`${blobClass} relative flex items-center gap-1.5 px-4 py-2.5 cursor-pointer outline-none transition-all duration-200 ${
                      selected
                        ? "shadow-lg ring-2 ring-white/40"
                        : "hover:shadow-sm"
                    }`}
                    style={{
                      background: selected ? interest.color : "rgba(255,255,255,0.65)",
                      color: selected ? "white" : interest.color,
                      fontWeight: selected ? 800 : 700,
                    }}
                  >
                    <span className="text-base">{interest.emoji}</span>
                    <span className="text-[12px] font-bold">{interest.label}</span>

                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-white/30"
                      >
                        <svg className="size-2.5" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </motion.span>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {fitnessPreferences.length > 0 && (
              <motion.button
                type="button"
                onClick={handleDismiss}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.95 }}
                className="mt-4 w-full py-2.5 rounded-full bg-gray-800 text-white text-[12px] font-bold cursor-pointer outline-none shadow-lg"
              >
                Continue ({fitnessPreferences.length} selected)
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
