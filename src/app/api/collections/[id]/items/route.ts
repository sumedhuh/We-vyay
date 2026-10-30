import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collectionItems, collections, workouts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Add a workout to a collection (idempotent via the unique index). */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { workoutId?: unknown } | null;
  const workoutId = typeof body?.workoutId === "string" ? body.workoutId : "";

  if (!workoutId) {
    return NextResponse.json({ error: "workoutId is required" }, { status: 400 });
  }

  const [col] = await db
    .select({ id: collections.id })
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (!col) return NextResponse.json({ error: "Collection not found" }, { status: 404 });

  const [w] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(eq(workouts.id, workoutId))
    .limit(1);
  if (!w) return NextResponse.json({ error: "Workout not found" }, { status: 404 });

  const [row] = await db
    .insert(collectionItems)
    .values({ collectionId: id, workoutId })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json(row ?? { collectionId: id, workoutId }, { status: 201 });
}

/** Remove a workout from a collection. */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const workoutId = searchParams.get("workoutId");
  if (!workoutId) {
    return NextResponse.json({ error: "workoutId is required" }, { status: 400 });
  }

  await db
    .delete(collectionItems)
    .where(
      and(
        eq(collectionItems.collectionId, id),
        eq(collectionItems.workoutId, workoutId),
      ),
    );

  return NextResponse.json({ ok: true });
}
