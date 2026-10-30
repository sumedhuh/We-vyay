"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock3,
  Flame,
  ListChecks,
  Play,
  Dumbbell,
  ChevronLeft,
  ChevronRight,
  PartyPopper,
  Repeat2,
  Mountain,
  Flower,
  Activity,
  Footprints,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";
import type { Workout, ExerciseRow } from "@/db/schema";
import { Sheet } from "@/components/ui/sheet";
import { AnimationPlayer } from "@/components/media/animation-player";
import { PresetPreview } from "@/components/studio/studio-modals";
import type { MotionPreset } from "@/stores/studio-store";
import { usePetStore } from "@/stores/pet-store";
import { useUiStore } from "@/stores/ui-store";
import { VibeChart, vibeSummary } from "./vibe-chart";
import { ReviewMeter, CategoryBadge } from "./review-meter";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { ConfettiButton } from "@/components/fitness/ConfettiButton";
import { Workout3DRenderer } from "@/components/studio/Workout3DRenderer";
import PushupScene from "@/components/3d-builder/PushupScene";

const SEED_GRADIENTS: Record<string, string> = {
  mint: "from-[#baf3d6] via-[#8fe6bf] to-[#5ed3a1]",
  lilac: "from-[#d9c8ff] via-[#b49af5] to-[#8b5cf6]",
  sunset: "from-[#ffd5c2] via-[#ffb199] to-[#f2876b]",
  sky: "from-[#c4e4ff] via-[#9bcbf7] to-[#67a8e8]",
  cloud: "from-[#f1ede6] via-[#dcd5c8] to-[#bcb3a2]",
};

const PRESET_KEYS = new Set(["pulse", "wave", "orbit", "pop"]);

/** Thumbnail resolver: custom upload → built-in preset → generic icon. */
const MoveThumb = memo(function MoveThumb({
  ex,
  size = "sm",
}: {
  ex: ExerciseRow;
  size?: "sm" | "lg";
}) {
  const box =
    size === "lg" ? "size-full rounded-[1.4rem]" : "size-11 shrink-0 rounded-xl";

  if (ex.animationId && ex.animationKind) {
    // If we are in the 'lg' session view and it's a 3D animation, render the interactive 3D model!
    if (size === "lg" && ex.animationKind === "3d") {
      return (
        <div className={cn(box, "overflow-hidden relative")}>
          <Workout3DRenderer workoutUrl={`/api/animations/${ex.animationId}/raw`} />
        </div>
      );
    }

    return (
      <AnimationPlayer
        id={ex.animationId}
        kind={ex.animationKind}
        name={ex.animationName ?? ex.name}
        className={cn(
          box,
          "bg-ink/[0.04] object-cover dark:bg-white/[0.06]",
        )}
      />
    );
  }

  if (ex.animation && PRESET_KEYS.has(ex.animation)) {
    return (
      <span
        className={cn(
          box,
          "flex items-center justify-center bg-mint/25 dark:bg-grape/20",
        )}
      >
        <span className={size === "lg" ? "scale-[3]" : ""}>
          <PresetPreview preset={ex.animation as MotionPreset} />
        </span>
      </span>
    );
  }

  // Support for pre-made built-in 3D templates (e.g., Push-ups)
  if (size === "lg" && ex.name.toLowerCase().replace(/[^a-z]/g, '').includes("pushup")) {
    return (
      <div className={cn(box, "overflow-hidden relative bg-[#05060a]")}>
        {/* We reuse the exact same PushupScene from the Studio Builder */}
        <PushupScene />
      </div>
    );
  }

  let Icon = Dumbbell;
  const lowerName = ex.name.toLowerCase();
  
  if (lowerName.includes("squat")) Icon = ArrowDownToLine;
  else if (lowerName.includes("push") || lowerName.includes("press")) Icon = ArrowUpFromLine;
  else if (lowerName.includes("climb")) Icon = Mountain;
  else if (lowerName.includes("yoga") || lowerName.includes("stretch") || lowerName.includes("flow")) Icon = Flower;
  else if (lowerName.includes("run") || lowerName.includes("jog") || lowerName.includes("cardio") || lowerName.includes("walk")) Icon = Footprints;
  else if (lowerName.includes("jump") || lowerName.includes("burpee") || lowerName.includes("active")) Icon = Activity;

  return (
    <span
      className={cn(
        box,
        "flex items-center justify-center bg-ink/[0.05] text-ink/35 dark:bg-white/[0.07] dark:text-snow/35",
      )}
    >
      <Icon className={size === "lg" ? "size-10" : "size-4"} aria-hidden />
    </span>
  );
});

type Mode = "overview" | "session" | "done";

