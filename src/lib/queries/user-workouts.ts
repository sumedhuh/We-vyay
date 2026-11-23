"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSessionStore } from "@/stores/session-store";

export type UserWorkout = {
  id: string;
  userId: string;
  title: string;
  description: string;
  isPublished: boolean;
  exercises: Array<{
    name: string;
    sets: number;
    reps: string;
    animation?: string | null;
    animationId?: string | null;
    animationName?: string | null;
    animationKind?: "image" | "video" | "lottie" | "3d" | null;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type WorkoutCreateInput = {
  title: string;
  description?: string;
  isPublished?: boolean;
  exercises?: UserWorkout["exercises"];
};

export type WorkoutUpdateInput = Partial<WorkoutCreateInput>;

const userWorkoutsKey = (userId: string) => ["user-workouts", userId] as const;

/** Fetch ALL workouts for the current user (personal + published). */
export function useUserWorkoutsQuery() {
  const userId = useSessionStore((s) => s.userId);
  return useQuery({
    queryKey: userWorkoutsKey(userId),
    queryFn: async (): Promise<UserWorkout[]> => {
      const res = await fetch(`/api/user-workouts?userId=${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load workouts");
      return res.json();
    },
    staleTime: 1000 * 30, // 30 s
  });
}

/** Create a new custom workout. */
export function useCreateUserWorkout() {
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  return useMutation({
    mutationFn: async (input: WorkoutCreateInput): Promise<UserWorkout> => {
      const res = await fetch(`/api/user-workouts?userId=${encodeURIComponent(userId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(err?.error ?? "Create failed");
      }
      return res.json();
    },
    onSuccess: (created) => {
      qc.setQueryData<UserWorkout[]>(userWorkoutsKey(userId), (old) =>
        old ? [created, ...old] : [created],
      );
    },
  });
}

/** Update a workout's title, description, isPublished, or exercises. */
export function useUpdateUserWorkout() {
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: WorkoutUpdateInput & { id: string }): Promise<UserWorkout> => {
      const res = await fetch(
        `/api/user-workouts/${id}?userId=${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      if (!res.ok) {
        const err = await res.json().catch(() => null) as { error?: string } | null;
        throw new Error(err?.error ?? "Update failed");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      qc.setQueryData<UserWorkout[]>(userWorkoutsKey(userId), (old) =>
        old?.map((w) => (w.id === updated.id ? updated : w)) ?? [updated],
      );
    },
  });
}

/** Toggle the is_published state. */
export function useToggleWorkoutPublished() {
  const update = useUpdateUserWorkout();
  return {
    ...update,
    mutate: (workout: UserWorkout) =>
      update.mutate({ id: workout.id, isPublished: !workout.isPublished }),
    mutateAsync: (workout: UserWorkout) =>
      update.mutateAsync({ id: workout.id, isPublished: !workout.isPublished }),
  };
}

/** Delete a custom workout. */
export function useDeleteUserWorkout() {
  const qc = useQueryClient();
  const userId = useSessionStore((s) => s.userId);

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(
        `/api/user-workouts/${id}?userId=${encodeURIComponent(userId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: (_data, deletedId) => {
      qc.setQueryData<UserWorkout[]>(userWorkoutsKey(userId), (old) =>
        old?.filter((w) => w.id !== deletedId) ?? [],
      );
    },
  });
}
