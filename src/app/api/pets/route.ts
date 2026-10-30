import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import { pets, type AnimationKind } from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

const PERSONALITIES = ["playful", "zen", "fierce", "goofy"];
const HEX = /^#[0-9a-f]{6}$/i;

/** The user's custom pet roster. */
export async function GET() {
  if (!isDbAvailable) {
    return NextResponse.json({ items: mockStore.getPets() });
  }

  const rows = await db
    .select()
    .from(pets)
    .orderBy(desc(pets.createdAt))
    .limit(60);
  return NextResponse.json({ items: rows });
}

/** Create a custom pet from uploaded artwork + personality metadata. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 20) : "";
  if (!name) {
    return NextResponse.json({ error: "Give your pet a name." }, { status: 400 });
  }

  const kind = body?.assetKind;
  const assetKind: AnimationKind | null =
    kind === "image" || kind === "video" || kind === "lottie" ? kind : null;
  const assetId = typeof body?.assetId === "string" ? body.assetId : null;

  if (!assetId || !assetKind) {
    return NextResponse.json(
      { error: "Upload an image or animation for your pet." },
      { status: 400 },
    );
  }

  const personality =
    typeof body?.personality === "string" && PERSONALITIES.includes(body.personality)
      ? body.personality
      : "playful";

  const furHex =
    typeof body?.furHex === "string" && HEX.test(body.furHex) ? body.furHex : "#7fe7bb";

  const bio = typeof body?.bio === "string" ? body.bio.trim().slice(0, 80) : "";
  const assetName = typeof body?.assetName === "string" ? body.assetName.slice(0, 40) : null;

  if (!isDbAvailable) {
    const pet = mockStore.addPet({
      name,
      bio,
      personality,
      furHex,
      assetId,
      assetName,
      assetKind,
    });
    return NextResponse.json(pet, { status: 201 });
  }

  const [row] = await db
    .insert(pets)
    .values({
      name,
      bio,
      personality,
      furHex,
      assetId,
      assetName,
      assetKind,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

