"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useReviewsQuery, useAddReview } from "@/lib/queries/reviews";
import { useSettingsStore } from "@/stores/settings-store";
import { haptic } from "@/lib/haptics";
import { cn, timeAgo } from "@/lib/utils";

const RATING_MAP = [
  { id: 1, label: "Skip", color: "#ff5a79" },
  { id: 2, label: "Performative", color: "#ffb703" },
  { id: 3, label: "Go for it", color: "#00d084" },
  { id: 4, label: "Perfection", color: "#a855f7" },
];

export const CategoryBadge = memo(function CategoryBadge({ value }: { value: number }) {
  const mapped = value >= 4.2 ? 4 : value >= 3.2 ? 3 : value >= 2.2 ? 2 : 1;
  const cat = RATING_MAP.find(c => c.id === mapped) || RATING_MAP[3];

  return (
    <span className="rounded-full px-2 py-0.5 text-[9.5px] uppercase tracking-wide font-black text-white shadow-sm" style={{ backgroundColor: cat.color }}>
      {cat.label}
    </span>
  );
});

export const GaugeChart = memo(function GaugeChart({ counts, total }: { counts: number[], total: number }) {
  const radius = 80;
  const cx = 100;
  const cy = 104;
  const strokeWidth = 26;
  const pathLength = Math.PI * radius; // 282.743
  
  const maxCount = Math.max(0, ...counts);
  const maxPercent = total > 0 ? Math.round((maxCount / total) * 100) : 0;

  let currentOffset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[200px] h-[110px]">
        {/* Background track */}
        <svg viewBox="0 0 200 110" className="absolute inset-0 w-full h-full drop-shadow-md">
          <path
            d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-ink/10 dark:text-white/10"
            strokeLinecap="butt"
          />
          {total > 0 && counts.map((count, i) => {
            if (count === 0) return null;
            const segmentLength = (count / total) * pathLength;
            const offset = currentOffset;
            currentOffset += segmentLength;
            const drawLength = Math.max(0, segmentLength - 2); 
            
            return (
              <path
                key={i}
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none"
                stroke={RATING_MAP[i].color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${drawLength} ${pathLength}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-2">
          <p className="font-display text-3xl font-bold text-ink dark:text-snow leading-none">
            {maxPercent}%
          </p>
          <p className="text-[10px] font-semibold text-ink/50 dark:text-snow/50 mt-1">
            {maxCount}/{total} Votes
          </p>
        </div>
      </div>

      <div className="flex justify-between w-full mt-4">
        {RATING_MAP.map((r, i) => {
          const pct = total > 0 ? Math.round((counts[i] / total) * 100) : 0;
          return (
            <div key={r.id} className="flex items-center gap-1.5 text-[9.5px] font-semibold text-ink/70 dark:text-snow/70">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
              <span className="hidden sm:inline tracking-tight">{r.label}</span>
              <span className="font-bold text-ink dark:text-snow">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const CategoryInput = memo(function CategoryInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const fireConfetti = async () => {
    try {
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#d8b4fe"],
        zIndex: 9999,
      });
    } catch (e) {
      // ignore
    }
  };

  return (
    <div
      className="flex relative items-center gap-1 rounded-full bg-ink/5 p-1 dark:bg-white/5"
      role="radiogroup"
      aria-label="Your rating"
    >
      {RATING_MAP.map((r) => {
        const isSelected = value === r.id;
        return (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => {
              haptic("selection");
              onChange(r.id);
              if (r.id === 4) fireConfetti();
            }}
            className={cn(
              "relative flex-1 z-10 rounded-full px-2 py-1.5 text-[11.5px] font-bold transition-colors outline-none",
              isSelected
                ? "text-white"
                : "text-ink/60 dark:text-snow/60 hover:text-ink dark:hover:text-snow",
            )}
          >
            {isSelected && (
              <motion.div
                layoutId="active-rating-pill"
                className="absolute inset-0 z-[-1] rounded-full shadow-sm"
                style={{ backgroundColor: r.color }}
                initial={false}
                transition={{ type: "spring", stiffness: 450, damping: 30 }}
              />
            )}
            {r.label}
          </button>
        );
      })}
    </div>
  );
});

export const ReviewMeter = memo(function ReviewMeter({
  workoutId,
  enabled,
}: {
  workoutId: string;
  enabled: boolean;
}) {
  const { data, isPending } = useReviewsQuery(workoutId, enabled);
  const add = useAddReview(workoutId);
  const displayName = useSettingsStore((s) => s.displayName);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [open, setOpen] = useState(false);

  const submit = useCallback(() => {
    if (rating < 1 || add.isPending) return;
    haptic("success");
    add.mutate(
      { rating, comment, author: displayName || "You" },
      {
        onSuccess: () => {
          setRating(0);
          setComment("");
          setOpen(false);
        },
      },
    );
  }, [rating, comment, add, displayName]);

  const count = data?.count ?? 0;
  const dist = data?.distribution ?? [0, 0, 0, 0, 0];
  const mappedDist = [
    dist[0],
    dist[1],
    dist[2],
    dist[3] + dist[4],
  ];

  const authorName = displayName || "You";

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          review meter
        </p>
        <button
          type="button"
          onClick={() => {
            haptic("light");
            setOpen((o) => !o);
          }}
          className="cursor-pointer text-[11px] font-bold text-mint-deep underline decoration-mint-deep/30 underline-offset-4 outline-none dark:text-amethyst dark:decoration-amethyst/30"
        >
          {open ? "Cancel" : "Rate this"}
        </button>
      </div>

      {/* summary + distribution */}
      <div className="surface-solid mt-2 rounded-[1.3rem] p-5">
        <GaugeChart counts={mappedDist} total={count} />
      </div>

      {/* write a review */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="surface-solid mt-2 rounded-[1.3rem] p-4">
              <div className="flex items-center gap-3 mb-3">
                 <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-full text-[12px] font-black text-white"
                  style={{
                    background: `linear-gradient(135deg, hsl(${(authorName.charCodeAt(0) * 7) % 360} 70% 60%), hsl(${(authorName.charCodeAt(0) * 7 + 40) % 360} 65% 45%))`,
                  }}
                >
                  {authorName.slice(0, 2).toUpperCase()}
                </span>
                <p className="text-[14px] font-bold text-ink dark:text-snow">@{authorName}</p>
              </div>
              
              <div className="mb-4">
                <CategoryInput value={rating} onChange={setRating} />
              </div>
              
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 1000))}
                rows={3}
                placeholder="Write your review here..."
                className="w-full resize-none rounded-xl border-none bg-transparent px-1 py-1 text-[13.5px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:ring-0 dark:text-snow dark:placeholder:text-snow/25"
              />
              <div className="flex items-center justify-between mt-2 border-t border-ink/10 dark:border-white/10 pt-3">
                 <span className="text-[10.5px] font-semibold text-ink/30 dark:text-snow/30">{comment.length}/1000</span>
                 <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={submit}
                  disabled={rating < 1 || add.isPending}
                  className="flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full bg-ink px-6 text-[12px] font-bold text-snow outline-none disabled:opacity-40 dark:bg-snow dark:text-ink"
                >
                  Post
                </motion.button>
              </div>
              
              {add.isError && (
                <p role="alert" className="mt-2 text-[11px] font-semibold text-red-500">
                  {add.error.message}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* review list */}
      <div className="mt-2 flex flex-col gap-1.5">
        {isPending ? (
          <div aria-hidden className="shimmer h-14 rounded-[1.1rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
        ) : count === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-[1.1rem] bg-ink/[0.03] px-4 py-4 text-center dark:bg-white/[0.05]">
            <MessageSquare className="size-4 text-ink/30 dark:text-snow/30" aria-hidden />
            <p className="text-[11px] font-semibold text-ink/45 dark:text-snow/40">
              No reviews yet — be the first.
            </p>
          </div>
        ) : (
          data?.items.map((r) => {
            const mappedRating = Math.min(4, Math.max(1, r.rating === 5 ? 4 : r.rating));
            const cat = RATING_MAP.find(c => c.id === mappedRating) || RATING_MAP[3];

            return (
              <motion.div
                key={r.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="surface-solid rounded-[1.1rem] p-3.5"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    aria-hidden
                    className="flex size-7 items-center justify-center rounded-full text-[10px] font-black text-white"
                    style={{
                      background: `linear-gradient(135deg, hsl(${(r.author.charCodeAt(0) * 7) % 360} 70% 60%), hsl(${(r.author.charCodeAt(0) * 7 + 40) % 360} 65% 45%))`,
                    }}
                  >
                    {r.author.slice(0, 1).toUpperCase()}
                  </span>
                  <p className="text-[12px] font-bold text-ink dark:text-snow">{r.author}</p>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold text-white shadow-sm" style={{ backgroundColor: cat.color }}>
                    {cat.label}
                  </span>
                  <span className="ml-auto text-[10.5px] text-ink/35 dark:text-snow/30">
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-2 text-[12.5px] leading-snug text-ink/75 dark:text-snow/70 pl-[38px]">
                    {r.comment}
                  </p>
                )}
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  );
});
