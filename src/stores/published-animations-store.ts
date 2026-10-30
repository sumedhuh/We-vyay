"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * A published animation is a 3D exercise animation created in the Studio
 * and globally bound to a specific exercise name. When any workout references
 * that exercise, the player pulls the animation config from here.
 */
export type PublishedAnimation = {
  id: string;
  /** Exercise name this animation is bound to (lowercased for matching). */
  exerciseName: string;
  /** Display name shown in UI */
  displayName: string;
  /** 3D scene configuration snapshot from the builder */
  sceneConfig: {
    presetId: string;
    skinTone: string;
    shirtColor: string;
    shortsColor: string;
    cameraPreset: string;
    speed: number;
    autoRotate: boolean;
  };
  /** Timestamp when published */
  publishedAt: number;
  /** Author name */
  author: string;
};

type PublishedAnimationsState = {
  animations: PublishedAnimation[];
  /** Publish a new animation bound to an exercise */
  publishAnimation: (anim: Omit<PublishedAnimation, "id" | "publishedAt">) => string;
  /** Get animation for a given exercise name */
  getAnimationForExercise: (exerciseName: string) => PublishedAnimation | null;
  /** Remove an animation */
  removeAnimation: (id: string) => void;
  /** Clear all */
  clearAll: () => void;
};

export const usePublishedAnimationsStore = create<PublishedAnimationsState>()(
  persist(
    (set, get) => ({
      animations: [],

      publishAnimation: (anim) => {
        const id = `pa-${Date.now().toString(36)}`;
        const newAnim: PublishedAnimation = {
          ...anim,
          id,
          publishedAt: Date.now(),
        };
        set((s) => ({
          animations: [
            // Replace any existing animation for the same exercise
            ...s.animations.filter(
              (a) => a.exerciseName !== anim.exerciseName,
            ),
            newAnim,
          ],
        }));
        return id;
      },

      getAnimationForExercise: (exerciseName) => {
        const normalized = exerciseName.toLowerCase().trim();
        return (
          get().animations.find(
            (a) => a.exerciseName === normalized,
          ) ?? null
        );
      },

      removeAnimation: (id) =>
        set((s) => ({
          animations: s.animations.filter((a) => a.id !== id),
        })),

      clearAll: () => set({ animations: [] }),
    }),
    {
      name: "vyay-published-animations-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
