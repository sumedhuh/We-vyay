"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_VIBES,
  type AnimationKind,
  type Vibes,
  type ExerciseMode,
} from "@/db/schema";

export type MotionPreset = "pulse" | "wave" | "orbit" | "pop";

export type StudioItem = {
  /** unique per dropped instance */
  uid: string;
  exerciseId: string;
  name: string;
  emoji: string;
  tag: string;
  /** the exercise's own vibe profile — feeds the workout's computed vibes */
  vibes: Vibes;
  /** volume chosen by the user at drop time */
  mode: ExerciseMode;
  sets: number;
  reps: number;
  seconds: number;
  /** built-in motion preset */
  animation: MotionPreset | null;
  /** user-uploaded animation attached to this move */
  animationId: string | null;
  animationName: string | null;
  animationKind: AnimationKind | null;
};

export type ItemDraft = Omit<StudioItem, "uid">;

type StudioState = {
  title: string;
  description: string;
  cover: string | null;
  items: StudioItem[];
  setTitle: (t: string) => void;
  setDescription: (d: string) => void;
  setCover: (c: string | null) => void;
  addItem: (item: ItemDraft) => string;
  updateItem: (uid: string, patch: Partial<Omit<StudioItem, "uid">>) => void;
  removeItem: (uid: string) => void;
  moveItem: (uid: string, dir: -1 | 1) => void;
  setAnimation: (uid: string, animation: MotionPreset) => void;
  setCustomAnimation: (
    uid: string,
    custom: { id: string; name: string; kind: AnimationKind } | null,
  ) => void;
  clear: () => void;
};

let uidCounter = 0;
const nextUid = () =>
  `s${Date.now().toString(36)}${(uidCounter++).toString(36)}`;

export const useStudioStore = create<StudioState>()(
  persist(
    (set) => ({
      title: "Untitled flow",
      description: "",
      cover: null,
      items: [],

      setTitle: (title) => set({ title: title.slice(0, 48) }),
      setDescription: (desc) => set({ description: desc.slice(0, 200) }),
      setCover: (cover) => set({ cover }),

      addItem: (item) => {
        const uid = nextUid();
        set((s) => ({ items: [...s.items, { ...item, uid }] }));
        return uid;
      },

      updateItem: (uid, patch) =>
        set((s) => ({
          items: s.items.map((i) => (i.uid === uid ? { ...i, ...patch } : i)),
        })),

      removeItem: (uid) =>
        set((s) => ({ items: s.items.filter((i) => i.uid !== uid) })),

      moveItem: (uid, dir) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.uid === uid);
          const to = idx + dir;
          if (idx < 0 || to < 0 || to >= s.items.length) return s;
          const items = [...s.items];
          const [moved] = items.splice(idx, 1);
          items.splice(to, 0, moved);
          return { items };
        }),

      setAnimation: (uid, animation) =>
        set((s) => ({
          items: s.items.map((i) => (i.uid === uid ? { ...i, animation } : i)),
        })),

      setCustomAnimation: (uid, custom) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.uid === uid
              ? {
                  ...i,
                  // a custom upload supersedes the built-in preset
                  animation: custom ? null : i.animation,
                  animationId: custom?.id ?? null,
                  animationName: custom?.name ?? null,
                  animationKind: custom?.kind ?? null,
                }
              : i,
          ),
        })),

      clear: () => set({ items: [], title: "Untitled flow", description: "", cover: null }),
    }),
    {
      name: "vyay-studio-draft-v3", // never lose a half-built workout
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const emptyVibes = (): Vibes => ({ ...DEFAULT_VIBES });
