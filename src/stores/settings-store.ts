"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const DEFAULT_LIGHT_ACCENT = "#6fe3b1"; // Mint
export const DEFAULT_DARK_ACCENT = "#8b5cf6"; // Purple
export const DEFAULT_AVATAR = "#8b5cf6";

export const LIGHT_PRESETS = [
  { name: "Mint", hex: "#6fe3b1" },
  { name: "Lagoon", hex: "#45c8d8" },
  { name: "Coral", hex: "#ff8f6b" },
  { name: "Butter", hex: "#f5c451" },
  { name: "Blossom", hex: "#f78fb3" },
  { name: "Sky", hex: "#6bb8f5" },
];

export const DARK_PRESETS = [
  { name: "Purple", hex: "#8b5cf6" },
  { name: "Cyber", hex: "#22d3ee" },
  { name: "Ember", hex: "#fb7185" },
  { name: "Lime", hex: "#a3e635" },
  { name: "Gold", hex: "#fbbf24" },
  { name: "Ocean", hex: "#3b82f6" },
];

export const AVATAR_PRESETS = [
  "#8b5cf6",
  "#2fbf8a",
  "#f59e0b",
  "#ef4444",
  "#3b82f6",
  "#ec4899",
  "#14b8a6",
  "#64748b",
];

export type HeightUnit = "cm" | "ft";
export type WeightUnit = "kg" | "lbs";

export const FITNESS_INTERESTS = [
  { id: "hiit", label: "HIIT", emoji: "⚡", color: "#FF6B6B" },
  { id: "yoga", label: "Yoga", emoji: "🧘", color: "#FFB347" },
  { id: "strength", label: "Strength", emoji: "💪", color: "#68B5E8" },
  { id: "running", label: "Running", emoji: "🏃", color: "#6fe3b1" },
  { id: "dance", label: "Dance", emoji: "💃", color: "#FF69B4" },
  { id: "boxing", label: "Boxing", emoji: "🥊", color: "#E74C3C" },
  { id: "calisthenics", label: "Calisthenics", emoji: "🤸", color: "#9B59B6" },
  { id: "recovery", label: "Recovery", emoji: "🌿", color: "#A8E6CF" },
  { id: "swimming", label: "Swimming", emoji: "🏊", color: "#45C8D8" },
] as const;

export type FitnessInterestId = (typeof FITNESS_INTERESTS)[number]["id"];

type SettingsState = {
  lightAccent: string;
  darkAccent: string;
  avatarColor: string;
  displayName: string;
  /** Body metrics */
  age: number | null;
  height: number | null;
  weight: number | null;
  heightUnit: HeightUnit;
  weightUnit: WeightUnit;
  /** Fitness preferences for feed filtering */
  fitnessPreferences: FitnessInterestId[];
  /** Whether the interest picker has been shown */
  interestPickerSeen: boolean;

  setLightAccent: (hex: string) => void;
  setDarkAccent: (hex: string) => void;
  setAvatarColor: (hex: string) => void;
  setDisplayName: (name: string) => void;
  setAge: (age: number | null) => void;
  setHeight: (h: number | null) => void;
  setWeight: (w: number | null) => void;
  setHeightUnit: (u: HeightUnit) => void;
  setWeightUnit: (u: WeightUnit) => void;
  togglePreference: (id: FitnessInterestId) => void;
  setInterestPickerSeen: () => void;
  reset: () => void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      lightAccent: DEFAULT_LIGHT_ACCENT,
      darkAccent: DEFAULT_DARK_ACCENT,
      avatarColor: DEFAULT_AVATAR,
      displayName: "You",
      age: null,
      height: null,
      weight: null,
      heightUnit: "cm",
      weightUnit: "kg",
      fitnessPreferences: [],
      interestPickerSeen: false,

      setLightAccent: (lightAccent) => set({ lightAccent }),
      setDarkAccent: (darkAccent) => set({ darkAccent }),
      setAvatarColor: (avatarColor) => set({ avatarColor }),
      setDisplayName: (displayName) => set({ displayName: displayName.slice(0, 20) }),
      setAge: (age) => set({ age }),
      setHeight: (height) => set({ height }),
      setWeight: (weight) => set({ weight }),
      setHeightUnit: (heightUnit) => set({ heightUnit }),
      setWeightUnit: (weightUnit) => set({ weightUnit }),
      togglePreference: (id) =>
        set((s) => ({
          fitnessPreferences: s.fitnessPreferences.includes(id)
            ? s.fitnessPreferences.filter((p) => p !== id)
            : [...s.fitnessPreferences, id],
        })),
      setInterestPickerSeen: () => set({ interestPickerSeen: true }),
      reset: () =>
        set({
          lightAccent: DEFAULT_LIGHT_ACCENT,
          darkAccent: DEFAULT_DARK_ACCENT,
          avatarColor: DEFAULT_AVATAR,
        }),
    }),
    { name: "vyay-settings-v2", storage: createJSONStorage(() => localStorage) },
  ),
);
