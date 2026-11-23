import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { userWorkouts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateWorkoutUpdate } from "@/lib/schemas/profile";

export const dynamic = "force-dynamic";

type MockWorkout = {
  id: string;
  userId: string;
  title: string;
  description: string;
  isPublished: boolean;
  exercises: unknown[];
  createdAt: string;
  updatedAt: string;
};

// Shared mock store (module-level singleton)
declare global {
  // eslint-disable-next-line no-var
  var __vyayMockWorkouts: MockWorkout[] | undefined;
}
const mockWorkoutsList: MockWorkout[] = globalThis.__vyayMockWorkouts ?? [];

/** PATCH /api/user-workouts/[id]?userId=xxx */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const validated = validateWorkoutUpdate(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  if (!isDbAvailable) {
    const idx = mockWorkoutsList.findIndex((w) => w.id === id && w.userId === userId);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    Object.assign(mockWorkoutsList[idx], { ...validated.value, updatedAt: new Date().toISOString() });
    return NextResponse.json(mockWorkoutsList[idx]);
  }

  const updates: Partial<typeof userWorkouts.$inferInsert> = {
    updatedAt: new Date().toISOString(),
  };
  if (validated.value.title !== undefined) updates.title = validated.value.title;
  if (validated.value.description !== undefined) updates.description = validated.value.description;
  if (validated.value.isPublished !== undefined) updates.isPublished = validated.value.isPublished;
  if (validated.value.exercises !== undefined) updates.exercises = validated.value.exercises as typeof userWorkouts.$inferSelect["exercises"];

  const [row] = await db
    .update(userWorkouts)
    .set(updates)
    .where(and(eq(userWorkouts.id, id), eq(userWorkouts.userId, userId)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

/** DELETE /api/user-workouts/[id]?userId=xxx */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (!isDbAvailable) {
    const idx = mockWorkoutsList.findIndex((w) => w.id === id && w.userId === userId);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    mockWorkoutsList.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }

  await db
    .delete(userWorkouts)
    .where(and(eq(userWorkouts.id, id), eq(userWorkouts.userId, userId)));

  return NextResponse.json({ ok: true });
}
