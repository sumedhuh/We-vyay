import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { follows, workouts } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** Followed creators, enriched with their public workout/like counts. */
export async function GET() {
  if (!isDbAvailable) {
    return NextResponse.json({ items: mockStore.getFollows() });
  }

  const rows = await db
    .select({
      handle: follows.handle,
      author: follows.author,
      avatarHue: follows.avatarHue,
      createdAt: follows.createdAt,
      workoutCount: sql<number>`(
        SELECT COUNT(*)::int FROM ${workouts} w WHERE w.author_handle = ${follows.handle}
      )`,
      likeCount: sql<number>`(
        SELECT COALESCE(SUM(w.likes), 0)::int FROM ${workouts} w
        WHERE w.author_handle = ${follows.handle}
      )`,
    })
    .from(follows)
    .orderBy(desc(follows.createdAt));

  return NextResponse.json({ items: rows });
}

/** Follow a creator (idempotent). */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const handle = typeof body?.handle === "string" ? body.handle.trim().slice(0, 32) : "";
  const author = typeof body?.author === "string" ? body.author.trim().slice(0, 40) : "";
  if (!handle || !author) {
    return NextResponse.json({ error: "handle and author are required" }, { status: 400 });
  }
  if (handle === "@you") {
    return NextResponse.json({ error: "You can't follow yourself." }, { status: 400 });
  }

  const hue = Number(body?.avatarHue);
  const avatarHue = Number.isFinite(hue) ? Math.abs(Math.round(hue)) % 360 : 160;

  if (!isDbAvailable) {
    const row = mockStore.addFollow(handle, author, avatarHue);
    return NextResponse.json(row, { status: 201 });
  }

  const [row] = await db
    .insert(follows)
    .values({
      handle,
      author,
      avatarHue,
    })
    .onConflictDoUpdate({ target: follows.handle, set: { author } })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

/** Unfollow. */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  if (!handle) {
    return NextResponse.json({ error: "handle is required" }, { status: 400 });
  }

  if (!isDbAvailable) {
    const row = mockStore.removeFollow(handle);
    return NextResponse.json(row);
  }

  const [row] = await db
    .delete(follows)
    .where(eq(follows.handle, handle))
    .returning({ handle: follows.handle });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ handle: row.handle });
}

