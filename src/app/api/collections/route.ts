import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { collections, collectionItems, workouts } from "@/db/schema";
import { desc, eq, sql, inArray } from "drizzle-orm";

export const dynamic = "force-dynamic";

/** All collections with their size and up to 3 cover previews. */
export async function GET() {
  if (!isDbAvailable) {
    return NextResponse.json({ items: mockStore.getCollections() });
  }

  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      emoji: collections.emoji,
      createdAt: collections.createdAt,
    })
    .from(collections)
    .orderBy(desc(collections.createdAt));

  if (rows.length === 0) return NextResponse.json({ items: [] });

  const counts = await db
    .select({
      collectionId: collectionItems.collectionId,
      count: sql<number>`COUNT(*)::int`,
    })
    .from(collectionItems)
    .groupBy(collectionItems.collectionId);

  const countById = new Map(counts.map((c: typeof counts[number]) => [c.collectionId, Number(c.count)]));

  const covers = await db
    .select({
      collectionId: collectionItems.collectionId,
      cover: workouts.cover,
      coverSeed: workouts.coverSeed,
      createdAt: collectionItems.createdAt,
    })
    .from(collectionItems)
    .innerJoin(workouts, eq(workouts.id, collectionItems.workoutId))
    .where(
      inArray(
        collectionItems.collectionId,
        rows.map((r: typeof rows[number]) => r.id),
      ),
    )
    .orderBy(desc(collectionItems.createdAt));

  const byId = new Map<string, { cover: string | null; coverSeed: string }[]>();
  for (const c of covers) {
    const list = byId.get(c.collectionId) ?? [];
    if (list.length < 3) list.push({ cover: c.cover, coverSeed: c.coverSeed });
    byId.set(c.collectionId, list);
  }

  return NextResponse.json({
    items: rows.map((r: typeof rows[number]) => ({
      ...r,
      count: countById.get(r.id) ?? 0,
      covers: byId.get(r.id) ?? [],
    })),
  });
}

const EMOJI_FALLBACK = "📦";

/** Create a collection. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 32) : "";
  if (!name) {
    return NextResponse.json({ error: "Name your collection." }, { status: 400 });
  }

  const emoji =
    typeof body?.emoji === "string" && body.emoji.trim()
      ? [...body.emoji.trim()].slice(0, 3).join("")
      : EMOJI_FALLBACK;

  if (!isDbAvailable) {
    const col = mockStore.addCollection(name, emoji);
    return NextResponse.json(col, { status: 201 });
  }

  const [row] = await db.insert(collections).values({ name, emoji }).returning();
  return NextResponse.json({ ...row, count: 0, covers: [] }, { status: 201 });
}

