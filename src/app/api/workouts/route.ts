import { NextRequest, NextResponse } from "next/server";
import { db, isDbAvailable } from "@/db";
import { mockStore } from "@/db/mock-store";
import {
  workouts,
  DEFAULT_VIBES,
  VIBE_AXES,
  type WorkoutLevel,
  type ExerciseRow,
  type Vibes,
} from "@/db/schema";

export const dynamic = "force-dynamic";

const LEVELS: WorkoutLevel[] = ["Beginner", "Intermediate", "Advanced", "Elite"];
const COVER_SEEDS = ["mint", "lilac", "sunset", "sky", "cloud"];

type PublishPayload = {
  title?: unknown;
  description?: unknown;
  cover?: unknown;
  exercises?: unknown;
  vibes?: unknown;
};

function sanitizeVibes(input: unknown): Vibes {
  const raw = (input ?? {}) as Record<string, unknown>;
  const out = { ...DEFAULT_VIBES };
  for (const axis of VIBE_AXES) {
    const v = Number(raw[axis]);
    if (Number.isFinite(v)) out[axis] = Math.min(100, Math.max(0, Math.round(v)));
  }
  return out;
}

/** Publish a Studio creation to the social feed. */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as PublishPayload | null;

  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const exercises: ExerciseRow[] = Array.isArray(body?.exercises)
    ? body.exercises
        .filter(
          (e): e is ExerciseRow =>
            !!e &&
            typeof (e as { name?: unknown }).name === "string" &&
            typeof (e as { sets?: unknown }).sets === "number" &&
            typeof (e as { reps?: unknown }).reps === "string",
        )
        .slice(0, 24)
        .map((e) => ({
          name: e.name.slice(0, 60),
          sets: Math.min(20, Math.max(1, Math.round(e.sets))),
          reps: String(e.reps).slice(0, 20),
          animation: typeof e.animation === "string" ? e.animation : null,
          animationId: typeof e.animationId === "string" ? e.animationId : null,
          animationName:
            typeof e.animationName === "string" ? e.animationName.slice(0, 40) : null,
          animationKind:
            e.animationKind === "image" ||
            e.animationKind === "video" ||
            e.animationKind === "lottie" ||
            e.animationKind === "3d"
              ? e.animationKind
              : null,
        }))
    : [];

  if (!title || exercises.length === 0) {
    return NextResponse.json(
      { error: "A title and at least one exercise are required." },
      { status: 400 },
    );
  }

  const vibes = sanitizeVibes(body?.vibes);

  if (!isDbAvailable) {
    const row = mockStore.addWorkout({ title, exercises, vibes });
    return NextResponse.json(row, { status: 201 });
  }

  const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);
  const durationMin = Math.max(5, Math.round(totalSets * 1.6));
  const level: WorkoutLevel = LEVELS[Math.min(3, Math.floor(totalSets / 8))];

  const [row] = await db
    .insert(workouts)
    .values({
      author: "You",
      authorHandle: "@you",
      avatarHue: 268,
      title: title.slice(0, 60),
      description: typeof body?.description === "string" && body.description.trim() ? body.description.trim().slice(0, 300) : (() => {
        const animated = exercises.filter((e) => e.animationId || e.animation).length;
        const base = `Built in the vyay Studio — ${exercises.length} moves, ${totalSets} sets.`;
        return animated > 0 ? `${base} ${animated} with custom animation.` : base;
      })(),
      level,
      durationMin,
      kcal: durationMin * 8,
      cover: typeof body?.cover === "string" && body.cover.trim() ? body.cover : null,
      coverSeed: COVER_SEEDS[Math.floor(Math.random() * COVER_SEEDS.length)],
      exercises,
      vibes,
      premium: false,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

