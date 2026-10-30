import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Trash2, Copy, Link2, Unlink, Plus, ChevronDown,
  Minus, ArrowUp, ArrowDown, Gauge, Activity, Play,
} from "lucide-react";
import { useBuilderStore } from "../store";
import { usePushupStore } from "../store";
import {
  exerciseById, blockLabel, estimateBlockSeconds, formatDuration, TEMPO_PRESETS, RPE_LABELS, REST_PRESETS,
  type WorkoutBlock, type BuilderExercise,
} from "../data";
import { cn } from "@/lib/utils";

function NumberStepper({ value, onChange, min = 0, max = 999, step = 1, suffix = "" }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/12 bg-black/30">
      <button onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))} className="flex h-7 w-7 items-center justify-center text-white/50 transition hover:text-white">
        <Minus size={12} />
      </button>
      <span className="w-10 shrink-0 text-center font-mono text-[12px] font-bold text-white">{value}{suffix}</span>
      <button onClick={() => onChange(Math.min(max, +(value + step).toFixed(2)))} className="flex h-7 w-7 items-center justify-center text-white/50 transition hover:text-white">
        <Plus size={12} />
      </button>
    </div>
  );
}

function ExerciseRow({ block, ex, isOnly }: { block: WorkoutBlock; ex: BuilderExercise; isOnly: boolean }) {
  const updateExercise = useBuilderStore((s) => s.updateExercise);
  const removeExercise = useBuilderStore((s) => s.removeExercise);
  const moveExerciseWithinBlock = useBuilderStore((s) => s.moveExerciseWithinBlock);
  const splitBlock = useBuilderStore((s) => s.splitBlock);
  const loadSequence = usePushupStore((s) => s.loadSequence);
  const def = exerciseById(ex.exerciseId);
  const idx = block.exercises.findIndex((e) => e.id === ex.id);

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-2.5 flex items-center gap-2">
        <span className="text-lg leading-none">{def?.emoji ?? "🏋️"}</span>
        <p className="min-w-0 flex-1 truncate text-[13px] font-bold text-white">{def?.name ?? "Exercise"}</p>
        {def?.sequenceId && (
          <button
            title="Preview on the 3D athlete"
            onClick={() => loadSequence(def.sequenceId!)}
            className="flex shrink-0 items-center gap-1 rounded-full border border-lime-300/40 bg-lime-300/10 px-2 py-1 text-[9.5px] font-black text-lime-200 transition hover:bg-lime-300/20"
          >
            <Play size={9} className="fill-current" /> 3D
          </button>
        )}
        {!isOnly && (
          <div className="flex shrink-0 items-center gap-0.5">
            <button onClick={() => moveExerciseWithinBlock(block.id, idx, idx - 1)} disabled={idx === 0} className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowUp size={12} /></button>
            <button onClick={() => moveExerciseWithinBlock(block.id, idx, idx + 1)} disabled={idx === block.exercises.length - 1} className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowDown size={12} /></button>
            <button title="Pull out of superset" onClick={() => splitBlock(block.id, idx)} className="rounded p-1 text-white/35 transition hover:bg-white/10 hover:text-white"><Unlink size={12} /></button>
          </div>
        )}
        <button onClick={() => removeExercise(block.id, ex.id)} className="shrink-0 rounded p-1 text-white/30 transition hover:bg-red-500/15 hover:text-red-300">
          <Trash2 size={13} />
        </button>
      </div>

      {/* core params */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {block.type === "single" && (
          <Field label="Sets">
            <NumberStepper value={ex.sets} onChange={(v) => updateExercise(block.id, ex.id, { sets: v })} min={1} max={20} />
          </Field>
        )}
        <Field label="Reps">
          <input
            value={ex.reps}
            onChange={(e) => updateExercise(block.id, ex.id, { reps: e.target.value })}
            placeholder="10 or 30s"
            className="w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-center font-mono text-[12px] font-bold text-white outline-none focus:border-lime-300/60"
          />
        </Field>
        <Field label="Weight">
          <div className="flex items-center gap-1">
            <input
              type="number" value={ex.weight} min={0}
              onChange={(e) => updateExercise(block.id, ex.id, { weight: Number(e.target.value) })}
              className="w-full min-w-0 rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-center font-mono text-[12px] font-bold text-white outline-none focus:border-lime-300/60"
            />
            <button
              onClick={() => updateExercise(block.id, ex.id, { weightUnit: ex.weightUnit === "kg" ? "lb" : "kg" })}
              className="shrink-0 rounded-lg border border-white/12 bg-black/30 px-1.5 py-1.5 text-[10px] font-bold text-white/60 hover:text-white"
            >
              {ex.weightUnit}
            </button>
          </div>
        </Field>
        {block.type === "single" && (
          <Field label="Rest">
            <select
              value={ex.restSec}
              onChange={(e) => updateExercise(block.id, ex.id, { restSec: Number(e.target.value) })}
              className="w-full rounded-lg border border-white/12 bg-black/30 px-1.5 py-1.5 text-center font-mono text-[12px] font-bold text-white outline-none focus:border-lime-300/60"
            >
              {REST_PRESETS.map((r) => <option key={r} value={r} className="bg-[#0a0d14]">{r}s</option>)}
            </select>
          </Field>
        )}
      </div>

      {/* advanced toggle */}
      <button
        onClick={() => updateExercise(block.id, ex.id, { advancedOpen: !ex.advancedOpen })}
        className="mt-2.5 flex items-center gap-1 text-[10.5px] font-bold text-white/40 transition hover:text-cyan-200"
      >
        <ChevronDown size={12} className={cn("transition-transform", ex.advancedOpen && "rotate-180")} />
        Advanced (tempo & RPE)
      </button>
      {ex.advancedOpen && (
        <div className="mt-2 grid grid-cols-1 gap-3 rounded-xl border border-cyan-300/15 bg-cyan-300/[0.04] p-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-white/50"><Gauge size={11} /> TEMPO</p>
            <div className="mb-1.5 flex flex-wrap gap-1">
              {TEMPO_PRESETS.map((t) => (
                <button key={t.id} title={t.hint} onClick={() => updateExercise(block.id, ex.id, { tempo: t.value })}
                  className={cn("rounded-full border px-2 py-1 text-[9.5px] font-bold transition",
                    ex.tempo === t.value ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-200" : "border-white/12 text-white/45 hover:text-white")}>
                  {t.label}
                </button>
              ))}
            </div>
            <input
              value={ex.tempo}
              onChange={(e) => updateExercise(block.id, ex.id, { tempo: e.target.value })}
              className="w-full rounded-lg border border-white/12 bg-black/30 px-2 py-1.5 text-center font-mono text-[11px] font-bold text-white outline-none focus:border-cyan-300/60"
            />
          </div>
          <div>
            <p className="mb-1.5 flex items-center gap-1 text-[10px] font-bold text-white/50"><Activity size={11} /> RPE — {ex.rpe} / 10</p>
            <input
              type="range" min={5} max={10} step={1} value={ex.rpe}
              onChange={(e) => updateExercise(block.id, ex.id, { rpe: Number(e.target.value) })}
              className="w-full" style={{ accentColor: "#22d3ee" }}
            />
            <p className="mt-1 text-[9.5px] text-white/35">{RPE_LABELS[ex.rpe] ?? ""}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-black tracking-wider text-white/35">{label.toUpperCase()}</p>
      {children}
    </div>
  );
}

export default function BlockCard({ block, index }: { block: WorkoutBlock; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: block.id });
  const removeBlock = useBuilderStore((s) => s.removeBlock);
  const duplicateBlock = useBuilderStore((s) => s.duplicateBlock);
  const openPicker = useBuilderStore((s) => s.openPicker);
  const updateBlock = useBuilderStore((s) => s.updateBlock);

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const isGroup = block.type === "group";

  return (
    <div ref={setNodeRef} style={style} className={cn("rounded-2xl border p-3.5 transition-colors", isGroup ? "border-cyan-300/25 bg-cyan-300/[0.03]" : "border-white/10 bg-white/[0.02]")}>
      {/* block header */}
      <div className="mb-3 flex items-center gap-2">
        <button {...attributes} {...listeners} title="Drag to reorder" className="cursor-grab touch-none rounded-lg p-1.5 text-white/30 transition hover:bg-white/10 hover:text-white active:cursor-grabbing">
          <GripVertical size={16} />
        </button>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white/70">{index + 1}</span>
        <span className={cn("rounded-full px-2 py-0.5 text-[9.5px] font-black tracking-wider", isGroup ? "bg-cyan-300/15 text-cyan-200" : "bg-white/8 text-white/45")}>
          {blockLabel(block).toUpperCase()}
        </span>
        <span className="ml-auto font-mono text-[10.5px] font-bold text-white/30">{formatDuration(estimateBlockSeconds(block))}</span>
        <button onClick={() => duplicateBlock(block.id)} title="Duplicate" className="rounded-lg p-1.5 text-white/35 transition hover:bg-white/10 hover:text-white"><Copy size={14} /></button>
        <button onClick={() => removeBlock(block.id)} title="Delete" className="rounded-lg p-1.5 text-white/35 transition hover:bg-red-500/15 hover:text-red-300"><Trash2 size={14} /></button>
      </div>

      {/* exercises */}
      <div className="space-y-2">
        {block.exercises.map((ex) => (
          <ExerciseRow key={ex.id} block={block} ex={ex} isOnly={block.exercises.length === 1} />
        ))}
      </div>

      {/* group controls */}
      {isGroup && (
        <div className="mt-2.5 flex flex-wrap items-center gap-3 rounded-xl border border-cyan-300/15 bg-black/20 p-2.5">
          <Field label="Rounds"><NumberStepper value={block.rounds} onChange={(v) => updateBlock(block.id, { rounds: v })} min={1} max={10} /></Field>
          <Field label="Between exercises">
            <NumberStepper value={block.restBetweenExercisesSec} onChange={(v) => updateBlock(block.id, { restBetweenExercisesSec: v })} min={0} max={120} step={5} suffix="s" />
          </Field>
        </div>
      )}

      {/* footer actions */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button onClick={() => openPicker(block.id)}
          className="flex items-center gap-1.5 rounded-full border border-cyan-300/30 bg-cyan-300/[0.06] px-3 py-1.5 text-[10.5px] font-bold text-cyan-200 transition hover:bg-cyan-300/15">
          <Link2 size={12} /> Link into {isGroup ? "this " + blockLabel(block).toLowerCase() : "a superset"}
        </button>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[9.5px] font-bold text-white/30">REST AFTER</span>
          <NumberStepper value={block.restAfterBlockSec} onChange={(v) => updateBlock(block.id, { restAfterBlockSec: v })} min={0} max={240} step={15} suffix="s" />
        </div>
      </div>
    </div>
  );
}


