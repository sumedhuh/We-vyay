"use client";

import { memo, useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, Repeat, Timer, Sparkles, Minus, Plus } from "lucide-react";
import {
  VIBE_AXES,
  DEFAULT_VIBES,
  type Vibes,
  type VibeAxis,
  type ExerciseMode,
  type AnimationKind,
  type AnimationMeta,
} from "@/db/schema";
import { Sheet } from "@/components/ui/sheet";
import { VibeChart, vibeSummary } from "@/components/feed/vibe-chart";
import { AnimationUploader } from "./animation-uploader";
import { AnimationPlayer } from "@/components/media/animation-player";
import { useCreateExercise } from "@/lib/queries/exercises";
import { useUiStore } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const EMOJIS = [
  { emoji: "💪", label: "Upper" },
  { emoji: "🦵", label: "Lower" },
  { emoji: "🔥", label: "Burn" },
  { emoji: "🧘", label: "Core" },
  { emoji: "🏋️", label: "Heavy" },
  { emoji: "🤸", label: "Agility" },
  { emoji: "🚴", label: "Cardio" },
  { emoji: "🏃", label: "Run" },
  { emoji: "⛰️", label: "Climb" },
  { emoji: "🧱", label: "Wall" },
  { emoji: "🥊", label: "Box" },
  { emoji: "🤾", label: "Throw" },
  { emoji: "🩰", label: "Balance" },
  { emoji: "🦶", label: "Foot" },
  { emoji: "🫀", label: "Heart" },
  { emoji: "⚡", label: "Power" },
  { emoji: "🌀", label: "Flow" },
  { emoji: "🪢", label: "Rope" },
  { emoji: "🛼", label: "Skate" },
  { emoji: "🏊", label: "Swim" },
];

const AXIS_LABELS: Record<VibeAxis, string> = {
  cardio: "Cardio",
  strength: "Strength",
  mobility: "Mobility",
  intensity: "Intensity",
  endurance: "Endurance",
};

/** Quick-start vibe templates so creators aren't staring at five 50s. */
const TEMPLATES: { name: string; emoji: string; vibes: Vibes; mode: ExerciseMode }[] = [
  { name: "Cardio", emoji: "🏃", mode: "time", vibes: { cardio: 90, strength: 30, mobility: 30, intensity: 80, endurance: 80 } },
  { name: "Strength", emoji: "🏋️", mode: "reps", vibes: { cardio: 25, strength: 92, mobility: 30, intensity: 70, endurance: 50 } },
  { name: "Mobility", emoji: "🧘", mode: "time", vibes: { cardio: 15, strength: 20, mobility: 92, intensity: 18, endurance: 40 } },
  { name: "Power", emoji: "⚡", mode: "reps", vibes: { cardio: 60, strength: 75, mobility: 35, intensity: 95, endurance: 55 } },
];

