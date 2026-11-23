import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { profiles, userWorkouts } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { validateWorkoutCreate } from "@/lib/schemas/profile";

export const dynamic = "force-dynamic";

// Mock store for when DB is unavailable
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
const mockWorkoutsList: MockWorkout[] = [];

/** GET /api/user-workouts?userId=xxx[&published=true] */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  const publishedOnly = req.nextUrl.searchParams.get("published") === "true";

  if (!isDbAvailable) {
    const results = mockWorkoutsList.filter(
      (w) => w.userId === userId && (!publishedOnly || w.isPublished),
    );
    return NextResponse.json(results.reverse());
  }

  // Ensure profile exists first (backward compat)
  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing.length === 0) {
    await db.insert(profiles).values({ userId }).onConflictDoNothing();
  }

  const conditions = publishedOnly
    ? and(eq(userWorkouts.userId, userId), eq(userWorkouts.isPublished, true))
    : eq(userWorkouts.userId, userId);

  const rows = await db
    .select()
    .from(userWorkouts)
    .where(conditions)
    .orderBy(desc(userWorkouts.createdAt));

  return NextResponse.json(rows);
}

/** POST /api/user-workouts?userId=xxx — create a new custom workout */
export async function POST(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const validated = validateWorkoutCreate(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  const { title, description = "", isPublished = false, exercises = [] } = validated.value;

  if (!isDbAvailable) {
    const workout: MockWorkout = {
      id: crypto.randomUUID(),
      userId,
      title,
      description,
      isPublished,
      exercises,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockWorkoutsList.push(workout);
    return NextResponse.json(workout, { status: 201 });
  }

  // Ensure profile exists
  await db.insert(profiles).values({ userId }).onConflictDoNothing();

  const [row] = await db
    .insert(userWorkouts)
    .values({ userId, title, description, isPublished, exercises })
    .returning();

  return NextResponse.json(row, { status: 201 });
}
