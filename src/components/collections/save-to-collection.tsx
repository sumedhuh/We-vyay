"use client";

import { memo, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Plus, Bookmark, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import {
  useCollectionsQuery,
  useCreateCollection,
  useWorkoutCollections,
  useToggleCollectionItem,
} from "@/lib/queries/social";
import { useUiStore } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const EMOJIS = ["📦", "🔥", "❤️", "⭐", "🎯", "🌙", "⚡", "🧘", "🏆", "📅"];

export const SaveToCollectionSheet = memo(function SaveToCollectionSheet({
  workoutId,
  workoutTitle,
  open,
  onClose,
}: {
  workoutId: string;
  workoutTitle: string;
  open: boolean;
  onClose: () => void;
}) {
  const { data: collections = [], isPending } = useCollectionsQuery(open);
  const { data: savedIds = [] } = useWorkoutCollections(workoutId, open);
  const toggle = useToggleCollectionItem(workoutId);
  const create = useCreateCollection();
  const pushToast = useUiStore((s) => s.pushToast);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");

  const onToggle = useCallback(
    (collectionId: string, collectionName: string) => {
      const saved = savedIds.includes(collectionId);
      haptic(saved ? "light" : "success");
      toggle.mutate({ collectionId, saved });
      if (!saved) {
        pushToast({ title: `Saved to ${collectionName}`, tone: "mint" });
      }
    },
    [savedIds, toggle, pushToast],
  );

  const submitNew = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || create.isPending) return;
    haptic("medium");
    create.mutate(
      { name: trimmed, emoji },
      {
        onSuccess: (created) => {
          // brand-new list — drop this workout straight into it
          toggle.mutate({ collectionId: created.id, saved: false });
          haptic("success");
          pushToast({ title: `${created.emoji} ${created.name} created`, tone: "mint" });
          setName("");
          setEmoji("📦");
          setCreating(false);
        },
      },
    );
  }, [name, emoji, create, toggle, pushToast]);

  return (
    <Sheet open={open} onClose={onClose} label="Save to collection" z={84}>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
        save workout
      </p>
      <h3 className="font-display mt-1 line-clamp-2 text-2xl italic text-ink dark:text-snow">
        {workoutTitle}
      </h3>
      <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
        Pick the lists this belongs in — tap again to remove.
      </p>

      {/* new collection */}
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
                onKeyDown={(e) => e.key === "Enter" && submitNew()}
                autoFocus
                placeholder="Collection name"
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
                  onClick={submitNew}
                  disabled={!name.trim() || create.isPending}
                  className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[12.5px] font-bold text-pine outline-none disabled:opacity-40 dark:from-grape dark:to-iris dark:text-white"
                >
                  {create.isPending ? (
                    <Loader2 className="size-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Check className="size-3.5" aria-hidden />
                  )}
                  Create &amp; save
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

      {/* existing collections */}
      <div className="mt-3 flex flex-col gap-1.5">
        {isPending ? (
          <div aria-hidden className="shimmer h-14 rounded-[1.1rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
        ) : collections.length === 0 && !creating ? (
          <div className="flex flex-col items-center gap-1.5 rounded-[1.1rem] bg-ink/[0.03] px-4 py-6 text-center dark:bg-white/[0.05]">
            <Bookmark className="size-4 text-ink/30 dark:text-snow/30" aria-hidden />
            <p className="text-[11.5px] font-semibold text-ink/45 dark:text-snow/40">
              No collections yet
            </p>
            <p className="text-[10px] text-ink/35 dark:text-snow/30">
              Make one above — &ldquo;Leg day&rdquo;, &ldquo;Someday&rdquo;, anything.
            </p>
          </div>
        ) : (
          collections.map((c) => {
            const saved = savedIds.includes(c.id);
            return (
              <motion.button
                key={c.id}
                type="button"
                layout
                whileTap={{ scale: 0.98 }}
                onClick={() => onToggle(c.id, c.name)}
                aria-pressed={saved}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-[1.1rem] border p-3 text-left outline-none transition-colors",
                  saved
                    ? "border-mint-deep/60 bg-mint/25 dark:border-amethyst/60 dark:bg-grape/20"
                    : "surface-solid",
                )}
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink/[0.05] text-[19px] dark:bg-white/[0.08]">
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-ink dark:text-snow">
                    {c.name}
                  </p>
                  <p className="text-[10.5px] text-ink/45 dark:text-snow/40">
                    {c.count} {c.count === 1 ? "workout" : "workouts"}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full transition-colors",
                    saved
                      ? "bg-gradient-to-br from-mint-deep to-mint-strong text-white dark:from-grape dark:to-iris"
                      : "bg-ink/[0.06] text-transparent dark:bg-white/10",
                  )}
                >
                  <Check className="size-3.5" aria-hidden />
                </span>
              </motion.button>
            );
          })
        )}
      </div>
    </Sheet>
  );
});
