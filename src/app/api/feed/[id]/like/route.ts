import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { workouts } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => null)) as { liked?: boolean } | null;
  const liked = body?.liked === true;

  if (!isDbAvailable) {
    const res = mockStore.toggleLike(id, liked);
    if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(res);
  }

  const [row] = await db
    .update(workouts)
    .set({
      liked,
      likes: sql`GREATEST(${workouts.likes} + ${liked ? 1 : -1}, 0)`,
    })
    .where(eq(workouts.id, id))
    .returning({ likes: workouts.likes, liked: workouts.liked });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

