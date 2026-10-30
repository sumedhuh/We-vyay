"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Workout, ExerciseRow, Vibes } from "@/db/schema";

export type FeedPage = {
  items: Workout[];
  nextCursor: string | null;
};

const FEED_KEY = ["feed"] as const;

async function fetchFeed(cursor: string | null): Promise<FeedPage> {
  const qp = cursor ? `?cursor=${encodeURIComponent(cursor)}&limit=6` : "?limit=6";
  const res = await fetch(`/api/feed${qp}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Feed failed (${res.status})`);
  return res.json();
}

/** Server state for the social feed — infinite, cached, deduped. */
export function useFeedQuery() {
  return useInfiniteQuery({
    queryKey: FEED_KEY,
    queryFn: ({ pageParam }) => fetchFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}

/** Optimistic like — updates every cached page before the server responds. */
export function useLikeMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: { id: string; liked: boolean }) => {
      const res = await fetch(`/api/feed/${vars.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ liked: vars.liked }),
      });
      if (!res.ok) throw new Error("Like failed");
      return res.json() as Promise<{ likes: number; liked: boolean }>;
    },

    onMutate: async ({ id, liked }) => {
      await qc.cancelQueries({ queryKey: FEED_KEY });
      const snapshot = qc.getQueryData<InfiniteData<FeedPage>>(FEED_KEY);

      qc.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((w) =>
              w.id === id
                ? { ...w, liked, likes: Math.max(0, w.likes + (liked ? 1 : -1)) }
                : w,
            ),
          })),
        };
      });

      return { snapshot };
    },

    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(FEED_KEY, ctx.snapshot); // rollback
    },

    onSuccess: (server, { id }) => {
      // reconcile the optimistic count with the authoritative one
      qc.setQueryData<InfiniteData<FeedPage>>(FEED_KEY, (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((w) =>
              w.id === id ? { ...w, likes: server.likes, liked: server.liked } : w,
            ),
          })),
        };
      });
    },
  });
}

/** Publish a Studio build — prepends to the feed via cache invalidation. */
export function usePublishWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      title: string;
      description?: string;
      cover?: string | null;
      exercises: ExerciseRow[];
      vibes: Vibes;
    }) => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Publish failed");
      }
      return res.json() as Promise<Workout>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: FEED_KEY }),
  });
}
