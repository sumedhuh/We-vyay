"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SessionState = {
  /** The active user's ID — stable per device (simulates Supabase auth.uid()) */
  userId: string;
  /** Regenerate the user ID (e.g. after sign-out in a real app) */
  refreshUserId: () => void;
};

function generateUserId(): string {
  // Simple UUID v4 generator (no dependency required)
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) => {
    const n = Number(c);
    return (n ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (n / 4)))).toString(16);
  });
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      userId: generateUserId(),
      refreshUserId: () => set({ userId: generateUserId() }),
    }),
    {
      name: "vyay-session-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ userId: s.userId }),
    },
  ),
);

/** Convenience selector — use this to get the current user's ID */
export const useCurrentUserId = () => useSessionStore((s) => s.userId);
