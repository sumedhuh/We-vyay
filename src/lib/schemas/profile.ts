// src/lib/schemas/profile.ts
// Manual validation helpers (no Zod dependency needed — aligns with existing codebase pattern)

export type ProfileUpdateInput = {
  bio?: string;
  iconUrl?: string | null;
};

export type WorkoutCreateInput = {
  title: string;
  description?: string;
  isPublished?: boolean;
  exercises?: Array<{
    name: string;
    sets: number;
    reps: string;
    animation?: string | null;
    animationId?: string | null;
    animationName?: string | null;
    animationKind?: "image" | "video" | "lottie" | "3d" | null;
  }>;
};

export type WorkoutUpdateInput = Partial<WorkoutCreateInput>;

export function validateProfileUpdate(data: unknown): {
  ok: true; value: ProfileUpdateInput } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  if (d.bio !== undefined && typeof d.bio !== "string") return { ok: false, error: "bio must be a string" };
  if (d.bio && (d.bio as string).length > 300) return { ok: false, error: "Bio must be 300 chars or fewer" };
  if (d.iconUrl !== undefined && d.iconUrl !== null && typeof d.iconUrl !== "string") {
    return { ok: false, error: "iconUrl must be a string or null" };
  }
  return { ok: true, value: { bio: d.bio as string | undefined, iconUrl: d.iconUrl as string | null | undefined } };
}

export function validateWorkoutCreate(data: unknown): {
  ok: true; value: WorkoutCreateInput } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  const title = typeof d.title === "string" ? d.title.trim() : "";
  if (!title) return { ok: false, error: "Title is required" };
  if (title.length > 80) return { ok: false, error: "Title must be 80 chars or fewer" };
  const description = typeof d.description === "string" ? d.description.trim() : "";
  if (description.length > 400) return { ok: false, error: "Description must be 400 chars or fewer" };
  const isPublished = typeof d.isPublished === "boolean" ? d.isPublished : false;
  const exercises = Array.isArray(d.exercises) ? d.exercises : [];
  return { ok: true, value: { title, description, isPublished, exercises } };
}

export function validateWorkoutUpdate(data: unknown): {
  ok: true; value: WorkoutUpdateInput } | { ok: false; error: string } {
  if (!data || typeof data !== "object") return { ok: false, error: "Invalid payload" };
  const d = data as Record<string, unknown>;
  const result: WorkoutUpdateInput = {};
  if (d.title !== undefined) {
    if (typeof d.title !== "string" || !d.title.trim()) return { ok: false, error: "Title must be a non-empty string" };
    result.title = d.title.trim();
  }
  if (d.description !== undefined) result.description = typeof d.description === "string" ? d.description : "";
  if (d.isPublished !== undefined) result.isPublished = Boolean(d.isPublished);
  if (d.exercises !== undefined) result.exercises = Array.isArray(d.exercises) ? d.exercises : [];
  return { ok: true, value: result };
}
