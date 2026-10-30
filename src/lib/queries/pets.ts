"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CustomPet, AnimationKind } from "@/db/schema";

const PETS_KEY = ["pets"] as const;

export type NewPetPayload = {
  name: string;
  bio: string;
  personality: string;
  furHex: string;
  assetId: string | null;
  assetName: string | null;
  assetKind: AnimationKind | null;
};

export function usePetsQuery() {
  return useQuery({
    queryKey: PETS_KEY,
    queryFn: async (): Promise<CustomPet[]> => {
      const res = await fetch("/api/pets", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load your pets");
      const json = (await res.json()) as { items: CustomPet[] };
      return json.items;
    },
    staleTime: 60_000,
  });
}

export function useCreatePet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: NewPetPayload): Promise<CustomPet> => {
      const res = await fetch("/api/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(err?.error ?? "Could not save pet");
      }
      return res.json();
    },
    onSuccess: (created) => {
      qc.setQueryData<CustomPet[]>(PETS_KEY, (cur) =>
        cur ? [created, ...cur] : [created],
      );
      qc.invalidateQueries({ queryKey: PETS_KEY });
    },
  });
}

export function useDeletePet() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/pets/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json() as Promise<{ id: string }>;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: PETS_KEY });
      const snapshot = qc.getQueryData<CustomPet[]>(PETS_KEY);
      qc.setQueryData<CustomPet[]>(PETS_KEY, (cur) =>
        (cur ?? []).filter((p) => p.id !== id),
      );
      return { snapshot };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.snapshot) qc.setQueryData(PETS_KEY, ctx.snapshot);
    },
  });
}
