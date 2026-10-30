"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Repeat, Timer, Minus, Plus, Activity } from "lucide-react";
import type { ExerciseMode } from "@/db/schema";
import { Sheet } from "@/components/ui/sheet";
import { AnimationPlayer } from "@/components/media/animation-player";
import { VibeChart } from "@/components/feed/vibe-chart";
import { useStudioStore } from "@/stores/studio-store";
import { workSeconds, volumeLabel } from "@/lib/vibes";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const REP_PRESETS = [5, 8, 10, 12, 15, 20];
const TIME_PRESETS = [20, 30, 45, 60, 90, 120];

/**
 * Volume picker shown right after a move lands on the canvas.
 * Whatever is chosen here becomes the weight this exercise carries in the
 * workout's computed vibe profile (work seconds = sets × reps × 3.2s, or
 * sets × hold seconds for timed moves).
 */
export const ItemConfigSheet = memo(function ItemConfigSheet({
  uid,
  onClose,
  isNew,
}: {
  uid: string | null;
  onClose: () => void;
  isNew: boolean;
}) {
  const items = useStudioStore((s) => s.items);
  const updateItem = useStudioStore((s) => s.updateItem);
  const removeItem = useStudioStore((s) => s.removeItem);

  const item = useMemo(() => items.find((i) => i.uid === uid) ?? null, [items, uid]);

  const [mode, setMode] = useState<ExerciseMode>("reps");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [seconds, setSeconds] = useState(45);

  // hydrate the draft whenever a different item opens
  useEffect(() => {
    if (!item) return;
    setMode(item.mode);
    setSets(item.sets);
    setReps(item.reps);
    setSeconds(item.seconds);
  }, [item?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  const work = workSeconds({ mode, sets, reps, seconds });
  const workMin = Math.round((work / 60) * 10) / 10;

  const confirm = useCallback(() => {
    if (!uid) return;
    haptic("success");
    updateItem(uid, { mode, sets, reps, seconds });
    onClose();
  }, [uid, mode, sets, reps, seconds, updateItem, onClose]);

  const cancel = useCallback(() => {
    // backing out of a fresh drop removes it rather than leaving a stray move
    if (isNew && uid) {
      haptic("medium");
      removeItem(uid);
    }
    onClose();
  }, [isNew, uid, removeItem, onClose]);

  const bump = (setter: (n: number) => void, cur: number, d: number, lo: number, hi: number) => {
    haptic("selection");
    setter(Math.min(hi, Math.max(lo, cur + d)));
  };

  return (
    <Sheet open={!!uid} onClose={cancel} label="Set volume">
      {item && (
        <>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
            {isNew ? "added to canvas" : "edit move"}
          </p>

          <div className="mt-2 flex items-center gap-3">
            {item.animationId && item.animationKind ? (
              <AnimationPlayer
                id={item.animationId}
                kind={item.animationKind}
                name={item.animationName ?? item.name}
                className="size-14 shrink-0 rounded-2xl bg-ink/[0.04] object-cover dark:bg-white/[0.06]"
              />
            ) : (
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-mint/40 text-[26px] dark:bg-grape/25">
                {item.emoji}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="font-display truncate text-2xl italic text-ink dark:text-snow">
                {item.name}
              </h3>
              <p className="text-[11px] font-semibold text-ink/45 dark:text-snow/40">
                {item.tag} · carries its own vibe
              </p>
            </div>
            <VibeChart vibes={item.vibes} size={72} className="w-[72px] shrink-0" />
          </div>

          {/* mode */}
          <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            how do you count it
          </p>
          <div className="mt-2 flex rounded-full bg-ink/[0.05] p-1 dark:bg-white/[0.07]">
            {(
              [
                { key: "reps", label: "Reps", Icon: Repeat },
                { key: "time", label: "Time", Icon: Timer },
              ] as const
            ).map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setMode(m.key);
                }}
                aria-pressed={mode === m.key}
                className="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2.5 text-[12.5px] font-bold outline-none"
              >
                {mode === m.key && (
                  <motion.span
                    layoutId="cfg-mode-seg"
                    transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    className="surface-solid absolute inset-0 rounded-full shadow-sm"
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-1.5",
                    mode === m.key ? "text-ink dark:text-snow" : "text-ink/45 dark:text-snow/40",
                  )}
                >
                  <m.Icon className="size-3.5" aria-hidden />
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* sets */}
          <div className="mt-3 flex items-center justify-between rounded-2xl bg-ink/[0.04] px-3.5 py-2.5 dark:bg-white/[0.06]">
            <span className="text-[12.5px] font-bold text-ink dark:text-snow">Sets</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => bump(setSets, sets, -1, 1, 20)}
                disabled={sets <= 1}
                aria-label="Fewer sets"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none transition-colors hover:bg-ink/10 disabled:opacity-30 dark:bg-white/10 dark:text-snow"
              >
                <Minus className="size-4" aria-hidden />
              </button>
              <span className="w-10 text-center text-[19px] font-black tabular-nums text-ink dark:text-snow">
                {sets}
              </span>
              <button
                type="button"
                onClick={() => bump(setSets, sets, 1, 1, 20)}
                disabled={sets >= 20}
                aria-label="More sets"
                className="flex size-9 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none transition-colors hover:bg-ink/10 disabled:opacity-30 dark:bg-white/10 dark:text-snow"
              >
                <Plus className="size-4" aria-hidden />
              </button>
            </div>
          </div>

          {/* reps or duration */}
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            {mode === "reps" ? "reps per set" : "hold per set"}
          </p>
          <div className="mt-2 grid grid-cols-6 gap-1.5">
            {(mode === "reps" ? REP_PRESETS : TIME_PRESETS).map((p) => {
              const active = mode === "reps" ? reps === p : seconds === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    haptic("selection");
                    if (mode === "reps") setReps(p);
                    else setSeconds(p);
                  }}
                  aria-pressed={active}
                  className={cn(
                    "cursor-pointer rounded-xl py-2.5 text-[12px] font-bold outline-none transition-colors",
                    active
                      ? "bg-gradient-to-br from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white"
                      : "bg-ink/[0.04] text-ink/60 hover:bg-ink/[0.08] dark:bg-white/[0.06] dark:text-snow/55",
                  )}
                >
                  {mode === "reps" ? p : `${p}s`}
                </button>
              );
            })}
          </div>

          {/* fine tune */}
          <div className="mt-2 flex items-center justify-between rounded-2xl bg-ink/[0.04] px-3.5 py-2 dark:bg-white/[0.06]">
            <span className="text-[11.5px] font-bold text-ink/60 dark:text-snow/55">
              Fine tune
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() =>
                  mode === "reps"
                    ? bump(setReps, reps, -1, 1, 200)
                    : bump(setSeconds, seconds, -5, 5, 3600)
                }
                aria-label="Decrease"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none dark:bg-white/10 dark:text-snow"
              >
                <Minus className="size-3.5" aria-hidden />
              </button>
              <span className="w-16 text-center text-[14px] font-black tabular-nums text-ink dark:text-snow">
                {mode === "reps" ? reps : `${seconds}s`}
              </span>
              <button
                type="button"
                onClick={() =>
                  mode === "reps"
                    ? bump(setReps, reps, 1, 1, 200)
                    : bump(setSeconds, seconds, 5, 5, 3600)
                }
                aria-label="Increase"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none dark:bg-white/10 dark:text-snow"
              >
                <Plus className="size-3.5" aria-hidden />
              </button>
            </div>
          </div>

          {/* live contribution readout */}
          <div className="surface-solid mt-3 flex items-center gap-2.5 rounded-2xl p-3">
            <Activity className="size-4 shrink-0 text-mint-deep dark:text-amethyst" aria-hidden />
            <p className="text-[11.5px] text-ink/60 dark:text-snow/55">
              <span className="font-bold text-ink dark:text-snow">
                {volumeLabel({ mode, sets, reps, seconds })}
              </span>{" "}
              · ~{workMin} min of work feeding this workout&apos;s vibe
            </p>
          </div>

          <motion.button
            type="button"
            whileTap={{ scale: 0.97 }}
            onClick={confirm}
            className="mt-4 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] outline-none dark:from-grape dark:to-iris dark:text-white"
          >
            <Check className="size-4" aria-hidden />
            {isNew ? "Add to workout" : "Save changes"}
          </motion.button>
          <button
            type="button"
            onClick={cancel}
            className="mt-2 w-full cursor-pointer py-1 text-[11.5px] font-bold text-ink/45 outline-none dark:text-snow/40"
          >
            {isNew ? "Discard this move" : "Cancel"}
          </button>
        </>
      )}
    </Sheet>
  );
});
