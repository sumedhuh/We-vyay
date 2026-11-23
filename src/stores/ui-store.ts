"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type TabId = "pets" | "feed" | "community" | "settings" | "workouts";

export type Toast = {
  id: number;
  title: string;
  message?: string;
  tone: "mint" | "grape";
};

type UiState = {
  activeTab: TabId;
  setTab: (t: TabId) => void;
  /** Pro paywall now lives in a global sheet instead of its own tab. */
  proOpen: boolean;
  openPro: () => void;
  closePro: () => void;
  studioOpen: boolean;
  openStudio: () => void;
  closeStudio: () => void;
  profileOpen: boolean;
  openProfile: () => void;
  closeProfile: () => void;
  toasts: Toast[];
  pushToast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
};

let toastId = 0;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      activeTab: "feed", // the feed is the landing surface
      setTab: (activeTab) => set({ activeTab }),

      proOpen: false,
      openPro: () => set({ proOpen: true }),
      closePro: () => set({ proOpen: false }),

      studioOpen: false,
      openStudio: () => set({ studioOpen: true }),
      closeStudio: () => set({ studioOpen: false }),

      profileOpen: false,
      openProfile: () => set({ profileOpen: true }),
      closeProfile: () => set({ profileOpen: false }),

      toasts: [],
      pushToast: (t) => {
        const id = ++toastId;
        set((s) => ({ toasts: [...s.toasts.slice(-2), { ...t, id }] }));
        // auto-dismiss
        setTimeout(() => {
          useUiStore.setState((s) => ({
            toasts: s.toasts.filter((x) => x.id !== id),
          }));
        }, 3200);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: "vyay-ui-v2",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ activeTab: s.activeTab }), // remember last tab, never toasts
    },
  ),
);
