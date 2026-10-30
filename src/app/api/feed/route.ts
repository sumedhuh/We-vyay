import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { workouts } from "@/db/schema";
import { and, desc, or, lt, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Cursor-paginated feed. composite `${createdAt}|${id}` for stable ordering.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");
  const limit = Math.min(Number(searchParams.get("limit") ?? 6) || 6, 12);

  if (!isDbAvailable) {
    return NextResponse.json(mockStore.getFeed(cursor, limit));
  }

  let where = undefined;
  if (cursor) {
    const [ts, id] = cursor.split("|");
    const d = new Date(ts);
    if (!Number.isNaN(d.getTime()) && id) {
      where = or(
        lt(workouts.createdAt, d.toISOString()),
        and(eq(workouts.createdAt, d.toISOString()), lt(sql`${workouts.id}::text`, id)),
      );
    }
  }

  const rows = await db
    .select()
    .from(workouts)
    .where(where)
    .orderBy(desc(workouts.createdAt), desc(workouts.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];

  return NextResponse.json({
    items,
    nextCursor: hasMore && last ? `${last.createdAt}|${last.id}` : null,
  });
}

