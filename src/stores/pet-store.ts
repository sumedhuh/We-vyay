"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { AnimationKind } from "@/db/schema";

export type PetColor = "mint" | "sky" | "peach" | "lilac" | "sunset" | "mono";
export type PetAccessory = "none" | "bow" | "cap" | "glasses" | "crown" | "scarf";
export type Personality = "playful" | "zen" | "fierce" | "goofy";

export const PET_COLORS: Record<PetColor, { fill: string; deep: string; belly: string }> = {
  mint: { fill: "#7fe7bb", deep: "#2fbf8a", belly: "#dcfbec" },
  sky: { fill: "#7cc8f8", deep: "#2f8fd0", belly: "#def2fe" },
  peach: { fill: "#ffb48a", deep: "#e56f35", belly: "#ffe8d8" },
  lilac: { fill: "#c4a8fb", deep: "#7c3aed", belly: "#efe6ff" },
  sunset: { fill: "#ff8fa3", deep: "#d94d68", belly: "#ffe0e6" },
  mono: { fill: "#d6d3cc", deep: "#57544c", belly: "#f4f1ea" },
};

/** XP curve — the cost of level N+1 grows linearly so early levels feel fast. */
export function xpForLevel(level: number): number {
  return 80 + level * 50;
}

type Gain = { leveledUp: boolean; level: number };

type PetState = {
  name: string;
  color: PetColor;
  /** arbitrary user-picked fur hex; overrides the `color` preset when set */
  customFur: string | null;
  /** an equipped user-uploaded pet; null => the built-in 3D companion */
  customPetId: string | null;
  customPetKind: AnimationKind | null;
  customPetAssetId: string | null;
  accessory: PetAccessory;
  personality: Personality;
  bio: string;
  xp: number;
  level: number;
  xpIntoLevel: number;
  streak: number;
  lastVisit: string | null;
  pulses: number; // total lifetime interactions
  gainXp: (amount: number) => Gain;
  customize: (
    patch: Partial<
      Pick<
        PetState,
        | "name" | "color" | "customFur" | "accessory" | "personality" | "bio"
        | "customPetId" | "customPetKind" | "customPetAssetId"
      >
    >,
  ) => void;
  touchDaily: () => void;
};

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      name: "Miso",
      color: "mint",
      customFur: null,
      customPetId: "custom-raccoon-1",
      customPetKind: "image",
      customPetAssetId: "/custom-pet.png",
      accessory: "none",
      personality: "playful",
      bio: "Professional cheerleader. Amateur napper.",
      xp: 0,
      level: 1,
      xpIntoLevel: 20,
      streak: 1,
      lastVisit: null,
      pulses: 0,

      gainXp: (amount) => {
        const s = get();
        let xpIntoLevel = s.xpIntoLevel + amount;
        let level = s.level;
        let leveledUp = false;
        // Carry overflow across consecutive level-ups
        while (xpIntoLevel >= xpForLevel(level)) {
          xpIntoLevel -= xpForLevel(level);
          level += 1;
          leveledUp = true;
        }
        set({ xp: s.xp + amount, xpIntoLevel, level, pulses: s.pulses + 1 });
        return { leveledUp, level };
      },

      customize: (patch) => set(patch),

      touchDaily: () => {
        const s = get();
        const today = new Date().toDateString();
        if (s.lastVisit === today) return;
        const yesterday = new Date(Date.now() - 86_400_000).toDateString();
        set({
          lastVisit: today,
          streak: s.lastVisit === yesterday ? s.streak + 1 : 1,
        });
      },
    }),
    {
      name: "vyay-pet-v3", // offline-first: progression survives restarts & dead networks
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
