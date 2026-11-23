import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateProfileUpdate } from "@/lib/schemas/profile";

export const dynamic = "force-dynamic";

// Mock in-memory profile store (used when DB is unavailable)
const mockProfiles = new Map<string, { userId: string; bio: string; iconUrl: string | null; createdAt: string; updatedAt: string }>();

function getMockProfile(userId: string) {
  if (!mockProfiles.has(userId)) {
    mockProfiles.set(userId, {
      userId,
      bio: "",
      iconUrl: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return mockProfiles.get(userId)!;
}

/** GET /api/profile?userId=xxx — fetch or lazily create a profile */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  if (!isDbAvailable) {
    return NextResponse.json(getMockProfile(userId));
  }

  const existing = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
  if (existing.length > 0) return NextResponse.json(existing[0]);

  // Lazy-create profile for backward compatibility (new users who haven't set up a profile)
  const [created] = await db.insert(profiles).values({ userId }).returning();
  return NextResponse.json(created);
}

/** PATCH /api/profile?userId=xxx — update profile fields */
export async function PATCH(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const validated = validateProfileUpdate(body);
  if (!validated.ok) return NextResponse.json({ error: validated.error }, { status: 400 });

  const { bio, iconUrl } = validated.value;
  const updates: Partial<{ bio: string; iconUrl: string | null; updatedAt: string }> = {
    updatedAt: new Date().toISOString(),
  };
  if (bio !== undefined) updates.bio = bio;
  if (iconUrl !== undefined) updates.iconUrl = iconUrl;

  if (!isDbAvailable) {
    const profile = getMockProfile(userId);
    Object.assign(profile, updates);
    return NextResponse.json(profile);
  }

  // Upsert for backward compat — profile may not exist yet
  const [row] = await db
    .insert(profiles)
    .values({ userId, bio: bio ?? "", iconUrl: iconUrl ?? null })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: updates,
    })
    .returning();

  return NextResponse.json(row);
}
