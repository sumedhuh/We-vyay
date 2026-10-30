import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import {
  X, Plus, Sparkles, Eye, ChevronUp, Dumbbell, Wand2, Save, RotateCcw, Palette,
} from "lucide-react";
import { useBuilderStore } from "../store";
import { useSceneStore } from "../scene/store";
import { THEMES } from "../scene/data";
import BlockCard from "./BlockCard";
import ExercisePicker from "./ExercisePicker";
import WorkoutPreviewPhone from "./WorkoutPreviewPhone";
import { estimateWorkoutSeconds, formatDuration, totalSets } from "../data";
import { cn } from "@/lib/utils";

export default function WorkoutBuilder() {
  const isOpen = useBuilderStore((s) => s.isOpen);
  const close = useBuilderStore((s) => s.close);
  const workoutName = useBuilderStore((s) => s.workoutName);
  const setWorkoutName = useBuilderStore((s) => s.setWorkoutName);
  const blocks = useBuilderStore((s) => s.blocks);
  const openPicker = useBuilderStore((s) => s.openPicker);
  const reorderBlocks = useBuilderStore((s) => s.reorderBlocks);
  const resetBuilder = useBuilderStore((s) => s.resetBuilder);
  const loadDemo = useBuilderStore((s) => s.loadDemo);
  const mobilePreviewOpen = useBuilderStore((s) => s.mobilePreviewOpen);
  const toggleMobilePreview = useBuilderStore((s) => s.toggleMobilePreview);
  const activeTheme = useSceneStore((s) => s.activeTheme);

  const [saved, setSaved] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  if (!isOpen) return null;

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) reorderBlocks(String(active.id), String(over.id));
  };

  const totalSeconds = estimateWorkoutSeconds(blocks);
  const sets = totalSets(blocks);

  const doSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="studio-font pointer-events-auto fixed inset-0 z-[55] flex flex-col bg-[#05060a]">
      {/* header */}
      <header className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-lime-300/[0.08] via-transparent to-cyan-300/[0.05] px-4 py-3 sm:px-6">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 to-cyan-300 shadow-[0_0_20px_rgba(212,255,63,0.4)]">
          <Wand2 size={19} className="text-black" strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9.5px] font-black tracking-[0.22em] text-lime-300/80">WORKOUT BUILDER</p>
          <input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Name your workout"
            className="w-full max-w-xs truncate rounded-lg border border-transparent bg-transparent text-base font-black text-white outline-none placeholder:text-white/25 hover:border-white/12 focus:border-lime-300/50 focus:bg-black/30"
          />
        </div>
        <div className="hidden items-center gap-3 text-[11px] font-bold text-white/40 md:flex">
          <span>{blocks.length} blocks</span>·<span>{sets} sets</span>·<span className="text-lime-300">{formatDuration(totalSeconds)}</span>
        </div>
        <button onClick={resetBuilder} title="Clear everything" className="hidden rounded-xl border border-white/15 p-2 text-white/50 transition hover:bg-white/10 hover:text-white sm:flex">
          <RotateCcw size={16} />
        </button>
        <button onClick={doSave}
          className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-black tracking-wider transition",
            saved ? "border-lime-300 bg-lime-300 text-black" : "border-white/18 text-white/75 hover:border-lime-300/60 hover:text-lime-200")}>
          <Save size={13} /> {saved ? "SAVED!" : "SAVE"}
        </button>
        <button onClick={close} className="rounded-xl border border-white/15 p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
          <X size={18} />
        </button>
      </header>

      {/* mobile sticky summary bar */}
      <button
        onClick={() => toggleMobilePreview(true)}
        className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/50 px-4 py-2.5 text-left lg:hidden"
      >
        <Eye size={14} className="text-lime-300" />
        <span className="min-w-0 flex-1 truncate text-[11px] font-bold text-white/70">
          Preview: {blocks.length ? `${blocks.length} blocks · ${formatDuration(totalSeconds)}` : "Empty workout"}
        </span>
        <ChevronUp size={14} className="shrink-0 text-white/40" />
      </button>

      {/* body: split desktop / stacked mobile */}
      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* LEFT — builder form */}
        <div className="min-h-0 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto max-w-3xl space-y-3">
            {/* scene theme preset — the routine carries its own room */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-violet-300/20 bg-violet-300/[0.04] px-3 py-2.5">
              <span className="flex shrink-0 items-center gap-1 text-[9.5px] font-black tracking-widest text-violet-200"><Palette size={11} /> ROOM</span>
              {THEMES.map((t) => (
                <button key={t.id} onClick={() => useSceneStore.getState().setTheme(t.id)}
                  className={cn("flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold transition",
                    activeTheme === t.id ? "border-lime-300/60 bg-lime-300/15 text-lime-200" : "border-white/12 text-white/50 hover:text-white")}>
                  <span className="text-xs">{t.emoji}</span>{t.name}
                </button>
              ))}
            </div>
            {blocks.length === 0 && (
              <div className="rounded-3xl border border-dashed border-white/15 p-10 text-center">
                <Dumbbell size={30} className="mx-auto mb-3 text-white/15" />
                <p className="mb-1 text-sm font-bold text-white/60">Start building your workout</p>
                <p className="mb-4 text-[11px] text-white/35">Search a huge exercise library, then fine-tune sets, reps, rest, weight, tempo & RPE.</p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button onClick={() => openPicker()} className="flex items-center gap-1.5 rounded-full bg-lime-300 px-4 py-2 text-xs font-black text-black transition hover:bg-lime-200">
                    <Plus size={14} strokeWidth={3} /> ADD FIRST EXERCISE
                  </button>
                  <button onClick={loadDemo} className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-bold text-white/60 transition hover:text-white">
                    <Sparkles size={13} /> Try a demo workout
                  </button>
                </div>
              </div>
            )}

            {blocks.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {blocks.map((block: any, i: number) => (
                      <BlockCard key={block.id} block={block} index={i} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {blocks.length > 0 && (
              <button onClick={() => openPicker()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-3.5 text-xs font-black tracking-wider text-white/50 transition hover:border-lime-300/50 hover:text-lime-200">
                <Plus size={14} strokeWidth={3} /> ADD ANOTHER EXERCISE
              </button>
            )}
          </div>
        </div>

        {/* RIGHT — sticky live preview (desktop only) */}
        <div className="hidden min-h-0 flex-col border-l border-white/10 bg-[#070910] p-5 lg:flex">
          <p className="mb-3 flex items-center gap-1.5 text-[10px] font-black tracking-[0.22em] text-white/35">
            <Eye size={12} /> LIVE PREVIEW — UPDATES INSTANTLY
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto py-2">
            <WorkoutPreviewPhone />
          </div>
        </div>
      </div>

      {/* mobile swipe-up preview sheet */}
      {mobilePreviewOpen && (
        <div className="fixed inset-0 z-[65] flex items-end bg-black/70 backdrop-blur-sm lg:hidden" onClick={() => toggleMobilePreview(false)}>
          <div onClick={(e) => e.stopPropagation()} className="flex h-[88vh] w-full flex-col rounded-t-3xl border-t border-white/12 bg-[#080b12] pt-2">
            <div className="mx-auto mb-1 h-1.5 w-12 shrink-0 rounded-full bg-white/20" />
            <div className="flex shrink-0 items-center justify-between px-4 pb-2">
              <p className="flex items-center gap-1.5 text-[11px] font-black tracking-widest text-white/50"><Eye size={13} className="text-lime-300" /> LIVE PREVIEW</p>
              <button onClick={() => toggleMobilePreview(false)} className="rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white"><X size={16} /></button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
              <WorkoutPreviewPhone compact />
            </div>
          </div>
        </div>
      )}

      <ExercisePicker />
    </div>
  );
}


