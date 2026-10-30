"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  Trash2,
  Library,
  Loader2,
  Check,
} from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { FeedCard } from "@/components/feed/feed-card";
import {
  useCollectionsQuery,
  useCollectionQuery,
  useCreateCollection,
  useDeleteCollection,
} from "@/lib/queries/social";
import { useUiStore } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const EMOJIS = ["📦", "🔥", "❤️", "⭐", "🎯", "🌙", "⚡", "🧘", "🏆", "📅"];

const SEED_GRADIENTS: Record<string, string> = {
  mint: "from-[#baf3d6] to-[#5ed3a1]",
  lilac: "from-[#d9c8ff] to-[#8b5cf6]",
  sunset: "from-[#ffd5c2] to-[#f2876b]",
  sky: "from-[#c4e4ff] to-[#67a8e8]",
  cloud: "from-[#f1ede6] to-[#bcb3a2]",
};

/** Stacked cover thumbnails for a collection tile. */
const CoverStack = memo(function CoverStack({
  covers,
}: {
  covers: { cover: string | null; coverSeed: string }[];
}) {
  if (covers.length === 0) {
    return (
      <span className="flex size-14 items-center justify-center rounded-xl bg-ink/[0.05] dark:bg-white/[0.08]">
        <Library className="size-5 text-ink/25 dark:text-snow/25" aria-hidden />
      </span>
    );
  }
  return (
    <span className="relative flex size-14 shrink-0">
      {covers.slice(0, 3).map((c, i) => (
        <span
          key={i}
          className={cn(
            "absolute size-11 overflow-hidden rounded-xl bg-gradient-to-br ring-2 ring-[var(--surface-solid)]",
            SEED_GRADIENTS[c.coverSeed] ?? SEED_GRADIENTS.mint,
          )}
          // fan the stack: each card steps 5px right/down behind the last
          style={{ left: i * 5, top: i * 5, zIndex: 3 - i }}
        >
          {c.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.cover} alt="" className="size-full object-cover" loading="lazy" />
          )}
        </span>
      ))}
    </span>
  );
});