export const WorkoutDetailSheet = memo(function WorkoutDetailSheet({
  workout,
  open,
  onClose,
  onStartPlayer,
}: {
  workout: Workout;
  open: boolean;
  onClose: () => void;
  onStartPlayer?: () => void;
}) {
  const [mode, setMode] = useState<Mode>("overview");
  const [step, setStep] = useState(0);
  const gainXp = usePetStore((s) => s.gainXp);
  const petName = usePetStore((s) => s.name);
  const pushToast = useUiStore((s) => s.pushToast);

  const exercises = workout.exercises ?? [];
  const totalSets = useMemo(
    () => exercises.reduce((acc, e) => acc + (e.sets || 0), 0),
    [exercises],
  );
  const animatedCount = useMemo(
    () => exercises.filter((e) => e.animationId || e.animation).length,
    [exercises],
  );
  const summary = useMemo(() => vibeSummary(workout.vibes), [workout.vibes]);
  const avgRating =
    workout.ratingCount > 0 ? workout.ratingSum / workout.ratingCount : 0;

  const close = useCallback(() => {
    onClose();
    // reset after the exit animation so the sheet doesn't flicker mid-close
    setTimeout(() => {
      setMode("overview");
      setStep(0);
    }, 320);
  }, [onClose]);

  const begin = useCallback(() => {
    if (exercises.length === 0) return;
    haptic("success");
    if (onStartPlayer) {
      onStartPlayer();
    } else {
      setStep(0);
      setMode("session");
    }
  }, [exercises.length, onStartPlayer]);

  const next = useCallback(() => {
    haptic("light");
    setStep((s) => {
      if (s < exercises.length - 1) return s + 1;
      // finished the last move — award XP once and celebrate
      const res = gainXp(40);
      haptic("success");
      pushToast({
        title: res.leveledUp ? `${petName} hit level ${res.level}!` : "Workout complete",
        message: "+40 XP",
        tone: res.leveledUp ? "grape" : "mint",
      });
      setMode("done");
      return s;
    });
  }, [exercises.length, gainXp, pushToast, petName]);

  const prev = useCallback(() => {
    haptic("selection");
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const gradient = SEED_GRADIENTS[workout.coverSeed] ?? SEED_GRADIENTS.mint;
  const current = exercises[step];

  return (
    <Sheet open={open} onClose={close} label={`${workout.title} details`}>
      <AnimatePresence mode="wait" initial={false}>
        {/* ------------------------------------------------ overview ---- */}
        {mode === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <div className="relative -mx-5 -mt-3 h-36 overflow-hidden">
              {workout.cover ? (
                <Image
                  src={workout.cover}
                  alt={workout.title}
                  fill
                  sizes="430px"
                  className="object-cover"
                />
              ) : (
                <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
              )}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-[var(--surface-solid)] via-black/20 to-transparent"
              />
              <div className="absolute bottom-2 left-5 right-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">
                  {workout.level} · {workout.authorHandle}
                </p>
              </div>
            </div>

            <h3 className="font-display mt-2 text-[26px] italic leading-tight text-ink dark:text-snow">
              {workout.title}
            </h3>
            {workout.description && (
              <p className="mt-1 text-[12.5px] text-ink/60 dark:text-snow/55">
                {workout.description}
              </p>
            )}

            {/* aggregate rating strip */}
            <div className="mt-2 flex items-center gap-2">
              {workout.ratingCount > 0 ? <CategoryBadge value={avgRating} /> : <span className="rounded-full px-2 py-0.5 text-[9px] font-bold bg-ink/10 dark:bg-white/10">New</span>}
              <span className="text-[11px] font-bold text-ink/60 dark:text-snow/60">
                {workout.ratingCount > 0
                  ? `${workout.ratingCount} ${workout.ratingCount === 1 ? "review" : "reviews"}`
                  : "no reviews yet"}
              </span>
            </div>

            {/* vibe chart */}
            <div className="surface-solid mt-3 rounded-[1.4rem] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
                  vibe chart
                </p>
                <span className="rounded-full bg-mint/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-pine dark:bg-grape/25 dark:text-lilac">
                  {summary.label}
                </span>
              </div>
              <div className="mt-1 flex justify-center">
                <VibeChart vibes={workout.vibes} size={218} className="w-[218px]" />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              {[
                { Icon: Clock3, v: `${workout.durationMin}m`, k: "duration" },
                { Icon: Flame, v: `${workout.kcal}`, k: "kcal" },
                { Icon: ListChecks, v: `${totalSets}`, k: "total sets" },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl bg-ink/[0.03] px-2 py-2.5 text-center dark:bg-white/[0.05]"
                >
                  <s.Icon
                    className="mx-auto size-3.5 text-mint-deep dark:text-amethyst"
                    aria-hidden
                  />
                  <p className="mt-1 text-[15px] font-bold text-ink dark:text-snow">
                    {s.v}
                  </p>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-ink/45 dark:text-snow/40">
                    {s.k}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
                inside this workout
              </p>
              {animatedCount > 0 && (
                <span className="rounded-full bg-grape/12 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-grape dark:bg-amethyst/20 dark:text-amethyst">
                  {animatedCount} animated
                </span>
              )}
            </div>

            <div className="mt-2 flex flex-col gap-1.5">
              {exercises.map((ex, i) => (
                <motion.div
                  key={`${ex.name}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.035, 0.3) }}
                  className="surface-solid flex items-center gap-3 rounded-2xl p-2.5"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/6 text-[10px] font-black text-ink/55 dark:bg-white/10 dark:text-snow/55">
                    {i + 1}
                  </span>
                  <MoveThumb ex={ex} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-ink dark:text-snow">
                      {ex.name}
                    </p>
                    <p className="text-[11px] font-semibold text-ink/50 dark:text-snow/45">
                      {ex.sets} × {ex.reps}
                      {ex.animationName ? ` · ${ex.animationName}` : ""}
                    </p>
                  </div>
                </motion.div>
              ))}
              {exercises.length === 0 && (
                <p className="rounded-2xl bg-ink/[0.03] px-4 py-5 text-center text-[12px] text-ink/45 dark:bg-white/[0.05] dark:text-snow/40">
                  No moves listed for this routine.
                </p>
              )}
            </div>

            <motion.button
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={begin}
              disabled={exercises.length === 0}
              className="mt-4 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] outline-none disabled:opacity-45 dark:from-grape dark:to-iris dark:text-white dark:shadow-[0_16px_34px_-14px_rgba(139,92,246,0.9)]"
            >
              <Play className="size-4" aria-hidden /> Begin session · +40 XP
            </motion.button>

            {/* reviews — only fetched once the sheet is actually open */}
            <div className="mt-5">
              <ReviewMeter workoutId={workout.id} enabled={open} />
            </div>
          </motion.div>
        )}

        {/* ------------------------------------------------- session ---- */}
        {mode === "session" && current && (
          <motion.div
            key="session"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.18 }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
              move {step + 1} of {exercises.length}
            </p>

            {/* progress rail — each segment fills as you advance */}
            <div className="mt-2 flex gap-1">
              {exercises.map((_, i) => (
                <span
                  key={i}
                  className="h-1 flex-1 overflow-hidden rounded-full bg-ink/8 dark:bg-white/10"
                >
                  <motion.span
                    className="block h-full rounded-full bg-mint-deep dark:bg-amethyst"
                    initial={false}
                    animate={{ width: i <= step ? "100%" : "0%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  />
                </span>
              ))}
            </div>

            <div className="mt-3 aspect-square w-full overflow-hidden rounded-[1.4rem]">
              <MoveThumb ex={current} size="lg" />
            </div>

            <h3 className="font-display mt-3 text-[26px] italic leading-tight text-ink dark:text-snow">
              {current.name}
            </h3>
            <p className="mt-0.5 flex items-center gap-1.5 text-[13px] font-bold text-ink/60 dark:text-snow/55">
              <Repeat2 className="size-4" aria-hidden />
              {current.sets} sets × {current.reps}
            </p>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={prev}
                disabled={step === 0}
                className="surface-solid flex min-h-13 w-14 shrink-0 cursor-pointer items-center justify-center rounded-full text-ink outline-none disabled:opacity-35 dark:text-snow"
                aria-label="Previous move"
              >
                <ChevronLeft className="size-5" aria-hidden />
              </button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={next}
                className="flex min-h-13 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] outline-none dark:from-grape dark:to-iris dark:text-white"
              >
                {step === exercises.length - 1 ? "Finish workout" : "Next move"}
                <ChevronRight className="size-4" aria-hidden />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* ---------------------------------------------------- done ---- */}
        {mode === "done" && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="flex flex-col items-center py-4 text-center"
          >
            <motion.span
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 15 }}
              className="flex size-14 items-center justify-center rounded-3xl bg-gradient-to-br from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white mb-2 shadow-lg"
            >
              <PartyPopper className="size-6" aria-hidden />
            </motion.span>
            <h3 className="font-display text-[26px] italic text-ink dark:text-snow">
              Workout Completed!
            </h3>
            <p className="mt-0.5 text-[12px] text-ink/55 dark:text-snow/50">
              {workout.title} · {totalSets} sets logged
            </p>

            {/* Fibonacci Sequence Quadrilateral Hero Button */}
            <div className="w-full my-4 flex justify-center">
              <ConfettiButton
                workoutTitle={workout.title}
                onComplete={() => {
                  haptic("success");
                }}
              />
            </div>

            <div className="flex w-full gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(0);
                  setMode("overview");
                }}
                className="surface-solid min-h-12 flex-1 cursor-pointer rounded-full text-[12.5px] font-bold text-ink dark:text-snow"
              >
                Rate Routine
              </button>
              <button
                type="button"
                onClick={close}
                className="min-h-12 flex-1 cursor-pointer rounded-full bg-ink text-[12.5px] font-bold text-paper dark:bg-white dark:text-ink shadow-md"
              >
                Close Summary
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
});
