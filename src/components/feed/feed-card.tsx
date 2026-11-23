"use client";

import { memo, useCallback, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Heart,
  Clock3,
  Flame,
  ListChecks,
  Lock,
  ArrowRight,
  Bookmark,
  UserPlus,
  UserCheck,
} from "lucide-react";
import type { Workout } from "@/db/schema";
import { cn, formatCount, timeAgo } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { useLikeMutation } from "@/lib/queries/feed";
import { useProStore } from "@/stores/pro-store";
import { useUiStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { WorkoutDetailSheet } from "./workout-detail-sheet";
import { vibeSummary } from "./vibe-chart";
import { CategoryBadge } from "./review-meter";
import { SaveToCollectionSheet } from "@/components/collections/save-to-collection";
import { useFollowsQuery, useToggleFollow } from "@/lib/queries/social";
import { RoutinePlayer } from "@/components/fitness/RoutinePlayer";

/** Local gradient covers for Studio-made posts (no remote image yet). */
const SEED_GRADIENTS: Record<string, string> = {
  mint: "from-[#baf3d6] via-[#8fe6bf] to-[#5ed3a1]",
  lilac: "from-[#d9c8ff] via-[#b49af5] to-[#8b5cf6]",
  sunset: "from-[#ffd5c2] via-[#ffb199] to-[#f2876b]",
  sky: "from-[#c4e4ff] via-[#9bcbf7] to-[#67a8e8]",
  cloud: "from-[#f1ede6] via-[#dcd5c8] to-[#bcb3a2]",
};

export type FeedCardTheme = {
  bg: string;
  contrastBg: string;
  contrastText: string;
};

export const FeedCard = memo(function FeedCard({ 
  workout, 
  theme 
}: { 
  workout: Workout;
  theme?: FeedCardTheme;
}) {
  const like = useLikeMutation();
  const isPro = useProStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  const avatarColor = useSettingsStore((s) => s.avatarColor);
  const pushToast = useUiStore((s) => s.pushToast);
  const locked = workout.premium && !isPro;
  const [detailOpen, setDetailOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [playerOpen, setPlayerOpen] = useState(false);
  const { data: follows = [] } = useFollowsQuery();
  const toggleFollow = useToggleFollow();
  const following = follows.some((f) => f.handle === workout.authorHandle);

  const toggleLike = useCallback(() => {
    haptic("medium");
    like.mutate({ id: workout.id, liked: !workout.liked });
  }, [like, workout.id, workout.liked]);

  const start = useCallback(() => {
    if (locked) {
      haptic("light");
      pushToast({ title: "Pro routine", message: "unlock with vyay pro", tone: "grape" });
      openPro();
      return;
    }
    haptic("medium");
    setDetailOpen(true); // reveal everything inside the routine
  }, [locked, pushToast, openPro]);

  const gradient = SEED_GRADIENTS[workout.coverSeed] ?? SEED_GRADIENTS.mint;
  const isMine = workout.authorHandle === "@you";
  const vibe = vibeSummary(workout.vibes);
  const avgRating =
    workout.ratingCount > 0 ? workout.ratingSum / workout.ratingCount : 0;

  return (
    <article 
      className={cn("shadow-soft overflow-hidden rounded-[1.9rem]", !theme && "surface-solid")}
      style={theme ? { backgroundColor: theme.bg } : undefined}
    >
      {/* media */}
      <div className="relative aspect-video overflow-hidden">
        {workout.cover ? (
          <Image
            src={workout.cover}
            alt={workout.title}
            fill
            sizes="400px"
            className={cn("object-cover", locked && "scale-105 blur-[3px]")}
          />
        ) : (
          <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)}>
            <span className="font-display absolute -bottom-7 left-4 select-none text-[104px] italic leading-none text-white/45">
              {workout.exercises.length}x
            </span>
          </div>
        )}

        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {/* top-left chips */}
        <div className="absolute left-3 top-3 flex gap-1.5">
          <span className="rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
            {workout.level}
          </span>
          {workout.premium && (
            <span className="flex items-center gap-1 rounded-full bg-gradient-to-r from-grape to-iris px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              <Lock className="size-3" aria-hidden /> pro
            </span>
          )}
        </div>
        <span className="absolute right-3 top-3 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
          {timeAgo(workout.createdAt)}
        </span>

        {/* author */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <span
            aria-hidden
            className="flex size-8 items-center justify-center rounded-full text-[11px] font-black text-white ring-2 ring-white/50"
            style={{
              background: isMine
                ? `linear-gradient(135deg, ${avatarColor}, color-mix(in oklab, ${avatarColor} 55%, #000))`
                : `linear-gradient(135deg, hsl(${workout.avatarHue} 80% 62%), hsl(${workout.avatarHue + 40} 75% 45%))`,
            }}
          >
            {workout.author.slice(0, 1).toUpperCase()}
          </span>
          <div className="leading-tight">
            <p className="text-[12px] font-bold text-white">{workout.author}</p>
            <p className="text-[10px] text-white/70">{workout.authorHandle}</p>
          </div>
          {!isMine && (
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                haptic(following ? "light" : "success");
                toggleFollow.mutate({
                  handle: workout.authorHandle,
                  author: workout.author,
                  avatarHue: workout.avatarHue,
                  following,
                });
              }}
              aria-pressed={following}
              aria-label={following ? `Unfollow ${workout.author}` : `Follow ${workout.author}`}
              className={cn(
                "ml-1 flex min-h-8 cursor-pointer items-center gap-1 rounded-full px-2.5 text-[10.5px] font-bold outline-none backdrop-blur transition-colors",
                following
                  ? "bg-white/20 text-white"
                  : "bg-white text-ink hover:bg-white/90",
              )}
            >
              {following ? (
                <>
                  <UserCheck className="size-3" aria-hidden /> Following
                </>
              ) : (
                <>
                  <UserPlus className="size-3" aria-hidden /> Follow
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* body */}
      <div className="px-4 pb-4 pt-3">
        <h3 
          className={cn(
            "text-[16px] font-bold tracking-wider w-fit rounded-full",
            theme ? "px-3 py-1" : "text-ink dark:text-snow"
          )}
          style={theme ? { backgroundColor: theme.contrastBg, color: theme.contrastText } : undefined}
        >
          {workout.title}
        </h3>
        {workout.description ? (
          <p className="mt-1 line-clamp-2 text-[12.5px] font-medium text-white">
            {workout.description}
          </p>
        ) : null}

        {/* vibe + rating strip */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span 
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide",
              theme ? "" : "bg-mint/30 text-pine dark:bg-grape/25 dark:text-lilac"
            )}
            style={theme ? { backgroundColor: theme.contrastBg, color: theme.contrastText } : undefined}
          >
            {vibe.label}
          </span>
          {workout.ratingCount > 0 ? (
            <span className="flex items-center gap-1">
              <CategoryBadge value={avgRating} />
              <span className="text-[10px] text-ink/40 dark:text-snow/35">
                ({workout.ratingCount})
              </span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-ink/35 dark:text-snow/30">
              no reviews yet
            </span>
          )}
        </div>

        <div className="mt-2.5 flex items-center gap-3 text-[11px] font-semibold text-white">
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" aria-hidden /> {workout.durationMin}m
          </span>
          <span className="flex items-center gap-1">
            <Flame className="size-3.5" aria-hidden /> {workout.kcal} kcal
          </span>
          <span className="flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden /> {workout.exercises.length} moves
          </span>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-ink/6 pt-3 dark:border-white/8">
          <motion.button
            type="button"
            whileTap={{ scale: 0.82 }}
            onClick={toggleLike}
            aria-pressed={workout.liked}
            aria-label={workout.liked ? "Unlike" : "Like"}
            className="flex cursor-pointer items-center gap-1.5 outline-none"
          >
            <motion.span
              key={workout.liked ? "on" : "off"}
              // pop: spring overshoot sells the "filled" transition without a timeline
              initial={{ scale: 0.4 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 700, damping: 18 }}
              className="flex"
            >
              <Heart
                className={cn(
                  "size-[18px]",
                  workout.liked
                    ? "fill-[#f43f6e] text-[#f43f6e]"
                    : "text-white",
                )}
                aria-hidden
              />
            </motion.span>
            <span className="text-[12px] font-bold text-white">
              {formatCount(workout.likes)}
            </span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.85 }}
            onClick={() => {
              haptic("light");
              setSaveOpen(true);
            }}
            aria-label="Save to a collection"
            className="-ml-1 flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-2 outline-none"
          >
            <Bookmark className="size-[17px] text-white" aria-hidden />
            <span className="text-[12px] font-bold text-white">Save</span>
          </motion.button>

          <motion.button
            type="button"
            whileTap={{ scale: 0.94 }}
            onClick={start}
            className={cn(
              "flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-4 text-[12px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
              locked
                ? "bg-gradient-to-r from-grape to-iris text-white"
                : "bg-gradient-to-r from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white",
            )}
          >
            {locked ? "Unlock" : "Start"} <ArrowRight className="size-3.5" aria-hidden />
          </motion.button>
        </div>
      </div>

      {/* Sheet only mounts its tree while open (AnimatePresence), so a long
          feed never pays for detail views the user hasn't opened. */}
      <WorkoutDetailSheet
        workout={workout}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onStartPlayer={() => {
          setDetailOpen(false);
          setTimeout(() => setPlayerOpen(true), 300);
        }}
      />
      <SaveToCollectionSheet
        workoutId={workout.id}
        workoutTitle={workout.title}
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
      />
      <RoutinePlayer
        workout={workout}
        open={playerOpen}
        onClose={() => setPlayerOpen(false)}
      />
    </article>
  );
});
