"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Collection, CollectionWithMeta, Workout } from "@/db/schema";

/* ------------------------------------------------------------ follows -- */

export type FollowRow = {
  handle: string;
  author: string;
  avatarHue: number;
  createdAt: string;
  workoutCount: number;
  likeCount: number;
};

const FOLLOWS_KEY = ["follows"] as const;

export function useFollowsQuery() {
  return useQuery({
    queryKey: FOLLOWS_KEY,
    queryFn: async (): Promise<FollowRow[]> => {
      const res = await fetch("/api/follows", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load following");
      const json = (await res.json()) as { items: FollowRow[] };
      return json.items;
    },
    staleTime: 30_000,
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (vars: {
      handle: string;
      author: string;
      avatarHue: number;
      following: boolean;
    }) => {
      const res = vars.following
        ? await fetch(`/api/follows?handle=${encodeURIComponent(vars.handle)}`, {
            method: "DELETE",
          })
        : await fetch("/api/follows", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vars),
          });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not update follow");
      }
      return res.json();
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: FOLLOWS_KEY });
      const snapshot = qc.getQueryData<FollowRow[]>(FOLLOWS_KEY);
      qc.setQueryData<FollowRow[]>(FOLLOWS_KEY, (cur) => {
        const list = cur ?? [];
        if (vars.following) return list.filter((f) => f.handle !== vars.handle);
        if (list.some((f) => f.handle === vars.handle)) return list;
        return [
          {
            handle: vars.handle,
            author: vars.author,
            avatarHue: vars.avatarHue,
            createdAt: new Date().toISOString(),
            workoutCount: 0,
            likeCount: 0,
          },
          ...list,
        ];
      });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(FOLLOWS_KEY, ctx.snapshot);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: FOLLOWS_KEY }),
  });
}

export type CreatorProfile = {
  handle: string;
  author: string;
  avatarHue: number;
  items: Workout[];
  totalLikes: number;
  avgRating: number;
};

export function useCreatorQuery(handle: string | null) {
  return useQuery({
    queryKey: ["creator", handle],
    enabled: !!handle,
    queryFn: async (): Promise<CreatorProfile> => {
      const res = await fetch(`/api/creators/${encodeURIComponent(handle!)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not load profile");
      return res.json();
    },
  });
}

/* -------------------------------------------------------- collections -- */

const COLLECTIONS_KEY = ["collections"] as const;

export function useCollectionsQuery(enabled = true) {
  return useQuery({
    queryKey: COLLECTIONS_KEY,
    enabled,
    queryFn: async (): Promise<CollectionWithMeta[]> => {
      const res = await fetch("/api/collections", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load collections");
      const json = (await res.json()) as { items: CollectionWithMeta[] };
      return json.items;
    },
    staleTime: 20_000,
  });
}

export function useCollectionQuery(id: string | null) {
  return useQuery({
    queryKey: ["collection", id],
    enabled: !!id,
    queryFn: async (): Promise<Collection & { items: Workout[] }> => {
      const res = await fetch(`/api/collections/${id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load collection");
      return res.json();
    },
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { name: string; emoji: string }) => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vars),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not create collection");
      }
      return res.json() as Promise<CollectionWithMeta>;
    },
    onSuccess: (created) => {
      qc.setQueryData<CollectionWithMeta[]>(COLLECTIONS_KEY, (cur) =>
        cur ? [created, ...cur] : [created],
      );
      qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<{ id: string }>;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: COLLECTIONS_KEY });
      const snapshot = qc.getQueryData<CollectionWithMeta[]>(COLLECTIONS_KEY);
      qc.setQueryData<CollectionWithMeta[]>(COLLECTIONS_KEY, (cur) =>
        (cur ?? []).filter((c) => c.id !== id),
      );
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(COLLECTIONS_KEY, ctx.snapshot);
    },
  });
}

/** Which collections hold a given workout. */
export function useWorkoutCollections(workoutId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["workout-collections", workoutId],
    enabled,
    queryFn: async (): Promise<string[]> => {
      const res = await fetch(`/api/workouts/${workoutId}/collections`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Could not load save state");
      const json = (await res.json()) as { ids: string[] };
      return json.ids;
    },
    staleTime: 15_000,
  });
}

export function useToggleCollectionItem(workoutId: string) {
  const qc = useQueryClient();
  const key = ["workout-collections", workoutId] as const;

  return useMutation({
    mutationFn: async (vars: { collectionId: string; saved: boolean }) => {
      const url = `/api/collections/${vars.collectionId}/items`;
      const res = vars.saved
        ? await fetch(`${url}?workoutId=${encodeURIComponent(workoutId)}`, {
            method: "DELETE",
          })
        : await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ workoutId }),
          });
      if (!res.ok) throw new Error("Could not update collection");
      return res.json();
    },
    onMutate: async ({ collectionId, saved }) => {
      await qc.cancelQueries({ queryKey: key });
      const snapshot = qc.getQueryData<string[]>(key);
      qc.setQueryData<string[]>(key, (cur) => {
        const list = cur ?? [];
        return saved
          ? list.filter((id) => id !== collectionId)
          : [...list, collectionId];
      });
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(key, ctx.snapshot);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: COLLECTIONS_KEY });
    },
  });
}
