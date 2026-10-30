"use client";

import { memo, useCallback, useRef, useState, useEffect, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useDrag } from "@use-gesture/react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, GripVertical, Trash2, Loader2, Search, ChevronDown, ChevronUp, X } from "lucide-react";
import type { CustomExercise, Vibes, ExerciseMode } from "@/db/schema";
import { useExercisesQuery, useDeleteExercise } from "@/lib/queries/exercises";
import { AnimationPlayer } from "@/components/media/animation-player";
import type { ItemDraft } from "@/stores/studio-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/** A dock entry, whether built-in or user-created. */
export type ExerciseDef = {
  exerciseId: string;
  name: string;
  emoji: string;
  tag: string;
  vibes: Vibes;
  mode: ExerciseMode;
  defaultSets: number;
  defaultReps: number;
  defaultSeconds: number;
  animationId: string | null;
  animationName: string | null;
  animationKind: CustomExercise["animationKind"];
  /** custom exercises can be removed from the library */
  custom: boolean;
};

const v = (
  cardio: number,
  strength: number,
  mobility: number,
  intensity: number,
  endurance: number,
): Vibes => ({ cardio, strength, mobility, intensity, endurance });

export const STRUCTURAL_BLOCKS: ExerciseDef[] = [
  {
    exerciseId: "rest", name: "Rest", emoji: "⏱️", tag: "recovery",
    vibes: v(0, 0, 10, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 60,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "superset", name: "Superset", emoji: "🔗", tag: "structure",
    vibes: v(0, 0, 0, 0, 0), mode: "reps",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 0,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "amrap", name: "AMRAP", emoji: "⏳", tag: "structure",
    vibes: v(0, 0, 0, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 300,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "emom", name: "EMOM", emoji: "⏱️", tag: "structure",
    vibes: v(0, 0, 0, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 60,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "warmup", name: "Warm-up", emoji: "🤸", tag: "structure",
    vibes: v(0, 0, 0, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 300,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "cooldown", name: "Cool-down", emoji: "🧘", tag: "structure",
    vibes: v(0, 0, 0, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 300,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "water", name: "Water Break", emoji: "💧", tag: "recovery",
    vibes: v(0, 0, 0, 0, 0), mode: "time",
    defaultSets: 1, defaultReps: 0, defaultSeconds: 60,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
];

/** Starter library — each built-in ships with its own vibe fingerprint. */
export const BUILTIN_EXERCISES: ExerciseDef[] = [
  {
    exerciseId: "squat", name: "Squats", emoji: "🦵", tag: "legs",
    vibes: v(40, 80, 45, 60, 55), mode: "reps",
    defaultSets: 4, defaultReps: 12, defaultSeconds: 45,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "pushup", name: "Push-ups", emoji: "💪", tag: "push",
    vibes: v(35, 80, 30, 60, 55), mode: "reps",
    defaultSets: 4, defaultReps: 10, defaultSeconds: 45,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "plank", name: "Plank hold", emoji: "🧱", tag: "core",
    vibes: v(20, 65, 40, 55, 80), mode: "time",
    defaultSets: 3, defaultReps: 12, defaultSeconds: 45,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "lunge", name: "Lunges", emoji: "🚶", tag: "legs",
    vibes: v(45, 70, 55, 55, 60), mode: "reps",
    defaultSets: 3, defaultReps: 10, defaultSeconds: 45,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "burpee", name: "Burpees", emoji: "🔥", tag: "full body",
    vibes: v(95, 55, 30, 95, 85), mode: "reps",
    defaultSets: 4, defaultReps: 8, defaultSeconds: 40,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "yoga", name: "Yoga flow", emoji: "🧘", tag: "mobility",
    vibes: v(15, 20, 95, 15, 45), mode: "time",
    defaultSets: 1, defaultReps: 10, defaultSeconds: 300,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "kbswing", name: "KB swings", emoji: "🏋️", tag: "hinge",
    vibes: v(75, 85, 35, 80, 75), mode: "reps",
    defaultSets: 5, defaultReps: 15, defaultSeconds: 40,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
  {
    exerciseId: "climber", name: "Climbers", emoji: "⛰️", tag: "cardio",
    vibes: v(90, 40, 35, 80, 80), mode: "time",
    defaultSets: 4, defaultReps: 30, defaultSeconds: 30,
    animationId: null, animationName: null, animationKind: null, custom: false,
  },
];

export function defFromCustom(e: CustomExercise): ExerciseDef {
  return {
    exerciseId: e.id,
    name: e.name,
    emoji: e.emoji,
    tag: e.tag,
    vibes: e.vibes,
    mode: e.mode,
    defaultSets: e.defaultSets,
    defaultReps: e.defaultReps,
    defaultSeconds: e.defaultSeconds,
    animationId: e.animationId,
    animationName: e.animationName,
    animationKind: e.animationKind,
    custom: true,
  };
}

/** Seed a canvas item from a dock definition (volume = the def's defaults). */
export function draftFromDef(def: ExerciseDef): ItemDraft {
  return {
    exerciseId: def.exerciseId,
    name: def.name,
    emoji: def.emoji,
    tag: def.tag,
    vibes: def.vibes,
    mode: def.mode,
    sets: def.defaultSets,
    reps: def.defaultReps,
    seconds: def.defaultSeconds,
    animation: null,
    animationId: def.animationId,
    animationName: def.animationName,
    animationKind: def.animationKind,
  };
}

/**
 * Drag physics (reanimated ↔ gesture-handler equivalent):
 *  - Raw pointer deltas land in `x`/`y` motion values (zero React renders
 *    per frame — updates ride the compositor thread).
 *  - `sx/sy` are springs (stiffness 480 / damping 38): on release we reset the
 *    motion values to 0 and the spring "flings home" along the same arc,
 *    inheriting its current velocity instead of teleporting.
 *  - Shadow depth is derived from displacement so pick-up feels physical.
 */
const DragCard = memo(function DragCard({
  def,
  dropRef,
  onHint,
  onDrop,
  onDelete,
}: {
  def: ExerciseDef;
  dropRef: RefObject<HTMLDivElement | null>;
  onHint: (over: boolean) => void;
  onDrop: (def: ExerciseDef) => void;
  onDelete?: (id: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 480, damping: 38, mass: 0.7 });
  const sy = useSpring(y, { stiffness: 480, damping: 38, mass: 0.7 });
  const shadow = useTransform([sx, sy], (latest) => {
    const [lx, ly] = latest as [number, number];
    const lift = Math.min(1, Math.hypot(lx, ly) / 40); // lift ∝ distance from origin
    return `0 ${10 + lift * 14}px ${24 + lift * 22}px -10px rgba(15,20,18,${0.18 + lift * 0.16})`;
  });
  const lastOver = useRef(false);

  const hitTest = useCallback(
    (px: number, py: number) => {
      const el = dropRef.current;
      if (!el) return false;
      const r = el.getBoundingClientRect();
      // small 6px fudge — fingers are imprecise near the rim
      return px > r.left - 6 && px < r.right + 6 && py > r.top - 6 && py < r.bottom + 6;
    },
    [dropRef],
  );

  const bind = useDrag(
    ({ active, movement: [mx, my], xy: [px, py], last, first }) => {
      if (first) {
        setDragging(true);
        haptic("selection"); // pick-up tick
      }
      if (active) {
        x.set(mx);
        y.set(my);
        const over = hitTest(px, py);
        if (over !== lastOver.current) {
          lastOver.current = over;
          onHint(over);
          if (over) haptic("light"); // crossing the drop-zone rim
        }
      }
      if (last) {
        const over = hitTest(px, py);
        setDragging(false);
        onHint(false);
        lastOver.current = false;
        if (over) {
          haptic("success");
          onDrop(def);
        } else {
          haptic("selection");
        }
        x.set(0);
        y.set(0);
      }
    },
    { filterTaps: true, threshold: 6, pointer: { touch: true } },
  );

  return (
    <div
      {...(bind() as any)}
      role="button"
      aria-roledescription="draggable"
      aria-label={`Drag ${def.name} into the canvas`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          haptic("success");
          onDrop(def);
        }
      }}
      className="group relative w-[86px] shrink-0 cursor-grab outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 active:cursor-grabbing dark:focus-visible:ring-amethyst/60"
      style={{ touchAction: "none", zIndex: dragging ? 50 : 10 }}
    >
      <motion.div
        style={{ x: sx, y: sy, boxShadow: shadow }}
        whileHover={{ scale: 1.03 }}
        className={cn(
          "pointer-events-none relative flex select-none flex-col items-center gap-1 rounded-[1.2rem] border px-2 pb-2.5 pt-3",
          dragging
            ? "border-mint-deep/50 bg-paper dark:border-amethyst/50 dark:bg-graphite"
            : "surface-solid",
        )}
      >
        <GripVertical
          className="absolute right-1.5 top-1.5 size-3 text-ink/25 dark:text-snow/25"
          aria-hidden
        />
        {def.animationId && def.animationKind ? (
          <AnimationPlayer
            id={def.animationId}
            kind={def.animationKind}
            name={def.animationName ?? def.name}
            className="size-9 rounded-full bg-ink/[0.04] object-cover dark:bg-white/[0.06]"
          />
        ) : (
          <span className="flex size-9 items-center justify-center rounded-full bg-mint/50 text-[17px] dark:bg-grape/25">
            {def.emoji}
          </span>
        )}
        <span className="line-clamp-2 text-center text-[10.5px] font-bold leading-tight text-ink dark:text-snow">
          {def.name}
        </span>
        <span className="text-[9px] font-semibold text-ink/45 dark:text-snow/40">
          {def.mode === "time"
            ? `${def.defaultSets}×${def.defaultSeconds}s`
            : `${def.defaultSets}×${def.defaultReps}`}
        </span>
      </motion.div>

      {def.custom && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            haptic("medium");
            onDelete(def.exerciseId);
          }}
          aria-label={`Delete ${def.name}`}
          className="absolute right-1 top-1 z-20 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white outline-none backdrop-blur transition-all opacity-0 group-hover:opacity-100 hover:bg-red-500 dark:bg-white/30"
        >
          <Trash2 className="size-2.5" aria-hidden />
        </button>
      )}
    </div>
  );
});

export const ExerciseDock = memo(function ExerciseDock({
  dropRef,
  onHint,
  onDrop,
  onAddExercise,
}: {
  dropRef: RefObject<HTMLDivElement | null>;
  onHint: (over: boolean) => void;
  onDrop: (def: ExerciseDef) => void;
  onAddExercise: () => void;
}) {
  const { data: custom = [], isPending } = useExercisesQuery();
  const del = useDeleteExercise();

  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMoreBlocks, setShowMoreBlocks] = useState(false);
  const viewMoreRef = useRef<HTMLButtonElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const filteredCustom = custom.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredBuiltin = BUILTIN_EXERCISES.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allExercises = [
    ...filteredCustom.map(e => ({ type: 'custom' as const, data: e })),
    ...filteredBuiltin.map(e => ({ type: 'builtin' as const, data: e }))
  ];

  const firstExercise = allExercises[0];
  const restExercises = allExercises.slice(1);

  const restBlock = STRUCTURAL_BLOCKS[0];
  const otherBlocks = STRUCTURAL_BLOCKS.slice(1);

  return (
    <div className="no-scrollbar flex w-[102px] shrink-0 flex-col gap-2 overflow-y-auto pr-1 pb-32">
      <div className="relative w-[86px] shrink-0">
        <Search className="absolute left-2 top-1.5 size-3 text-ink/40 dark:text-snow/40" />
        <input
          type="text"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-[0.8rem] bg-ink/5 py-1.5 pl-6 pr-2 text-[10px] text-ink outline-none placeholder:text-ink/40 focus:ring-1 focus:ring-mint-deep/50 dark:bg-white/10 dark:text-snow dark:placeholder:text-snow/40"
        />
      </div>

      {/* ── add-exercise button ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          haptic("light");
          onAddExercise();
        }}
        className="flex w-[86px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-[1.2rem] border-2 border-dashed border-mint-deep/40 bg-mint/15 px-2 pb-2.5 pt-3 outline-none transition-colors hover:border-mint-deep/70 hover:bg-mint/25 focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:border-amethyst/40 dark:bg-grape/15 dark:hover:border-amethyst/70 dark:focus-visible:ring-amethyst/60"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white">
          <Plus className="size-4.5" aria-hidden />
        </span>
        <span className="text-center text-[10.5px] font-bold leading-tight text-ink dark:text-snow">
          New move
        </span>
        <span className="text-[10px] font-bold text-ink/75 dark:text-snow/75">
          set its vibe
        </span>
      </motion.button>

      <p className="px-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ink/40 dark:text-snow/35">
        BLOCKS
      </p>
      
      <div className="flex flex-col gap-2">
        <DragCard
          def={restBlock}
          dropRef={dropRef}
          onHint={onHint}
          onDrop={onDrop}
        />
        {!showMoreBlocks ? (
          <button
            type="button"
            onClick={() => setShowMoreBlocks(true)}
            className="flex w-[86px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-ink/5 py-1.5 text-[10px] font-bold text-ink hover:bg-ink/10 dark:bg-white/5 dark:text-snow dark:hover:bg-white/10"
          >
            View more <ChevronDown className="size-3" />
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex gap-1.5 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setShowMoreBlocks(false)}
              className="w-1.5 shrink-0 rounded-full bg-mint-deep/40 transition-colors hover:bg-mint-deep dark:bg-amethyst/40 dark:hover:bg-amethyst"
              aria-label="Collapse blocks"
            />
            <div className="flex flex-col gap-2 pb-1">
              {otherBlocks.map((block) => (
                <DragCard
                  key={block.exerciseId}
                  def={block}
                  dropRef={dropRef}
                  onHint={onHint}
                  onDrop={onDrop}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <p className="px-1 pt-2 text-[8px] font-bold uppercase tracking-[0.15em] text-ink/40 dark:text-snow/35">
        EXERCISES (Drag to flow)
      </p>

      {/* custom first — freshest at the top */}
      {isPending && (
        <div aria-hidden className="flex justify-center py-2">
          <Loader2 className="size-4 animate-spin text-ink/30 dark:text-snow/30" />
        </div>
      )}

      {searchQuery ? (
        <div className="flex flex-col gap-2">
          {filteredCustom.map((e) => (
            <DragCard
              key={e.id}
              def={defFromCustom(e)}
              dropRef={dropRef}
              onHint={onHint}
              onDrop={onDrop}
              onDelete={(id) => del.mutate(id)}
            />
          ))}
          {filteredCustom.length > 0 && filteredBuiltin.length > 0 && (
            <p className="px-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ink/40 dark:text-snow/35">
              starters
            </p>
          )}
          {filteredBuiltin.map((def) => (
            <DragCard
              key={def.exerciseId}
              def={def}
              dropRef={dropRef}
              onHint={onHint}
              onDrop={onDrop}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {firstExercise && (
            firstExercise.type === 'custom' ? (
              <DragCard
                key={firstExercise.data.id}
                def={defFromCustom(firstExercise.data)}
                dropRef={dropRef}
                onHint={onHint}
                onDrop={onDrop}
                onDelete={(id) => del.mutate(id)}
              />
            ) : (
              <DragCard
                key={firstExercise.data.exerciseId}
                def={firstExercise.data}
                dropRef={dropRef}
                onHint={onHint}
                onDrop={onDrop}
              />
            )
          )}

          {restExercises.length > 0 && (
            !isExpanded ? (
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className="flex w-[86px] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full bg-ink/5 py-1.5 text-[10px] font-bold text-ink hover:bg-ink/10 dark:bg-white/5 dark:text-snow dark:hover:bg-white/10"
              >
                View more <ChevronDown className="size-3" />
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="flex gap-1.5 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="w-1.5 shrink-0 rounded-full bg-mint-deep/40 transition-colors hover:bg-mint-deep dark:bg-amethyst/40 dark:hover:bg-amethyst"
                  aria-label="Collapse exercises"
                />
                <div className="flex flex-col gap-2 pb-1">
                  {restExercises.map((ex, i) => (
                    <div key={ex.type === 'custom' ? ex.data.id : ex.data.exerciseId} className="flex flex-col gap-2">
                      {ex.type === 'builtin' && (firstExercise.type === 'custom' && i === 0 || i > 0 && restExercises[i - 1].type === 'custom') && (
                        <p className="px-1 pt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-ink/40 dark:text-snow/35">
                          starters
                        </p>
                      )}
                      {ex.type === 'custom' ? (
                        <DragCard
                          def={defFromCustom(ex.data)}
                          dropRef={dropRef}
                          onHint={onHint}
                          onDrop={onDrop}
                          onDelete={(id) => del.mutate(id)}
                        />
                      ) : (
                        <DragCard
                          def={ex.data}
                          dropRef={dropRef}
                          onHint={onHint}
                          onDrop={onDrop}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )
          )}
        </div>
      )}
    </div>
  );
});
