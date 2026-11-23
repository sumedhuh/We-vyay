"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/session-store";

export type UserProfile = {
  userId: string;
  bio: string;
  iconUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

const profileKey = (userId: string) => ["profile", userId] as const;

/** Fetch the current user's profile (lazy-creates it on first access). */
export function useProfileQuery() {
  const userId = useSessionStore((s) => s.userId);
  return useQuery({
    queryKey: profileKey(userId),
    queryFn: async (): Promise<UserProfile> => {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load profile");
      return res.json();
    },
    staleTime: 1000 * 60 * 2, // 2 min
  });
}

/** Update bio and/or icon_url. */
export function useUpdateProfile() {
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  return useMutation({
    mutationFn: async (input: { bio?: string; iconUrl?: string | null }): Promise<UserProfile> => {
      const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(err?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      qc.setQueryData<UserProfile>(profileKey(userId), updated);
    },
  });
}
