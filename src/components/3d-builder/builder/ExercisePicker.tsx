import { Search, X, Sparkles, Link2 } from "lucide-react";
import { useBuilderStore } from "../store";
import { EXERCISE_LIBRARY, MUSCLES, EQUIPMENT, MOVEMENT_TYPES } from "../data";
import { cn } from "@/lib/utils";

export default function ExercisePicker() {
  const pickerOpen = useBuilderStore((s) => s.pickerOpen);
  const targetBlockId = useBuilderStore((s) => s.pickerTargetBlockId);
  const closePicker = useBuilderStore((s) => s.closePicker);
  const search = useBuilderStore((s) => s.search);
  const setSearch = useBuilderStore((s) => s.setSearch);
  const muscleFilters = useBuilderStore((s) => s.muscleFilters);
  const toggleMuscleFilter = useBuilderStore((s) => s.toggleMuscleFilter);
  const equipmentFilters = useBuilderStore((s) => s.equipmentFilters);
  const toggleEquipmentFilter = useBuilderStore((s) => s.toggleEquipmentFilter);
  const movementFilters = useBuilderStore((s) => s.movementFilters);
  const toggleMovementFilter = useBuilderStore((s) => s.toggleMovementFilter);
  const clearFilters = useBuilderStore((s) => s.clearFilters);
  const addExercise = useBuilderStore((s) => s.addExercise);

  if (!pickerOpen) return null;

  const q = search.trim().toLowerCase();
  const filtered = EXERCISE_LIBRARY.filter((e) => {
    if (q && !e.name.toLowerCase().includes(q)) return false;
    if (muscleFilters.length && !e.muscles?.some((m) => muscleFilters.includes(m))) return false;
    if (equipmentFilters.length && !equipmentFilters.includes(e.equipment)) return false;
    if (movementFilters.length && !movementFilters.includes(e.movement)) return false;
    return true;
  });

  const hasFilters = muscleFilters.length > 0 || equipmentFilters.length > 0 || movementFilters.length > 0 || q.length > 0;

  return (
    <div className="pointer-events-auto fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-4">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0a0d14] shadow-[0_-20px_80px_rgba(0,0,0,0.6)] sm:h-[80vh] sm:rounded-3xl">
        {/* header */}
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-lime-300/10 to-transparent p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="flex items-center gap-1.5 text-sm font-black text-white">
                {targetBlockId ? <><Link2 size={14} className="text-cyan-300" /> Add to superset</> : <><Sparkles size={14} className="text-lime-300" /> Add an exercise</>}
              </h3>
              <p className="text-[11px] text-white/40">{filtered.length} of {EXERCISE_LIBRARY.length} exercises</p>
            </div>
            <button onClick={closePicker} className="rounded-xl border border-white/15 p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={14} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/30" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search push-ups, squats, curls…"
              className="w-full rounded-xl border border-white/12 bg-white/[0.05] py-2.5 pr-3 pl-9 text-sm text-white outline-none placeholder:text-white/25 focus:border-lime-300/60"
            />
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {MUSCLES.map((m) => (
                <button key={m} onClick={() => toggleMuscleFilter(m)}
                  className={cn("rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition",
                    muscleFilters.includes(m) ? "border-lime-300/60 bg-lime-300/15 text-lime-200" : "border-white/12 text-white/50 hover:text-white")}>
                  {m}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {MOVEMENT_TYPES.map((mt) => (
                <button key={mt} onClick={() => toggleMovementFilter(mt)}
                  className={cn("rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition",
                    movementFilters.includes(mt) ? "border-orange-300/60 bg-orange-300/15 text-orange-200" : "border-white/12 text-white/50 hover:text-white")}>
                  {mt}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT.map((eq) => (
                <button key={eq} onClick={() => toggleEquipmentFilter(eq)}
                  className={cn("rounded-full border px-2.5 py-1 text-[10.5px] font-bold transition",
                    equipmentFilters.includes(eq) ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-200" : "border-white/12 text-white/50 hover:text-white")}>
                  {eq}
                </button>
              ))}
              {hasFilters && (
                <button onClick={clearFilters} className="rounded-full border border-white/12 px-2.5 py-1 text-[10.5px] font-bold text-white/40 hover:text-white">
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {/* results */}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {filtered.length === 0 ? (
            <p className="mt-10 text-center text-sm text-white/30">No exercises match — try different filters.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filtered.map((ex) => (
                <button key={ex.id} onClick={() => addExercise(ex.id)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-lime-300/50 hover:bg-lime-300/[0.08]">
                  <span className="text-2xl leading-none">{ex.emoji}</span>
                  <span className="text-[12.5px] font-bold text-white">{ex.name}</span>
                  <span className="flex flex-wrap gap-1">
                    {ex.muscles?.slice(0, 2).map((m) => (
                      <span key={m} className="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] font-semibold text-white/45">{m}</span>
                    ))}
                  </span>
                  <span className="text-[9.5px] font-bold text-cyan-300/70">{ex.equipment}</span>
                  {ex.sequenceId && (
                    <span className="flex items-center gap-1 text-[9px] font-bold text-lime-300/70">
                      <Sparkles size={9} /> 3D preview available
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