const CollectionDetail = memo(function CollectionDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const { data, isPending } = useCollectionQuery(id);

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
        <ChevronLeft className="size-4" aria-hidden /> Collections
      </button>

      {isPending || !data ? (
        <div aria-hidden className="mt-3 space-y-2">
          <div className="shimmer h-10 w-40 rounded-full bg-ink/[0.05] dark:bg-white/[0.06]" />
          <div className="shimmer h-44 rounded-[1.9rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
        </div>
      ) : (
        <>
          <h3 className="font-display mt-2 flex items-center gap-2 text-2xl italic text-ink dark:text-snow">
            <span className="text-[26px]">{data.emoji}</span>
            {data.name}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-ink/45 dark:text-snow/40">
            {data.items.length} {data.items.length === 1 ? "workout" : "workouts"}
          </p>

          <div className="mt-3 flex flex-col gap-3">
            {data.items.map((w) => (
              <FeedCard key={w.id} workout={w} />
            ))}
            {data.items.length === 0 && (
              <div className="flex flex-col items-center gap-1.5 rounded-[1.3rem] bg-ink/[0.03] px-4 py-8 text-center dark:bg-white/[0.05]">
                <Library className="size-5 text-ink/30 dark:text-snow/30" aria-hidden />
                <p className="text-[12px] font-semibold text-ink/45 dark:text-snow/40">
                  Empty for now
                </p>
                <p className="text-[10.5px] text-ink/35 dark:text-snow/30">
                  Tap Save on any workout in the feed.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
});

export const CollectionsSheet = memo(function CollectionsSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data: collections = [], isPending } = useCollectionsQuery(open);
  const create = useCreateCollection();
  const del = useDeleteCollection();
  const pushToast = useUiStore((s) => s.pushToast);

  const [viewing, setViewing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");

  const submit = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || create.isPending) return;
    haptic("medium");
    create.mutate(
      { name: trimmed, emoji },
      {
        onSuccess: (c) => {
          haptic("success");
          pushToast({ title: `${c.emoji} ${c.name} created`, tone: "mint" });
          setName("");
          setEmoji("📦");
          setCreating(false);
        },
      },
    );
  }, [name, emoji, create, pushToast]);

  const total = collections.reduce((acc, c) => acc + c.count, 0);

  return (
    <Sheet
      open={open}
      onClose={() => {
        setViewing(null);
        onClose();
      }}
      label="Collections"
      z={80}
    >
      <AnimatePresence mode="wait" initial={false}>
        {viewing ? (
          <CollectionDetail key="detail" id={viewing} onBack={() => setViewing(null)} />
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
              saved
            </p>
            <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
              Collections
            </h3>
            <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
              {total > 0
                ? `${total} workouts across ${collections.length} lists.`
                : "Group the workouts you love, or plan to try."}
            </p>

            {/* create */}
            <AnimatePresence initial={false} mode="wait">
              {creating ? (
                <motion.div
                  key="form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="surface-solid mt-3 rounded-[1.3rem] p-3.5">
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value.slice(0, 32))}
                      onKeyDown={(e) => e.key === "Enter" && submit()}
                      autoFocus
                      placeholder="e.g. Leg day, Someday, Loved"
                      aria-label="Collection name"
                      className="w-full rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2.5 text-[14px] font-bold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
                    />
                    <div className="mt-2 grid grid-cols-10 gap-1.5">
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => {
                            haptic("selection");
                            setEmoji(e);
                          }}
                          aria-pressed={emoji === e}
                          className={cn(
                            "flex aspect-square cursor-pointer items-center justify-center rounded-lg text-[15px] outline-none transition-transform active:scale-90",
                            emoji === e
                              ? "scale-110 bg-mint/50 ring-2 ring-mint-deep/60 dark:bg-grape/30 dark:ring-amethyst/60"
                              : "bg-ink/[0.04] dark:bg-white/[0.06]",
                          )}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCreating(false)}
                        className="min-h-11 flex-1 cursor-pointer rounded-full bg-ink/[0.05] text-[12.5px] font-bold text-ink/60 outline-none dark:bg-white/[0.08] dark:text-snow/60"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submit}
                        disabled={!name.trim() || create.isPending}
                        className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[12.5px] font-bold text-pine outline-none disabled:opacity-40 dark:from-grape dark:to-iris dark:text-white"
                      >
                        {create.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" aria-hidden />
                        ) : (
                          <Check className="size-3.5" aria-hidden />
                        )}
                        Create
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  key="cta"
                  type="button"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    haptic("light");
                    setCreating(true);
                  }}
                  className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-mint-deep/40 bg-mint/15 text-[12.5px] font-bold text-ink outline-none transition-colors hover:border-mint-deep/70 dark:border-amethyst/40 dark:bg-grape/15 dark:text-snow"
                >
                  <Plus className="size-4" aria-hidden /> New collection
                </motion.button>
              )}
            </AnimatePresence>

            {/* list */}
            <div className="mt-3 flex flex-col gap-1.5">
              {isPending ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-ink/30 dark:text-snow/30" />
                </div>
              ) : collections.length === 0 && !creating ? (
                <div className="flex flex-col items-center gap-1.5 rounded-[1.3rem] bg-ink/[0.03] px-4 py-8 text-center dark:bg-white/[0.05]">
                  <Library className="size-5 text-ink/30 dark:text-snow/30" aria-hidden />
                  <p className="text-[12.5px] font-bold text-ink/50 dark:text-snow/45">
                    No collections yet
                  </p>
                  <p className="text-[10.5px] text-ink/35 dark:text-snow/30">
                    Create one above, then hit Save on any workout.
                  </p>
                </div>
              ) : (
                collections.map((c) => (
                  <motion.div
                    key={c.id}
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
                        setViewing(c.id);
                      }}
                      className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left outline-none"
                    >
                      <CoverStack covers={c.covers} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-bold text-ink dark:text-snow">
                          <span className="mr-1.5">{c.emoji}</span>
                          {c.name}
                        </p>
                        <p className="text-[10.5px] text-ink/45 dark:text-snow/40">
                          {c.count} {c.count === 1 ? "workout" : "workouts"}
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        haptic("medium");
                        del.mutate(c.id);
                        pushToast({ title: `${c.name} deleted`, tone: "grape" });
                      }}
                      aria-label={`Delete ${c.name}`}
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink/35 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-snow/30"
                    >
                      <Trash2 className="size-4" aria-hidden />
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
