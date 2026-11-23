"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Trash2,
  Send,
  ChevronUp,
  ChevronDown,
  X,
  MousePointer2,
  Film,
  SlidersHorizontal,
  Box,
  Upload,
} from "lucide-react";
import { useStudioStore, type StudioItem } from "@/stores/studio-store";
import { useUiStore } from "@/stores/ui-store";
import { usePublishWorkout } from "@/lib/queries/feed";
import { useLoader } from "@/components/loading/momentum-loader";
import { AnimationPlayer } from "@/components/media/animation-player";
import {
  ExerciseDock,
  draftFromDef,
  type ExerciseDef,
} from "./exercise-dock";
import { AnimationPickerModal, PetCreatorModal } from "./studio-modals";
import { ExerciseBuilder } from "./exercise-builder";
import { ItemConfigSheet } from "./item-config-sheet";
import { ComputedVibePanel } from "./vibe-editor";
import {
  computeWorkoutVibes,
  estimateSeconds,
  volumeLabel,
  repsString,
} from "@/lib/vibes";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { usePublishedAnimationsStore } from "@/stores/published-animations-store";

/* -------------------------------------------------- canvas list row ----- */

const CanvasRow = memo(function CanvasRow({
  item,
  index,
  total,
  onConfigure,
  onAnimate,
}: {
  item: StudioItem;
  index: number;
  total: number;
  onConfigure: (uid: string) => void;
  onAnimate: (uid: string) => void;
}) {
  const removeItem = useStudioStore((s) => s.removeItem);
  const moveItem = useStudioStore((s) => s.moveItem);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.85, y: -8 }}
      // layout springs keep reorders butter-smooth; children never re-layout
      transition={{ type: "spring", stiffness: 520, damping: 38 }}
      role="button"
      tabIndex={0}
      aria-label={`${item.name}, ${volumeLabel(item)} — tap to change volume`}
      onClick={() => onConfigure(item.uid)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onConfigure(item.uid);
        }
      }}
      className="surface-solid group flex cursor-pointer items-center gap-2.5 rounded-2xl border border-transparent px-2.5 py-2.5 outline-none transition-colors hover:border-mint-deep/40 focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:hover:border-amethyst/40 dark:focus-visible:ring-amethyst/60"
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-ink/6 text-[10px] font-black text-ink/60 dark:bg-white/10 dark:text-snow/60">
        {index + 1}
      </span>

      {item.animationId && item.animationKind ? (
        <AnimationPlayer
          id={item.animationId}
          kind={item.animationKind}
          name={item.animationName ?? item.name}
          className="size-9 shrink-0 rounded-lg bg-ink/[0.04] object-cover dark:bg-white/[0.06]"
        />
      ) : (
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mint/35 text-[17px] dark:bg-grape/20">
          {item.emoji}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-bold text-ink dark:text-snow">
          {item.name}
          {item.animation && (
            <span className="ml-1.5 rounded-full bg-grape/15 px-1.5 py-0.5 text-[8.5px] font-black uppercase tracking-wide text-grape dark:bg-amethyst/20 dark:text-amethyst">
              {item.animation}
            </span>
          )}
        </p>
        <p className="truncate text-[10px] font-semibold text-mint-deep dark:text-amethyst">
          {volumeLabel(item)}
          <span className="text-ink/40 dark:text-snow/35"> · {item.tag}</span>
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label={`Change volume for ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            haptic("light");
            onConfigure(item.uid);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/40 outline-none transition-colors hover:bg-mint/30 hover:text-mint-deep dark:text-snow/40 dark:hover:bg-grape/25 dark:hover:text-amethyst"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Add animation to ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            haptic("light");
            onAnimate(item.uid);
          }}
          className={cn(
            "flex size-8 cursor-pointer items-center justify-center rounded-full outline-none transition-colors hover:bg-mint/30 dark:hover:bg-grape/25",
            item.animationId || item.animation
              ? "text-mint-deep dark:text-amethyst"
              : "text-ink/40 dark:text-snow/40",
          )}
        >
          <Film className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Move up"
          disabled={index === 0}
          onClick={(e) => {
            e.stopPropagation();
            haptic("selection");
            moveItem(item.uid, -1);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/40 outline-none transition-colors hover:bg-ink/5 disabled:opacity-25 dark:text-snow/40 dark:hover:bg-white/10"
        >
          <ChevronUp className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label="Move down"
          disabled={index === total - 1}
          onClick={(e) => {
            e.stopPropagation();
            haptic("selection");
            moveItem(item.uid, 1);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/40 outline-none transition-colors hover:bg-ink/5 disabled:opacity-25 dark:text-snow/40 dark:hover:bg-white/10"
        >
          <ChevronDown className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          aria-label={`Remove ${item.name}`}
          onClick={(e) => {
            e.stopPropagation();
            haptic("medium");
            removeItem(item.uid);
          }}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/40 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-snow/40 dark:hover:bg-red-400/10"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </motion.div>
  );
});

/* ---------------------------------------------------------- screen ------ */

export function StudioScreen() {
  const router = useRouter();
  const items = useStudioStore((s) => s.items);
  const title = useStudioStore((s) => s.title);
  const setTitle = useStudioStore((s) => s.setTitle);
  const addItem = useStudioStore((s) => s.addItem);
  const clear = useStudioStore((s) => s.clear);
  const setTab = useUiStore((s) => s.setTab);
  const pushToast = useUiStore((s) => s.pushToast);
  const publish = usePublishWorkout();
  const { load: showLoader, finish: hideLoader, fail: failLoader } = useLoader("plan");
  const publishAnimation = usePublishedAnimationsStore((s) => s.publishAnimation);

  const [hydrated, setHydrated] = useState(false);
  const [over, setOver] = useState(false);
  const [animUid, setAnimUid] = useState<string | null>(null);
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [configUid, setConfigUid] = useState<string | null>(null);
  const [configIsNew, setConfigIsNew] = useState(false);
  const [showThumbDrop, setShowThumbDrop] = useState(false);
  const dropRef = useRef<HTMLDivElement | null>(null);

  const description = useStudioStore((s) => s.description);
  const setDescription = useStudioStore((s) => s.setDescription);
  const cover = useStudioStore((s) => s.cover);
  const setCover = useStudioStore((s) => s.setCover);

  useEffect(() => setHydrated(true), []);

  /** The workout's vibe is derived, never hand-authored. */
  const computedVibes = useMemo(() => computeWorkoutVibes(items), [items]);
  const estMinutes = useMemo(
    () => Math.max(0, Math.round(estimateSeconds(items) / 60)),
    [items],
  );

  const onDrop = useCallback(
    (def: ExerciseDef) => {
      const uid = addItem(draftFromDef(def));
      // immediately ask for volume — that choice drives the workout's vibe
      setConfigIsNew(true);
      setConfigUid(uid);
    },
    [addItem],
  );

  const openConfig = useCallback((uid: string) => {
    setConfigIsNew(false);
    setConfigUid(uid);
  }, []);

  const openAnimatorFor = useCallback((uid: string) => {
    setAnimUid(uid);
  }, []);

  const doPublish = useCallback(() => {
    if (items.length === 0 || publish.isPending) return;
    haptic("medium");
    showLoader();  // ← Momentum Loader appears
    publish.mutate(
      {
        title: title.trim() || "Untitled flow",
        description: description.trim() || undefined,
        cover: cover || undefined,
        exercises: items.map((i) => ({
          name: i.name,
          sets: i.sets,
          reps: repsString(i),
          animation: i.animation,
          animationId: i.animationId,
          animationName: i.animationName,
          animationKind: i.animationKind,
        })),
        vibes: computedVibes,
      },
      {
        onSuccess: () => {
          haptic("success");
          hideLoader();  // ← success state plays, then auto-idles
          // Save each exercise animation to the global published-animations store
          items.forEach((item) => {
            publishAnimation({
              exerciseName: item.name.toLowerCase().trim(),
              displayName: item.name,
              sceneConfig: {
                presetId: item.animation ?? "pulse",
                skinTone: "#8d5a3b",
                shirtColor: "#ffc32b",
                shortsColor: "#f3f4f6",
                cameraPreset: "hero",
                speed: 1,
                autoRotate: true,
              },
              author: "You",
            });
          });
          pushToast({
            title: "Published to the feed",
            message: "your crew can run it now",
            tone: "mint",
          });
          clear();
          setTab("feed");
        },
        onError: (err) => {
          failLoader(err.message);  // ← error state with retry
          pushToast({ title: "Publish failed", message: err.message, tone: "grape" });
        },
      },
    );
  }, [items, publish, title, computedVibes, pushToast, clear, setTab, publishAnimation]);

  if (!hydrated) {
    return (
      <div aria-hidden className="flex flex-col gap-4 pt-1">
        <div className="shimmer h-9 w-44 rounded-full bg-ink/[0.06] dark:bg-white/[0.07]" />
        <div className="shimmer h-[380px] rounded-[2rem] bg-ink/[0.05] dark:bg-white/[0.06]" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-mint-deep dark:text-amethyst">
          create
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-none text-ink dark:text-snow">
          the studio
        </h1>
        <p className="mt-2 text-[12px] text-ink/55 dark:text-snow/50">
          Build your own moves, drag them in, then pick reps or time — the vibe
          writes itself.
        </p>
      </div>

      {/* builder */}
      <div className="flex items-stretch gap-3">
        {/* dock */}
        <div className="surface-solid shadow-soft flex shrink-0 rounded-[2rem] p-2">
          <ExerciseDock
            dropRef={dropRef}
            onHint={setOver}
            onDrop={onDrop}
            onAddExercise={() => setBuilderOpen(true)}
          />
        </div>

        {/* studio canvas pane */}
        <div className="surface-solid shadow-soft flex min-h-[440px] flex-1 flex-col rounded-[2rem] p-3">
          <div className="mb-3 flex flex-col gap-2 px-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Workout title"
              placeholder="Untitled flow"
              className="min-w-0 flex-1 bg-transparent text-[18px] font-bold tracking-tight text-ink outline-none placeholder:text-ink/30 dark:text-snow dark:placeholder:text-snow/25"
            />
          </div>

          <motion.div
            ref={dropRef}
            animate={{ scale: over ? 1.015 : 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className={cn(
              "relative flex-1 overflow-hidden rounded-[1.4rem] border-2 transition-colors",
              over
                ? "border-mint-deep/70 bg-mint/20 dark:border-amethyst/70 dark:bg-grape/15"
                : "border-transparent bg-ink/[0.03] dark:bg-white/[0.04]",
            )}
            aria-label="Workout canvas"
            aria-dropeffect="copy"
          >
            {items.length === 0 ? (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
                <motion.span
                  animate={{ x: [-4, 4, -4] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                  className="flex size-12 items-center justify-center rounded-full bg-mint/40 text-pine dark:bg-grape/25 dark:text-lilac"
                >
                  <MousePointer2 className="size-5" aria-hidden />
                </motion.span>
                <p className="text-[13px] font-bold text-ink/60 dark:text-snow/55">
                  Drag moves into the Studio
                </p>
                <p className="text-[10.5px] text-ink/40 dark:text-snow/35">
                  then set reps or time for each
                </p>
              </div>
            ) : (
              <div className="no-scrollbar flex h-full flex-col gap-1.5 overflow-y-auto p-2">
                <AnimatePresence initial={false} mode="popLayout">
                  {items.map((item, i) => (
                    <CanvasRow
                      key={item.uid}
                      item={item}
                      index={i}
                      total={items.length}
                      onConfigure={openConfig}
                      onAnimate={openAnimatorFor}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            <AnimatePresence>
              {over && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center"
                >
                  <span className="rounded-full bg-pine px-4 py-2 text-[11px] font-bold text-mint shadow-lg dark:bg-amethyst dark:text-void">
                    Drop to add
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* derived workout vibe */}
      <ComputedVibePanel
        vibes={computedVibes}
        moveCount={items.length}
        estMinutes={estMinutes}
      />

      {/* Meta config: Description & Thumbnail */}
      <div className="surface-solid shadow-soft flex flex-col gap-3 rounded-[2rem] p-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          aria-label="Workout description"
          placeholder="Add a short description about this flow..."
          rows={2}
          className="w-full resize-none bg-transparent text-[12px] text-ink/70 outline-none placeholder:text-ink/40 dark:text-snow/70 dark:placeholder:text-snow/40"
        />
        
        <div>
          <button
            type="button"
            onClick={() => setShowThumbDrop(!showThumbDrop)}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-ink/5 px-3 py-2.5 text-[11px] font-bold text-ink hover:bg-ink/10 transition-colors dark:bg-white/10 dark:text-snow dark:hover:bg-white/15"
          >
            <Upload className="size-3" />
            {cover ? "Change thumbnail" : "Add thumbnail"}
          </button>
        </div>

        <AnimatePresence>
          {showThumbDrop && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/20 bg-ink/5 p-4 transition-colors hover:border-mint-deep hover:bg-mint/10 dark:border-white/20 dark:bg-white/5 dark:hover:border-amethyst dark:hover:bg-grape/20">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setCover(ev.target?.result as string);
                        setShowThumbDrop(false);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                {cover ? (
                  <div className="flex flex-col items-center gap-2">
                    <img src={cover} alt="Thumbnail preview" className="h-24 w-24 rounded-xl object-cover shadow-sm" />
                    <span className="text-[10px] font-bold text-ink/50 dark:text-snow/50">Click to change</span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-ink/50 text-center dark:text-snow/50">
                    Drag & Drop or click to upload high-quality image
                  </span>
                )}
              </label>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* toolbar */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            haptic("light");
            setCreatorOpen(true);
          }}
          className="surface-solid flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[12px] font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:text-snow dark:focus-visible:ring-amethyst/60"
        >
          <Palette className="size-4 text-mint-deep dark:text-amethyst" aria-hidden />
          Pet maker
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            if (items.length === 0) return;
            haptic("medium");
            clear();
            pushToast({ title: "Canvas cleared", tone: "grape" });
          }}
          aria-label="Clear canvas"
          className="surface-solid flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[12px] font-bold text-ink/70 outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:text-snow/70 dark:focus-visible:ring-amethyst/60"
        >
          <Trash2 className="size-4" aria-hidden />
          Clear
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.94 }}
          onClick={() => {
            haptic("light");
            router.push('/3d-builder');
          }}
          className="surface-solid flex min-h-12 cursor-pointer items-center justify-center gap-1.5 rounded-full text-[12px] font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:text-snow dark:focus-visible:ring-amethyst/60"
        >
          <Box className="size-4 text-mint-deep dark:text-amethyst" aria-hidden />
          3D Builder
        </motion.button>
      </div>

      {/* publish */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={doPublish}
        disabled={items.length === 0 || publish.isPending}
        className={cn(
          "flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full text-[14px] font-bold outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-mint-deep/70 dark:focus-visible:ring-amethyst/70",
          "bg-gradient-to-r from-mint to-mint-strong text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] dark:from-grape dark:to-iris dark:text-white dark:shadow-[0_16px_34px_-14px_rgba(139,92,246,0.9)]",
          (items.length === 0 || publish.isPending) && "cursor-not-allowed opacity-45",
        )}
      >
        {publish.isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine dark:border-white/30 dark:border-t-white" />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Publish to feed{items.length > 0 ? ` · ${items.length} moves` : ""}
      </motion.button>

      <ExerciseBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} />
      <ItemConfigSheet
        uid={configUid}
        isNew={configIsNew}
        onClose={() => setConfigUid(null)}
      />
      <AnimationPickerModal uid={animUid} onClose={() => setAnimUid(null)} />
      <PetCreatorModal open={creatorOpen} onClose={() => setCreatorOpen(false)} />
    </div>
  );
}
