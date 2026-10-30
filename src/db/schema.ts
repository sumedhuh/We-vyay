import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export type AnimationKind = "image" | "video" | "lottie" | "3d";

export type ExerciseRow = {
  name: string;
  sets: number;
  reps: string;
  /** built-in motion preset key (pulse | wave | orbit | pop) */
  animation?: string | null;
  /** uploaded custom animation reference */
  animationId?: string | null;
  animationName?: string | null;
  animationKind?: AnimationKind | null;
};

export type WorkoutLevel = "Beginner" | "Intermediate" | "Advanced" | "Elite";

/** The five vibe axes plotted on every workout's radar chart (0–100). */
export const VIBE_AXES = [
  "cardio",
  "strength",
  "mobility",
  "intensity",
  "endurance",
] as const;

export type VibeAxis = (typeof VIBE_AXES)[number];
export type Vibes = Record<VibeAxis, number>;

export const DEFAULT_VIBES: Vibes = {
  cardio: 50,
  strength: 50,
  mobility: 40,
  intensity: 50,
  endurance: 45,
};

export const workouts = pgTable(
  "workouts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    author: text("author").notNull(),
    authorHandle: text("author_handle").notNull(),
    avatarHue: integer("avatar_hue").notNull().default(160),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    level: text("level").$type<WorkoutLevel>().notNull().default("Beginner"),
    durationMin: integer("duration_min").notNull().default(20),
    kcal: integer("kcal").notNull().default(0),
    // Remote cover image (Pexels). Null => cosmetic gradient cover via coverSeed.
    cover: text("cover"),
    coverSeed: text("cover_seed").notNull().default("mint"),
    exercises: jsonb("exercises").$type<ExerciseRow[]>().notNull().default([]),
    /** Creator-authored vibe profile, drives the radar chart. */
    vibes: jsonb("vibes").$type<Vibes>().notNull().default(DEFAULT_VIBES),
    premium: boolean("premium").notNull().default(false),
    likes: integer("likes").notNull().default(0),
    liked: boolean("liked").notNull().default(false),
    /** Denormalized rating aggregates so the feed never needs a join. */
    ratingSum: integer("rating_sum").notNull().default(0),
    ratingCount: integer("rating_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("workouts_created_id_idx").on(t.createdAt, t.id)],
);

export type Workout = typeof workouts.$inferSelect;
export type NewWorkout = typeof workouts.$inferInsert;

/** Creators the user follows. Handle is the stable identity in this demo. */
export const follows = pgTable("follows", {
  handle: text("handle").primaryKey(),
  author: text("author").notNull(),
  avatarHue: integer("avatar_hue").notNull().default(160),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type Follow = typeof follows.$inferSelect;

/** Saved lists of workouts — "to do", "loved", "leg day", anything. */
export const collections = pgTable("collections", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("📦"),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type Collection = typeof collections.$inferSelect;
export type CollectionWithMeta = Collection & {
  count: number;
  covers: { cover: string | null; coverSeed: string }[];
};

export const collectionItems = pgTable(
  "collection_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "cascade" }),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // one workout can't be saved to the same collection twice
    uniqueIndex("collection_items_unique").on(t.collectionId, t.workoutId),
    index("collection_items_workout_idx").on(t.workoutId),
  ],
);

export type CollectionItem = typeof collectionItems.$inferSelect;

/**
 * User-created pets. A custom pet is any uploaded artwork (GIF/PNG/WebP/
 * video/Lottie) plus its personality metadata — so people aren't limited to
 * the built-in 3D companion.
 */
export const pets = pgTable("pets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  bio: text("bio").notNull().default(""),
  personality: text("personality").notNull().default("playful"),
  furHex: text("fur_hex").notNull().default("#7fe7bb"),
  assetId: uuid("asset_id"),
  assetName: text("asset_name"),
  assetKind: text("asset_kind").$type<AnimationKind>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type CustomPet = typeof pets.$inferSelect;

/** How an exercise is measured: countable reps, or a held/worked duration. */
export type ExerciseMode = "reps" | "time";

/**
 * The user's custom exercise library. Each exercise carries its OWN vibe
 * profile, so a workout's overall vibe can be derived from whatever the
 * creator drags onto the canvas plus the volume they choose.
 */
export const exercises = pgTable("exercises", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull().default("💪"),
  tag: text("tag").notNull().default("custom"),
  vibes: jsonb("vibes").$type<Vibes>().notNull().default(DEFAULT_VIBES),
  mode: text("mode").$type<ExerciseMode>().notNull().default("reps"),
  defaultSets: integer("default_sets").notNull().default(3),
  defaultReps: integer("default_reps").notNull().default(12),
  defaultSeconds: integer("default_seconds").notNull().default(45),
  animationId: uuid("animation_id"),
  animationName: text("animation_name"),
  animationKind: text("animation_kind").$type<AnimationKind>(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type CustomExercise = typeof exercises.$inferSelect;

/** Reviews — one row per rating, aggregates denormalized onto `workouts`. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workoutId: uuid("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    author: text("author").notNull(),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("reviews_workout_idx").on(t.workoutId, t.createdAt)],
);

export type Review = typeof reviews.$inferSelect;

/**
 * User-uploaded workout animations (GIF/WebP/PNG, MP4/WebM, or Lottie JSON).
 * Bytes live as base64 text and are streamed back by /api/animations/[id]/raw
 * with immutable cache headers, so the payload is fetched once per client.
 */
export const animations = pgTable("animations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").$type<AnimationKind>().notNull(),
  mime: text("mime").notNull(),
  bytes: integer("bytes").notNull().default(0),
  data: text("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
    .notNull()
    .defaultNow(),
});

export type Animation = typeof animations.$inferSelect;
/** Listing shape — never ships the heavy `data` column to the client. */
export type AnimationMeta = Omit<Animation, "data">;
