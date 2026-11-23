-- Migration: Add profiles and user_workouts tables
-- Backward compatible: existing users get a profile row on first use (upsert in API)

CREATE TABLE IF NOT EXISTS "profiles" (
  "user_id" text PRIMARY KEY NOT NULL,
  "bio" text DEFAULT '' NOT NULL,
  "icon_url" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "user_workouts" (
  "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "profiles"("user_id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text DEFAULT '' NOT NULL,
  "is_published" boolean DEFAULT false NOT NULL,
  "exercises" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "user_workouts_user_idx" ON "user_workouts" ("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "user_workouts_published_idx" ON "user_workouts" ("is_published", "created_at");
