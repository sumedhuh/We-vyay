import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import {
  exercises,
  DEFAULT_VIBES,
  VIBE_AXES,
  type Vibes,
  type ExerciseMode,
  type AnimationKind,
} from "@/db/schema";
import { desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

function sanitizeVibes(input: unknown): Vibes {
  const raw = (input ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_VIBES };
  for (const axis of VIBE_AXES) {
    const v = Number(raw[axis]);
    if (Number.isFinite(v)) out[axis] = Math.min(100, Math.max(0, Math.round(v)));
  }
  return out;
}

/** The user's custom exercise library. */
export async function GET() {
  if (!isDbAvailable) {
    return NextResponse.json({ items: mockStore.getExercises() });
  }

  const rows = await db
    .select()
    .from(exercises)
    .orderBy(desc(exercises.createdAt))
    .limit(80);
  return NextResponse.json({ items: rows });
}

/** Create a custom exercise: name, emoji, vibe profile, defaults, animation. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;

  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 32) : "";
  if (!name) {
    return NextResponse.json({ error: "Give the exercise a name." }, { status: 400 });
  }

  const emoji =
    typeof body?.emoji === "string" && body.emoji.trim()
      ? [...body.emoji.trim()].slice(0, 3).join("")
      : "💪";

  const mode: ExerciseMode = body?.mode === "time" ? "time" : "reps";
  const clampInt = (v: unknown, min: number, max: number, fallback: number) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  const kind = body?.animationKind;
  const animationKind: AnimationKind | null =
    kind === "image" || kind === "video" || kind === "lottie" ? kind : null;

  const tag = typeof body?.tag === "string" ? body.tag.trim().slice(0, 20) || "custom" : "custom";
  const vibes = sanitizeVibes(body?.vibes);
  const defaultSets = clampInt(body?.defaultSets, 1, 20, 3);
  const defaultReps = clampInt(body?.defaultReps, 1, 200, 12);
  const defaultSeconds = clampInt(body?.defaultSeconds, 5, 3600, 45);
  const animationId = typeof body?.animationId === "string" ? body.animationId : null;
  const animationName =
    typeof body?.animationName === "string"
      ? body.animationName.slice(0, 40)
      : null;

  if (!isDbAvailable) {
    const ex = mockStore.addExercise({
      name,
      emoji,
      tag,
      vibes,
      mode,
      defaultSets,
      defaultReps,
      defaultSeconds,
      animationId,
      animationName,
      animationKind,
    });
    return NextResponse.json(ex, { status: 201 });
  }

  const [row] = await db
    .insert(exercises)
    .values({
      name,
      emoji,
      tag,
      vibes,
      mode,
      defaultSets,
      defaultReps,
      defaultSeconds,
      animationId,
      animationName,
      animationKind,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