const Stepper = memo(function Stepper({
  label,
  value,
  min,
  max,
  step,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix?: string;
  onChange: (n: number) => void;
}) {
  const bump = (dir: -1 | 1) => {
    haptic("selection");
    onChange(Math.min(max, Math.max(min, value + dir * step)));
  };
  return (
    <div className="flex items-center justify-between rounded-2xl bg-ink/[0.04] px-3 py-2 dark:bg-white/[0.06]">
      <span className="text-[11.5px] font-bold text-ink/60 dark:text-snow/55">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none transition-colors hover:bg-ink/10 disabled:opacity-30 dark:bg-white/10 dark:text-snow"
        >
          <Minus className="size-3.5" aria-hidden />
        </button>
        <span className="w-14 text-center text-[14px] font-black tabular-nums text-ink dark:text-snow">
          {value}
          {suffix}
        </span>
        <button
          type="button"
          onClick={() => bump(1)}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full bg-ink/[0.06] text-ink outline-none transition-colors hover:bg-ink/10 disabled:opacity-30 dark:bg-white/10 dark:text-snow"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
});

export const ExerciseBuilder = memo(function ExerciseBuilder({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreateExercise();
  const pushToast = useUiStore((s) => s.pushToast);

  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💪");
  const [tag, setTag] = useState("");
  const [vibes, setVibes] = useState<Vibes>({ ...DEFAULT_VIBES });
  const [mode, setMode] = useState<ExerciseMode>("reps");
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(12);
  const [seconds, setSeconds] = useState(45);
  const [anim, setAnim] = useState<{
    id: string;
    name: string;
    kind: AnimationKind;
  } | null>(null);

  const summary = useMemo(() => vibeSummary(vibes), [vibes]);

  const reset = useCallback(() => {
    setName("");
    setEmoji("💪");
    setTag("");
    setVibes({ ...DEFAULT_VIBES });
    setMode("reps");
    setSets(3);
    setReps(12);
    setSeconds(45);
    setAnim(null);
  }, []);

  const applyTemplate = useCallback((t: (typeof TEMPLATES)[number]) => {
    haptic("light");
    setVibes({ ...t.vibes });
    setMode(t.mode);
    setEmoji((cur) => (cur === "💪" ? t.emoji : cur));
  }, []);

  const pickAnimation = useCallback((a: AnimationMeta) => {
    setAnim({ id: a.id, name: a.name, kind: a.kind });
  }, []);

  const save = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || create.isPending) return;
    haptic("medium");
    create.mutate(
      {
        name: trimmed,
        emoji,
        tag: tag.trim() || "custom",
        vibes,
        mode,
        defaultSets: sets,
        defaultReps: reps,
        defaultSeconds: seconds,
        animationId: anim?.id ?? null,
        animationName: anim?.name ?? null,
        animationKind: anim?.kind ?? null,
      },
      {
        onSuccess: (created) => {
          haptic("success");
          pushToast({
            title: `${created.emoji} ${created.name} added`,
            message: "drag it onto your canvas",
            tone: "mint",
          });
          reset();
          onClose();
        },
      },
    );
  }, [
    name, emoji, tag, vibes, mode, sets, reps, seconds, anim,
    create, pushToast, reset, onClose,
  ]);

  return (
    <Sheet open={open} onClose={onClose} label="Create an exercise">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
        new exercise
      </p>
      <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
        Build a move
      </h3>
      <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
        Name it, give it a vibe, and it lands in your dock — ready to drag.
      </p>

      {/* identity: emoji + name */}
      <div className="mt-4 flex items-center gap-2.5">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-mint/40 text-[26px] dark:bg-grape/25">
          {anim ? (
            <AnimationPlayer
              id={anim.id}
              kind={anim.kind}
              name={anim.name}
              className="size-full rounded-2xl object-cover"
            />
          ) : (
            emoji
          )}
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 32))}
            placeholder="Exercise name"
            aria-label="Exercise name"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2.5 text-[15px] font-bold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value.slice(0, 20))}
            placeholder="Muscle group (optional)"
            aria-label="Tag"
            className="mt-1.5 w-full rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2 text-[12px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
        </div>
      </div>

      {/* emoji picker */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        icon
      </p>
      <div className="mt-2 grid grid-cols-5 gap-2">
        {EMOJIS.map((e) => (
          <button
            key={e.emoji}
            type="button"
            onClick={() => {
              haptic("selection");
              setEmoji(e.emoji);
            }}
            aria-label={`Icon ${e.label}`}
            aria-pressed={emoji === e.emoji}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl p-2 outline-none transition-transform active:scale-95",
              emoji === e.emoji
                ? "bg-mint/50 ring-2 ring-mint-deep/60 dark:bg-grape/30 dark:ring-amethyst/60"
                : "bg-ink/[0.04] hover:bg-ink/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1]",
            )}
          >
            <span className="text-[20px]">{e.emoji}</span>
            <span className="text-[9px] font-bold text-ink/60 dark:text-snow/60">{e.label}</span>
          </button>
        ))}
      </div>

      {/* vibe templates */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        quick vibe
      </p>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {TEMPLATES.map((t) => (
          <button
            key={t.name}
            type="button"
            onClick={() => applyTemplate(t)}
            className="surface-solid flex cursor-pointer flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold text-ink outline-none transition-colors hover:bg-mint/20 dark:text-snow dark:hover:bg-grape/20"
          >
            <span className="text-[15px]">{t.emoji}</span>
            {t.name}
          </button>
        ))}
      </div>

      {/* vibe chart authoring */}
      <div className="surface-solid mt-3 rounded-[1.4rem] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
              this move&apos;s vibe
            </p>
            <p className="mt-0.5 truncate text-[12px] font-bold text-ink dark:text-snow">
              {summary.label}
            </p>
          </div>
          <VibeChart vibes={vibes} size={104} className="w-[104px] shrink-0" />
        </div>

        <div className="mt-1 flex flex-col gap-2">
          {VIBE_AXES.map((axis) => (
            <div key={axis}>
              <div className="flex items-baseline justify-between">
                <label
                  htmlFor={`ex-vibe-${axis}`}
                  className="text-[11.5px] font-bold text-ink dark:text-snow"
                >
                  {AXIS_LABELS[axis]}
                </label>
                <span className="text-[11px] font-black tabular-nums text-mint-deep dark:text-amethyst">
                  {vibes[axis]}
                </span>
              </div>
              <input
                id={`ex-vibe-${axis}`}
                type="range"
                min={0}
                max={100}
                step={5}
                value={vibes[axis]}
                onChange={(e) =>
                  setVibes((cur) => ({ ...cur, [axis]: Number(e.target.value) }))
                }
                onPointerUp={() => haptic("selection")}
                className="vibe-range mt-0.5 h-6 w-full cursor-pointer appearance-none bg-transparent outline-none"
                style={{ ["--pct" as string]: `${vibes[axis]}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* measurement mode + defaults */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        measured in
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
            className="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold outline-none"
          >
            {mode === m.key && (
              <motion.span
                layoutId="ex-mode-seg"
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

      <div className="mt-2 flex flex-col gap-1.5">
        <Stepper label="Default sets" value={sets} min={1} max={20} step={1} onChange={setSets} />
        {mode === "reps" ? (
          <Stepper label="Default reps" value={reps} min={1} max={100} step={1} onChange={setReps} />
        ) : (
          <Stepper
            label="Default hold"
            value={seconds}
            min={5}
            max={600}
            step={5}
            suffix="s"
            onChange={setSeconds}
          />
        )}
      </div>

      {/* own animation */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        its animation
      </p>
      <p className="mb-2 text-[10.5px] text-ink/45 dark:text-snow/40">
        Attach a clip once — every drop of this move reuses it.
      </p>
      <AnimationUploader selectedId={anim?.id ?? null} onPick={pickAnimation} />

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={save}
        disabled={!name.trim() || create.isPending}
        className="mt-5 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] outline-none disabled:opacity-40 dark:from-grape dark:to-iris dark:text-white"
      >
        {create.isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine dark:border-white/30 dark:border-t-white" />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        Add to my dock
      </motion.button>
      {create.isError && (
        <p role="alert" className="mt-2 text-center text-[11px] font-semibold text-red-500">
          {create.error.message}
        </p>
      )}
      <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-ink/35 dark:text-snow/30">
        <Sparkles className="size-3" aria-hidden /> Vibes here shape every workout you build
      </p>
    </Sheet>
  );
});
