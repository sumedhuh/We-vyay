import { Play, Clock, Layers, Flame, Link2, RotateCw, Dumbbell, Wifi, Signal, BatteryFull } from "lucide-react";
import { useBuilderStore } from "../store";
import {
  exerciseById, estimateBlockSeconds, estimateWorkoutSeconds, formatDuration, totalSets, blockLabel,
} from "../data";
import { cn } from "@/lib/utils";

function StatusBar() {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="flex items-center justify-between px-5 pt-3 pb-1 text-[11px] font-semibold text-white/90">
      <span>{time}</span>
      <div className="flex items-center gap-1">
        <Signal size={12} /> <Wifi size={12} /> <BatteryFull size={14} />
      </div>
    </div>
  );
}

export default function WorkoutPreviewPhone({ compact = false }: { compact?: boolean }) {
  const workoutName = useBuilderStore((s) => s.workoutName);
  const blocks = useBuilderStore((s) => s.blocks);

  const totalSeconds = estimateWorkoutSeconds(blocks);
  const sets = totalSets(blocks);
  const kcal = Math.round((totalSeconds / 60) * 7); // rough estimate for preview flavor

  return (
    <div className={cn("mx-auto flex flex-col", compact ? "w-full max-w-full" : "w-[300px]")}>
      {/* phone frame */}
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-[2.5rem] border-[6px] border-[#1b2030] bg-[#07080d] shadow-[0_30px_70px_rgba(0,0,0,0.55)]",
          compact ? "h-full rounded-2xl border-0" : "h-[610px]"
        )}
      >
        {!compact && (
          <>
            <div className="absolute top-0 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-[#1b2030]" />
            <StatusBar />
          </>
        )}

        {/* header */}
        <div className="shrink-0 border-b border-white/8 bg-gradient-to-b from-lime-300/[0.08] to-transparent px-5 pt-2 pb-4">
          <p className="text-[10px] font-black tracking-[0.25em] text-lime-300/80">WORKOUT PREVIEW</p>
          <h3 className="mt-1 truncate text-xl font-black text-white">{workoutName || "Untitled Workout"}</h3>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <StatChip icon={<Clock size={13} />} label="Duration" value={formatDuration(totalSeconds)} />
            <StatChip icon={<Layers size={13} />} label="Sets" value={String(sets)} />
            <StatChip icon={<Flame size={13} />} label="Kcal" value={`~${kcal}`} />
          </div>
        </div>

        {/* queue */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {blocks.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
              <Dumbbell size={28} className="text-white/15" />
              <p className="text-xs font-bold text-white/40">Your workout is empty</p>
              <p className="text-[11px] text-white/25">Add exercises on the left and watch this screen build itself in real time.</p>
            </div>
          ) : (
            blocks.map((block, i) => {
              const dur = estimateBlockSeconds(block);
              const isGroup = block.type === "group";
              return (
                <div key={block.id} className="relative">
                  {isGroup && (
                    <div className="pointer-events-none absolute top-3 bottom-3 left-[19px] w-px bg-gradient-to-b from-cyan-300/50 to-lime-300/50" />
                  )}
                  <div className="mb-1.5 flex items-center gap-2 pl-0.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-black text-white/70">{i + 1}</span>
                    {isGroup && (
                      <span className="flex items-center gap-1 rounded-full bg-cyan-300/15 px-2 py-0.5 text-[9px] font-black tracking-wider text-cyan-200">
                        <Link2 size={9} /> {blockLabel(block).toUpperCase()} · {block.rounds} ROUNDS
                      </span>
                    )}
                    <span className="ml-auto text-[10px] font-bold text-white/30">{formatDuration(dur)}</span>
                  </div>
                  <div className="space-y-1.5 pl-8">
                    {block.exercises.map((ex) => {
                      const def = exerciseById(ex.exerciseId);
                      return (
                        <div key={ex.id} className="flex items-center gap-2.5 rounded-xl border border-white/8 bg-white/[0.035] px-3 py-2.5">
                          <span className="text-lg leading-none">{def?.emoji ?? "🏋️"}</span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12.5px] font-bold text-white">{def?.name ?? "Exercise"}</p>
                            <p className="truncate text-[10.5px] font-medium text-white/40">
                              {block.type === "single" ? `${ex.sets} × ` : ""}{ex.reps} reps
                              {ex.weight > 0 ? ` · ${ex.weight}${ex.weightUnit}` : ""}
                              {ex.rpe ? ` · RPE ${ex.rpe}` : ""}
                            </p>
                          </div>
                          {block.type === "single" && ex.restSec > 0 && (
                            <span className="shrink-0 rounded-full bg-white/8 px-2 py-1 text-[9px] font-bold text-white/45">{ex.restSec}s rest</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {isGroup && block.restBetweenExercisesSec > 0 && (
                    <p className="mt-1 pl-8 text-[9px] font-semibold text-white/25">↻ {block.restBetweenExercisesSec}s between exercises</p>
                  )}
                  {block.restAfterBlockSec > 0 && i < blocks.length - 1 && (
                    <div className="mt-2 flex items-center gap-1.5 pl-8 text-[9.5px] font-bold text-orange-300/70">
                      <RotateCw size={10} /> Rest {block.restAfterBlockSec}s before next
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* sticky play footer, mimics the real workout-start screen */}
        <div className="shrink-0 border-t border-white/8 bg-black/60 p-4">
          <button
            disabled={blocks.length === 0}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black tracking-wide transition",
              blocks.length === 0 ? "cursor-not-allowed bg-white/8 text-white/25" : "bg-lime-300 text-black shadow-[0_0_24px_rgba(212,255,63,0.4)] hover:bg-lime-200"
            )}
          >
            <Play size={16} strokeWidth={2.8} className="fill-current" /> START WORKOUT
          </button>
        </div>
      </div>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2 text-center">
      <div className="mb-0.5 flex items-center justify-center gap-1 text-white/35">{icon}</div>
      <p className="font-mono text-[13px] font-bold text-white">{value}</p>
      <p className="text-[8px] font-bold tracking-wider text-white/30">{label.toUpperCase()}</p>
    </div>
  );
}


