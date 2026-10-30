import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { reviews, workouts } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** List reviews plus the 1–5 star distribution used by the review meter. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isDbAvailable) {
    return NextResponse.json(mockStore.getReviews(id));
  }

  try {
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.workoutId, id))
      .orderBy(desc(reviews.createdAt))
      .limit(40);

    const distribution = [0, 0, 0, 0, 0];
    let sum = 0;
    for (const r of rows) {
      const idx = Math.min(5, Math.max(1, r.rating)) - 1;
      distribution[idx] += 1;
      sum += r.rating;
    }

    return NextResponse.json({
      items: rows,
      count: rows.length,
      average: rows.length ? sum / rows.length : 0,
      distribution,
    });
  } catch (error: any) {
    console.error("[api/reviews] Database query failed, falling back to mock store:", error?.message || error);
    return NextResponse.json(mockStore.getReviews(id));
  }
}

/** Post a review and roll the aggregate onto the workout row. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as {
    rating?: unknown;
    comment?: unknown;
    author?: unknown;
  } | null;

  const rating = Math.round(Number(body?.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1–5." }, { status: 400 });
  }

  const comment =
    typeof body?.comment === "string" ? body.comment.trim().slice(0, 280) : "";
  const author =
    typeof body?.author === "string" && body.author.trim()
      ? body.author.trim().slice(0, 24)
      : "You";

  if (!isDbAvailable) {
    const row = mockStore.addReview(id, rating, comment, author);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row, { status: 201 });
  }

  const [exists] = await db
    .select({ id: workouts.id })
    .from(workouts)
    .where(eq(workouts.id, id))
    .limit(1);
  if (!exists) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [row] = await db
    .insert(reviews)
    .values({ workoutId: id, rating, comment, author })
    .returning();

  await db
    .update(workouts)
    .set({
      ratingSum: sql`${workouts.ratingSum} + ${rating}`,
      ratingCount: sql`${workouts.ratingCount} + 1`,
    })
    .where(eq(workouts.id, id));

  return NextResponse.json(row, { status: 201 });
}

