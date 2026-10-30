"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AnimationMeta } from "@/db/schema";

const ANIM_KEY = ["animations"] as const;

export function animationUrl(id: string) {
  if (id.startsWith("/")) return id;
  return `/api/animations/${id}/raw`;
}

/** The user's uploaded animation library (metadata only). */
export function useAnimationsQuery() {
  return useQuery({
    queryKey: ANIM_KEY,
    queryFn: async (): Promise<AnimationMeta[]> => {
      const res = await fetch("/api/animations", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load your animations");
      const json = (await res.json()) as { items: AnimationMeta[] };
      return json.items;
    },
    staleTime: 60_000,
  });
}

export function useUploadAnimation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<AnimationMeta> => {
      const body = new FormData();
      body.append("file", file);
      body.append("name", file.name);

      const res = await fetch("/api/animations", { method: "POST", body });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Upload failed");
      }
      return res.json();
    },
    onSuccess: (created) => {
      // seed the cache immediately so the new tile paints before the refetch
      qc.setQueryData<AnimationMeta[]>(ANIM_KEY, (cur) =>
        cur ? [created, ...cur] : [created],
      );
      qc.invalidateQueries({ queryKey: ANIM_KEY });
    },
  });
}

export function useDeleteAnimation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/animations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<{ id: string }>;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ANIM_KEY });
      const snapshot = qc.getQueryData<AnimationMeta[]>(ANIM_KEY);
      qc.setQueryData<AnimationMeta[]>(ANIM_KEY, (cur) =>
        (cur ?? []).filter((a) => a.id !== id),
      );
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(ANIM_KEY, ctx.snapshot);
    },
  });
}
