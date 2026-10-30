"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type ProPlan = "monthly" | "yearly";

type ProState = {
  isPro: boolean;
  plan: ProPlan | null;
  purchasedAt: string | null;
  /**
   * Single source of truth for entitlement. In production this mirrors the
   * RevenueCat `customerInfo.activeSubscriptions` snapshot; here the mock
   * gateway resolves the same state shape so gating logic is identical.
   */
  purchase: (plan: ProPlan) => void;
  restore: () => void;
  cancel: () => void;
};

export const useProStore = create<ProState>()(
  persist(
    (set) => ({
      isPro: false,
      plan: null,
      purchasedAt: null,
      purchase: (plan) =>
        set({ isPro: true, plan, purchasedAt: new Date().toISOString() }),
      restore: () => set({ isPro: true, plan: "yearly", purchasedAt: new Date().toISOString() }),
      cancel: () => set({ isPro: false, plan: null, purchasedAt: null }),
    }),
    { name: "vyay-pro-v1", storage: createJSONStorage(() => localStorage) },
  ),
);
