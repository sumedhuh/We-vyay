"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Database } from "../../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];
type Routine = Database["public"]["Tables"]["routines"]["Row"];

const WORKOUTS_KEY = ["workouts"] as const;
const ROUTINE_KEY = (id: string) => ["routine", id] as const;

/**
 * Fetch all published workouts for the global library
 */
export function useWorkoutsQuery() {
  return useQuery({
    queryKey: WORKOUTS_KEY,
    queryFn: async (): Promise<Workout[]> => {
      // In your Next.js app, this would hit your API route which connects to Supabase/Postgres
      const res = await fetch("/api/workouts", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load workouts");
      return res.json();
    },
    // Cache the dictionary globally for 5 minutes as planned
    staleTime: 1000 * 60 * 5, 
  });
}

/**
 * Fetch a specific routine and its sequence of workouts
 */
export function useRoutineQuery(routineId: string) {
  return useQuery({
    queryKey: ROUTINE_KEY(routineId),
    queryFn: async (): Promise<Routine & { workouts: Workout[] }> => {
      const res = await fetch(`/api/routines/${routineId}`);
      if (!res.ok) throw new Error("Failed to load routine");
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Publish a new workout from the Studio
 */
export function usePublishWorkout() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (workoutData: Partial<Workout>): Promise<Workout> => {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(workoutData),
      });
      if (!res.ok) throw new Error("Failed to publish workout");
      return res.json();
    },
    onSuccess: (newWorkout) => {
      // Optimistically update the global workouts list
      qc.setQueryData<Workout[]>(WORKOUTS_KEY, (old) => 
        old ? [newWorkout, ...old] : [newWorkout]
      );
      // Invalidate to ensure background sync
      qc.invalidateQueries({ queryKey: WORKOUTS_KEY });
    },
  });
}
