import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { workouts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** A creator's public profile: their routines, newest first. */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const decoded = decodeURIComponent(handle);

  if (!isDbAvailable) {
    const items = mockStore.getWorkoutsByHandle(decoded);
    const totalLikes = items.reduce((acc: number, w: typeof items[number]) => acc + w.likes, 0);
    const rated = items.filter((w: typeof items[number]) => w.ratingCount > 0);
    const avgRating = rated.length
      ? rated.reduce((acc: number, w: typeof items[number]) => acc + w.ratingSum / w.ratingCount, 0) / rated.length
      : 0;

    return NextResponse.json({
      handle: decoded,
      author: items[0]?.author ?? decoded,
      avatarHue: items[0]?.avatarHue ?? 160,
      items,
      totalLikes,
      avgRating,
    });
  }

  const items = await db
    .select()
    .from(workouts)
    .where(eq(workouts.authorHandle, decoded))
    .orderBy(desc(workouts.createdAt))
    .limit(40);

  const totalLikes = items.reduce((acc: number, w: typeof items[number]) => acc + w.likes, 0);
  const rated = items.filter((w: typeof items[number]) => w.ratingCount > 0);
  const avgRating = rated.length
    ? rated.reduce((acc: number, w: typeof items[number]) => acc + w.ratingSum / w.ratingCount, 0) / rated.length
    : 0;

  return NextResponse.json({
    handle: decoded,
    author: items[0]?.author ?? decoded,
    avatarHue: items[0]?.avatarHue ?? 160,
    items,
    totalLikes,
    avgRating,
  });
}

