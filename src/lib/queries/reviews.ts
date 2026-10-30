"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Review } from "@/db/schema";

export type ReviewsPayload = {
  items: Review[];
  count: number;
  average: number;
  distribution: number[]; // index 0 => 1 star
};

const key = (id: string) => ["reviews", id] as const;

export function useReviewsQuery(workoutId: string, enabled: boolean) {
  return useQuery({
    queryKey: key(workoutId),
    enabled,
    queryFn: async (): Promise<ReviewsPayload> => {
      const res = await fetch(`/api/feed/${workoutId}/reviews`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load reviews");
      return res.json();
    },
    staleTime: 20_000,
  });
}

export function useAddReview(workoutId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { rating: number; comment: string; author: string }) => {
      const res = await fetch(`/api/feed/${workoutId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not post review");
      }
      return res.json() as Promise<Review>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(workoutId) });
      qc.invalidateQueries({ queryKey: ["feed"] }); // refresh aggregate stars
    },
  });
}
