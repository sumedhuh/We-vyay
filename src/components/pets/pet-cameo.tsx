"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePetStore } from "@/stores/pet-store";

/**
 * PetCameo — A small, reusable pet avatar that pops up across screens.
 * Provides emotional connection by showing the pet in the greeting, celebrations, etc.
 */
export function PetCameo({
  size = 36,
  message,
  showMessage = false,
}: {
  size?: number;
  message?: string;
  showMessage?: boolean;
}) {
  const [hydrated, setHydrated] = useState(false);
  const name = usePetStore((s) => s.name);
  const personality = usePetStore((s) => s.personality);
  const customFur = usePetStore((s) => s.customFur);
  const color = usePetStore((s) => s.color);
  useEffect(() => setHydrated(true), []);

  const PET_EMOJIS: Record<string, string> = {
    playful: "🐾",
    zen: "🐱",
    fierce: "🐯",
    goofy: "🐶",
  };

  const petEmoji = PET_EMOJIS[personality] || "🐾";
  const furColor = hydrated ? (customFur || getFurColor(color)) : "#7fe7bb";

  const GREETINGS: Record<string, string[]> = {
    playful: ["says hi!", "is excited!", "wants to play!"],
    zen: ["is at peace", "sends calm vibes", "is meditating"],
    fierce: ["is pumped!", "is ready!", "says let's go!"],
    goofy: ["is being silly", "says hello!", "is napping..."],
  };

  const greeting = hydrated
    ? message ||
      `${name} ${GREETINGS[personality]?.[Math.floor(Date.now() / 86400000) % 3] || "says hi!"}`
    : "Miso says hi!";

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
        className="flex items-center justify-center rounded-full shadow-sm"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${furColor}, ${furColor}80)`,
          border: `2px solid ${furColor}50`,
        }}
      >
        <span style={{ fontSize: size * 0.5 }}>{petEmoji}</span>
      </motion.div>

      {showMessage && (
        <motion.p
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[11px] font-semibold text-ink/50 dark:text-snow/45 italic"
        >
          {greeting}
        </motion.p>
      )}
    </div>
  );
}

function getFurColor(color: string): string {
  const map: Record<string, string> = {
    mint: "#7fe7bb",
    sky: "#7cc8f8",
    peach: "#ffb48a",
    lilac: "#c4a8fb",
    sunset: "#ff8fa3",
    mono: "#d6d3cc",
  };
  return map[color] || "#7fe7bb";
}
