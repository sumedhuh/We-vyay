"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Dumbbell, Play, ArrowRight } from "lucide-react";
import { useUserWorkoutsQuery, type UserWorkout } from "@/lib/queries/user-workouts";
import { WorkoutEditorSheet } from "@/components/workouts/workout-editor-sheet";
import { useUiStore } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

/** Pastel color slots for workout mini-cards in the feed */
const LIGHT_SLOTS = [
  { bg: "#E8F4FD", text: "#1565C0", accent: "#BBDEFB" },
  { bg: "#F3E8FD", text: "#6A1B9A", accent: "#E1BEE7" },
  { bg: "#E8FDF3", text: "#1B5E20", accent: "#C8E6C9" },
  { bg: "#FDF3E8", text: "#E65100", accent: "#FFE0B2" },
];

const DARK_SLOTS = [
  { bg: "#1A2733", text: "#90CAF9", accent: "#0D1E2D" },
  { bg: "#231A33", text: "#CE93D8", accent: "#1A0D2D" },
  { bg: "#1A2E1F", text: "#A5D6A7", accent: "#0D2114" },
  { bg: "#2E251A", text: "#FFCC80", accent: "#1E180D" },
];

type Props = {
  /** Called when user wants to start a workout (triggers routine player) */
  onStartWorkout?: (workout: UserWorkout) => void;
};

export function UserWorkoutsFeed({ onStartWorkout }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const slots = isDark ? DARK_SLOTS : LIGHT_SLOTS;

  const { data: workouts = [], isLoading } = useUserWorkoutsQuery();
  const setTab = useUiStore((s) => s.setTab);
  const [editorOpen, setEditorOpen] = useState(false);

  const handleSeeAll = useCallback(() => {
    haptic("light");
    setTab("workouts");
  }, [setTab]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="h-6 w-36 animate-pulse rounded-full bg-black/8 dark:bg-white/8" />
          <div className="h-5 w-16 animate-pulse rounded-full bg-black/5 dark:bg-white/5" />
        </div>
        <div className="h-[120px] animate-pulse rounded-[2rem] bg-black/5 dark:bg-white/5" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {/* Section header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[22px] font-bold tracking-tight text-black dark:text-white">
            My Workouts
          </h3>
          <button
            type="button"
            onClick={handleSeeAll}
            className="flex items-center gap-1 text-[13px] font-bold text-mint-deep dark:text-amethyst outline-none"
          >
            See all <ArrowRight className="size-3.5" />
          </button>
        </div>

        {workouts.length === 0 ? (
          /* Empty state — invite to create */
          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              haptic("light");
              setEditorOpen(true);
            }}
            className="flex items-center gap-4 rounded-[2rem] border border-black/8 dark:border-white/8 bg-black/3 dark:bg-white/4 p-5 text-left outline-none"
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-mint/25 dark:bg-grape/20">
              <Dumbbell className="size-6 text-mint-deep dark:text-amethyst" aria-hidden />
            </div>
            <div className="flex-1">
              <p className="text-[14px] font-bold text-black dark:text-white">
                Create your first workout
              </p>
              <p className="mt-0.5 text-[12px] text-black/50 dark:text-white/40">
                Build a custom routine and track it here
              </p>
            </div>
            <Plus className="size-5 shrink-0 text-black/30 dark:text-white/30" aria-hidden />
          </motion.button>
        ) : (
          /* Horizontal scroll list of workout cards */
          <div className="relative -mx-5 overflow-x-auto px-5">
            <div className="flex gap-3 pb-2" style={{ width: "max-content" }}>
              {/* Quick "Create" pill at start */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => {
                  haptic("light");
                  setEditorOpen(true);
                }}
                className="flex h-[120px] w-[88px] shrink-0 flex-col items-center justify-center gap-2 rounded-[1.6rem] border border-dashed border-black/15 dark:border-white/15 bg-transparent outline-none"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-mint/20 dark:bg-grape/20">
                  <Plus className="size-5 text-mint-deep dark:text-amethyst" aria-hidden />
                </div>
                <span className="text-[10px] font-bold text-black/40 dark:text-white/35 text-center leading-tight">
                  New
                </span>
              </motion.button>

              {/* Workout cards */}
              {workouts.slice(0, 8).map((workout, i) => {
                const slot = slots[i % slots.length];
                return (
                  <WorkoutFeedCard
                    key={workout.id}
                    workout={workout}
                    bg={slot.bg}
                    text={slot.text}
                    accent={slot.accent}
                    onStart={onStartWorkout}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      <WorkoutEditorSheet
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        workout={null}
      />
    </>
  );
}

function WorkoutFeedCard({
  workout,
  bg,
  text,
  accent,
  onStart,
}: {
  workout: UserWorkout;
  bg: string;
  text: string;
  accent: string;
  onStart?: (w: UserWorkout) => void;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.96 }}
      className="relative flex h-[120px] w-[160px] shrink-0 flex-col justify-between overflow-hidden rounded-[1.6rem] p-4"
      style={{ backgroundColor: bg }}
    >
      {/* Published dot */}
      {workout.isPublished && (
        <span
          className="absolute right-3 top-3 size-2 rounded-full bg-[#4CAF50]"
          aria-label="Published"
        />
      )}

      <div>
        <p
          className="text-[13px] font-black tracking-tight leading-tight line-clamp-2"
          style={{ color: text }}
        >
          {workout.title}
        </p>
        <p className="mt-1 text-[10px] font-semibold text-black/40">
          {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          haptic("medium");
          onStart?.(workout);
        }}
        aria-label={`Start ${workout.title}`}
        className="mt-auto flex h-8 w-8 items-center justify-center rounded-full self-end outline-none"
        style={{ backgroundColor: accent }}
      >
        <Play className="size-3.5 fill-current" style={{ color: text }} aria-hidden />
      </button>
    </motion.div>
  );
}
