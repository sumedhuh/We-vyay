"use client";

import { memo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Heart,
  Dumbbell,
  ChevronLeft,
  UserCheck,
  UserPlus,
  Star,
  Loader2,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { FeedCard } from "@/components/feed/feed-card";
import {
  useFollowsQuery,
  useToggleFollow,
  useCreatorQuery,
} from "@/lib/queries/social";
import { haptic } from "@/lib/haptics";
import { formatCount } from "@/lib/utils";

/** Drill-down: one creator's profile and their published routines. */
const CreatorProfile = memo(function CreatorProfile({
  handle,
  onBack,
}: {
  handle: string;
  onBack: () => void;
}) {
  const { data, isPending } = useCreatorQuery(handle);
  const { data: follows = [] } = useFollowsQuery();
  const toggleFollow = useToggleFollow();
  const following = follows.some((f) => f.handle === handle);

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.18 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex min-h-9 cursor-pointer items-center gap-1 text-[12px] font-bold text-ink/55 outline-none dark:text-snow/50"
      >
        <ChevronLeft className="size-4" aria-hidden /> Following
      </button>

      {isPending || !data ? (
        <div aria-hidden className="mt-3 space-y-2">
          <div className="shimmer h-20 rounded-[1.4rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
          <div className="shimmer h-44 rounded-[1.9rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
        </div>
      ) : (
        <>
          <div className="surface-solid mt-3 flex items-center gap-3 rounded-[1.4rem] p-4">
            <span
              aria-hidden
              className="flex size-14 shrink-0 items-center justify-center rounded-full text-[20px] font-black text-white ring-2 ring-white/50"
              style={{
                background: `linear-gradient(135deg, hsl(${data.avatarHue} 80% 62%), hsl(${data.avatarHue + 40} 75% 45%))`,
              }}
            >
              {data.author.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[16px] font-bold text-ink dark:text-snow">
                {data.author}
              </p>
              <p className="text-[11px] text-ink/45 dark:text-snow/40">{data.handle}</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                <span className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-bold text-ink/60 dark:bg-white/[0.07] dark:text-snow/55">
                  <Dumbbell className="size-2.5" aria-hidden /> {data.items.length}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-bold text-ink/60 dark:bg-white/[0.07] dark:text-snow/55">
                  <Heart className="size-2.5" aria-hidden /> {formatCount(data.totalLikes)}
                </span>
                {data.avgRating > 0 && (
                  <span className="flex items-center gap-1 rounded-full bg-ink/[0.05] px-2 py-0.5 text-[10px] font-bold text-ink/60 dark:bg-white/[0.07] dark:text-snow/55">
                    <Star className="size-2.5 fill-[#f5b301] text-[#f5b301]" aria-hidden />
                    {data.avgRating.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              haptic(following ? "light" : "success");
              toggleFollow.mutate({
                handle: data.handle,
                author: data.author,
                avatarHue: data.avatarHue,
                following,
              });
            }}
            className={
              following
                ? "surface-solid mt-2 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full text-[12.5px] font-bold text-ink outline-none dark:text-snow"
                : "mt-2 flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[12.5px] font-bold text-pine outline-none dark:from-grape dark:to-iris dark:text-white"
            }
          >
            {following ? (
              <>
                <UserCheck className="size-4" aria-hidden /> Following
              </>
            ) : (
              <>
                <UserPlus className="size-4" aria-hidden /> Follow
              </>
            )}
          </button>

          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            their routines
          </p>
          <div className="mt-2 flex flex-col gap-3">
            {data.items.map((w) => (
              <FeedCard key={w.id} workout={w} />
            ))}
            {data.items.length === 0 && (
              <p className="rounded-[1.1rem] bg-ink/[0.03] px-4 py-5 text-center text-[12px] text-ink/45 dark:bg-white/[0.05] dark:text-snow/40">
                Nothing published yet.
              </p>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
});

export const FollowingSheet = memo(function FollowingSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: follows = [], isPending } = useFollowsQuery();
  const toggleFollow = useToggleFollow();
  const [viewing, setViewing] = useState<string | null>(null);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setViewing(null);
        onClose();
      }}
      label="Following"
      z={80}
    >
      <AnimatePresence mode="wait" initial={false}>
        {viewing ? (
          <CreatorProfile key="profile" handle={viewing} onBack={() => setViewing(null)} />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
              your circle
            </p>
            <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
              Following {follows.length > 0 && `· ${follows.length}`}
            </h3>
            <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
              Tap a profile to see everything they&apos;ve published.
            </p>

            <div className="mt-4 flex flex-col gap-1.5">
              {isPending ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-ink/30 dark:text-snow/30" />
                </div>
              ) : follows.length === 0 ? (
                <div className="flex flex-col items-center gap-1.5 rounded-[1.3rem] bg-ink/[0.03] px-4 py-8 text-center dark:bg-white/[0.05]">
                  <Users className="size-5 text-ink/30 dark:text-snow/30" aria-hidden />
                  <p className="text-[12.5px] font-bold text-ink/50 dark:text-snow/45">
                    Not following anyone yet
                  </p>
                  <p className="text-[10.5px] text-ink/35 dark:text-snow/30">
                    Hit Follow on any workout in the feed.
                  </p>
                </div>
              ) : (
                follows.map((f) => (
                  <motion.div
                    key={f.handle}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="surface-solid flex items-center gap-3 rounded-[1.3rem] p-3"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        setViewing(f.handle);
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none"
                    >
                      <span
                        aria-hidden
                        className="flex size-11 shrink-0 items-center justify-center rounded-full text-[15px] font-black text-white ring-2 ring-white/50 dark:ring-white/15"
                        style={{
                          background: `linear-gradient(135deg, hsl(${f.avatarHue} 80% 62%), hsl(${f.avatarHue + 40} 75% 45%))`,
                        }}
                      >
                        {f.author.slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-bold text-ink dark:text-snow">
                          {f.author}
                        </p>
                        <p className="truncate text-[10.5px] text-ink/45 dark:text-snow/40">
                          {f.handle} · {f.workoutCount} routines ·{" "}
                          {formatCount(f.likeCount)} likes
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic("light");
                        toggleFollow.mutate({
                          handle: f.handle,
                          author: f.author,
                          avatarHue: f.avatarHue,
                          following: true,
                        });
                      }}
                      aria-label={`Unfollow ${f.author}`}
                      className="shrink-0 cursor-pointer rounded-full bg-ink/[0.05] px-3 py-2 text-[11px] font-bold text-ink/55 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 dark:bg-white/[0.08] dark:text-snow/50"
                    >
                      Unfollow
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
});
