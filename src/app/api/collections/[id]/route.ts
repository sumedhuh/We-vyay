import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { collections, collectionItems, workouts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** A single collection with its full workout list. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const [meta] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (!meta) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rows = await db
    .select({ workout: workouts })
    .from(collectionItems)
    .innerJoin(workouts, eq(workouts.id, collectionItems.workoutId))
    .where(eq(collectionItems.collectionId, id))
    .orderBy(desc(collectionItems.createdAt));

  return NextResponse.json({ ...meta, items: rows.map((r: any) => r.workout) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const [row] = await db
    .delete(collections)
    .where(eq(collections.id, id))
    .returning({ id: collections.id });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ id: row.id });
}
