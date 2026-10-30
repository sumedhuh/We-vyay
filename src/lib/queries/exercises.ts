"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomExercise, Vibes, ExerciseMode, AnimationKind } from "@/db/schema";

const EX_KEY = ["exercises"] as const;

export type NewExercisePayload = {
  name: string;
  emoji: string;
  tag: string;
  vibes: Vibes;
  mode: ExerciseMode;
  defaultSets: number;
  defaultReps: number;
  defaultSeconds: number;
  animationId: string | null;
  animationName: string | null;
  animationKind: AnimationKind | null;
};

export function useExercisesQuery() {
  return useQuery({
    queryKey: EX_KEY,
    queryFn: async (): Promise<CustomExercise[]> => {
      const res = await fetch("/api/exercises", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load your exercises");
      const json = (await res.json()) as { items: CustomExercise[] };
      return json.items;
    },
    staleTime: 60_000,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NewExercisePayload): Promise<CustomExercise> => {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not save exercise");
      }
      return res.json();
    },
    onSuccess: (created) => {
      // paint the new dock card immediately, then reconcile
      qc.setQueryData<CustomExercise[]>(EX_KEY, (cur) =>
        cur ? [created, ...cur] : [created],
      );
      qc.invalidateQueries({ queryKey: EX_KEY });
    },
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<{ id: string }>;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: EX_KEY });
      const snapshot = qc.getQueryData<CustomExercise[]>(EX_KEY);
      qc.setQueryData<CustomExercise[]>(EX_KEY, (cur) =>
        (cur ?? []).filter((e) => e.id !== id),
      );
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(EX_KEY, ctx.snapshot);
    },
  });
}
