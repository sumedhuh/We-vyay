import { useEffect, useState } from "react";
import {
  X, Sparkles, Play, Save, Trash2, Plus, Copy, ArrowLeft, ArrowRight,
  SlidersHorizontal, Wind, FolderOpen, Repeat, FlipHorizontal2, RotateCcw,
  Layers, Clock, Gauge, Search, Check, Footprints, Zap,
} from "lucide-react";
import { usePushupStore, liveStats } from "./store";
import {
  CHANNEL_GROUPS, POSE_LIBRARY, SEQUENCES, FACE_SEQUENCES, facePosePresets, totalDuration,
  type Ease, type Pose, type PoseKey, type Keyframe,
} from "./pose";
import { GYM_SEQUENCES } from "./gymExercises";
import type { PresetId } from "./animations";
import { CycleMap } from "./BreathVisualizer";
import { cn } from "@/lib/utils";

const BODY_PRESETS: { id: PresetId; label: string }[] = [
  { id: "pushup", label: "Push-Up" },
  { id: "wide", label: "Wide Push-Up" },
  { id: "diamond", label: "Diamond" },
  { id: "pike", label: "Pike Press" },
  { id: "climbers", label: "Climbers" },
  { id: "plank", label: "Plank Hold" },
  { id: "crunch", label: "Crunch" },
  { id: "situp", label: "Sit-Up" },
  { id: "legraise", label: "Leg Raise" },
];

const EASES: { id: Ease; label: string }[] = [
  { id: "smooth", label: "Smooth" },
  { id: "linear", label: "Linear" },
  { id: "snap", label: "Snap" },
  { id: "bounce", label: "Bounce" },
];

function fmt(v: number, unit: string) {
  return unit === "m" ? v.toFixed(2) : `${Math.round(v)}°`;
}

/* ---------- slider row ---------- */
function ChannelSlider({ ch, value, onChange }: { ch: { key: PoseKey; label: string; min: number; max: number; step: number; unit: string; hint?: string }; value: number; onChange: (v: number) => void }) {
  const zero = ch.min < 0 && ch.max > 0;
  const pct = ((value - ch.min) / (ch.max - ch.min)) * 100;
  const zeroPct = zero ? ((0 - ch.min) / (ch.max - ch.min)) * 100 : 0;
  const isLeft = pct < zeroPct;
  return (
    <div className="group/sl">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="truncate text-[11px] font-semibold text-white/65">{ch.label}</span>
        <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-lime-300">{fmt(value, ch.unit)}</span>
      </div>
      <div className="relative h-5">
        <input
          type="range" min={ch.min} max={ch.max} step={ch.step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 z-10 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0a0c10] [&::-webkit-slider-thumb]:bg-lime-300 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(212,255,63,0.6)] [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#0a0c10] [&::-moz-range-thumb]:bg-lime-300"
          style={{ height: 20 }}
        />
        <div className="pointer-events-none absolute top-1/2 left-0 h-1.5 w-full -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <div className="absolute inset-y-0 bg-lime-300/80" style={isLeft ? { right: `${100 - zeroPct}%`, left: `${pct}%` } : { left: `${zeroPct}%`, right: `${100 - pct}%` }} />
        </div>
        {zero && <div className="pointer-events-none absolute top-0 h-full w-px bg-white/25" style={{ left: `${zeroPct}%` }} />}
      </div>
      {ch.hint && <p className="mt-0.5 text-[9px] leading-tight text-white/25">{ch.hint}</p>}
    </div>
  );
}

/* ---------- main studio ---------- */
export default function CustomStudio() {
  const open = usePushupStore((s) => s.studioOpen);
  const setOpen = usePushupStore((s) => s.setStudioOpen);
  const w = usePushupStore((s) => s.workout);
  const selectedKF = usePushupStore((s) => s.selectedKF);
  const setName = usePushupStore((s) => s.setName);
  const setWorkout = usePushupStore((s) => s.setWorkout);
  const setMode = usePushupStore((s) => s.setMode);
  const applyPreset = usePushupStore((s) => s.applyPreset);
  const presetId = usePushupStore((s) => s.presetId);
  const patchPose = usePushupStore((s) => s.patchPose);
  const patchSelected = usePushupStore((s) => s.patchSelected);
  const selectKF = usePushupStore((s) => s.selectKF);
  const addKF = usePushupStore((s) => s.addKF);
  const dupKF = usePushupStore((s) => s.dupKF);
  const delKF = usePushupStore((s) => s.delKF);
  const moveKF = usePushupStore((s) => s.moveKF);
  const stampPose = usePushupStore((s) => s.stampPose);
  const loadSequence = usePushupStore((s) => s.loadSequence);
  const mirrorKF = usePushupStore((s) => s.mirrorKF);
  const resetKF = usePushupStore((s) => s.resetKF);
  const setBreath = usePushupStore((s) => s.setBreath);
  const newWorkout = usePushupStore((s) => s.newWorkout);
  const saveWorkout = usePushupStore((s) => s.saveWorkout);
  const saved = usePushupStore((s) => s.savedWorkouts);
  const loadWorkout = usePushupStore((s) => s.loadWorkout);
  const deleteWorkout = usePushupStore((s) => s.deleteWorkout);
  const setUseCustom = usePushupStore((s) => s.setUseCustom);
  const setPlaying = usePushupStore((s) => s.setPlaying);

  const [tab, setTab] = useState<"pose" | "timeline" | "breath" | "library">("pose");
  const [group, setGroup] = useState(CHANNEL_GROUPS[0].id);
  const [q, setQ] = useState("");
  const [flash, setFlash] = useState("");

  const idx = Math.min(selectedKF, w.keyframes.length - 1);
  const k: Keyframe | undefined = w.keyframes[idx];
  const isFace = w.mode === "face";
  const activeGroups = isFace ? CHANNEL_GROUPS.filter((g) => g.id === "face") : CHANNEL_GROUPS.filter((g) => g.id !== "face");

  // sculpting needs the rig held still, so pause the moment a slider moves
  const sculpt = (patch: Partial<Pose>) => {
    if (usePushupStore.getState().playing) setPlaying(false);
    setUseCustom(true);
    patchPose(patch);
  };

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(""), 1400);
    return () => clearTimeout(t);
  }, [flash]);

  if (!open) return null;

  const activeGroup = activeGroups.find((g) => g.id === group) ?? activeGroups[0];
  const duration = totalDuration(w);
  const filtered = (isFace ? facePosePresets : POSE_LIBRARY).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const playNow = () => {
    setUseCustom(true);
    setPlaying(true);
    setFlash("Playing your workout");
  };

  return (
    <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-md sm:p-4">
      <div className="studio-font flex h-full max-h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-lime-300/20 bg-[#080b12]/95 shadow-[0_0_100px_rgba(212,255,63,0.12)] sm:h-[92vh]">
        {/* header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 bg-gradient-to-r from-lime-300/[0.13] via-cyan-300/[0.05] to-transparent px-4 py-3 sm:px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 to-cyan-300 shadow-[0_0_22px_rgba(212,255,63,0.45)]">
            <Sparkles size={19} className="text-black" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black tracking-tight text-white sm:text-lg">
              Motion<span className="text-lime-300">Lab</span>
            </h2>
            <p className="hidden truncate text-[11px] text-white/40 sm:block">Free-form pose studio — sculpt any pose, chain them into any movement</p>
          </div>
          <input
            value={w.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Workout name"
            className="hidden w-40 shrink-0 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-white/25 focus:border-lime-300/60 md:block"
          />
          <button onClick={() => setOpen(false)} className="shrink-0 rounded-xl border border-white/15 p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* workout mode */}
        <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-black/25 px-3 py-2 sm:px-4">
          <button
            onClick={() => setMode("body")}
            className={cn("rounded-xl px-3 py-2 text-[11px] font-bold transition", !isFace ? "bg-lime-300 text-black" : "bg-white/8 text-white/55 hover:text-white")}
          >
            🏋️ Body Studio
          </button>
          <button
            onClick={() => setMode("face")}
            className={cn("rounded-xl px-3 py-2 text-[11px] font-bold transition", isFace ? "bg-violet-500 text-white" : "bg-white/8 text-white/55 hover:text-white")}
          >
            😊 Face Studio
          </button>
          <p className="hidden text-[10px] text-white/35 sm:block">
            {isFace ? "Face yoga / facial mobility / guided massage overlays" : "Full-body pose chaining and exercise design"}
          </p>
        </div>

        {/* ---------- EXERCISE SELECTOR (moved from the bottom bar) ---------- */}
        {!isFace && (
          <div className="shrink-0 border-b border-white/10 bg-black/25 px-3 py-2 sm:px-4">
            <p className="mb-1.5 text-[9px] font-black tracking-[0.2em] text-white/35">CURRENT EXERCISE</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {BODY_PRESETS.map((p) => (
                <button key={p.id} onClick={() => applyPreset(p.id)}
                  className={cn("shrink-0 rounded-lg border px-3 py-1.5 text-[11px] font-bold transition",
                    presetId === p.id ? "border-cyan-300 bg-cyan-300 text-black" : "border-white/12 bg-white/[0.03] text-white/60 hover:text-white")}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* tabs */}
        <div className="flex shrink-0 gap-1 border-b border-white/10 bg-black/40 px-3 py-2 sm:px-4">
          {([
            { id: "pose", label: "Pose", icon: <SlidersHorizontal size={13} /> },
            { id: "timeline", label: "Timeline", icon: <Layers size={13} /> },
            { id: "breath", label: "Breath", icon: <Wind size={13} /> },
            { id: "library", label: "Saved", icon: <FolderOpen size={13} /> },
          ] as const).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[11px] font-bold tracking-wide transition sm:flex-none sm:px-4",
                tab === t.id ? "bg-lime-300 text-black shadow-[0_0_18px_rgba(212,255,63,0.35)]" : "text-white/45 hover:bg-white/8 hover:text-white")}>
              {t.icon}{t.label.toUpperCase()}
            </button>
          ))}
          <div className="ml-auto hidden items-center gap-3 text-[10px] font-bold tracking-widest text-white/35 sm:flex">
            <span className="flex items-center gap-1"><Layers size={11} />{w.keyframes.length} poses</span>
            <span className="flex items-center gap-1"><Clock size={11} />{duration.toFixed(1)}s</span>
          </div>
        </div>

        {/* body */}
        <div className="min-h-0 flex-1 overflow-hidden">
          {/* ---------- POSE ---------- */}
          {tab === "pose" && k && (
            <div className="flex h-full flex-col lg:flex-row">
              {/* group picker */}
              <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 p-2 lg:w-44 lg:flex-col lg:overflow-y-auto lg:border-r lg:border-b-0">
                {CHANNEL_GROUPS.map((g) => (
                  <button key={g.id} onClick={() => setGroup(g.id)}
                    className={cn("flex shrink-0 items-center gap-2 rounded-xl px-3 py-2.5 text-[11px] font-bold transition lg:w-full",
                      group === g.id ? "bg-lime-300/15 text-lime-200 ring-1 ring-lime-300/40" : "text-white/50 hover:bg-white/6 hover:text-white")}>
                    <span className="text-sm">{g.icon}</span>{g.label}
                  </button>
                ))}
                <div className="hidden lg:mt-2 lg:block lg:space-y-1.5 lg:border-t lg:border-white/10 lg:pt-3">
                  <button onClick={mirrorKF} className="flex w-full items-center gap-1.5 rounded-lg border border-white/12 px-2 py-2 text-[10px] font-bold text-white/60 transition hover:border-cyan-300/50 hover:text-cyan-200">
                    <FlipHorizontal2 size={12} /> Mirror L↔R
                  </button>
                  <button onClick={resetKF} className="flex w-full items-center gap-1.5 rounded-lg border border-white/12 px-2 py-2 text-[10px] font-bold text-white/60 transition hover:border-orange-300/50 hover:text-orange-200">
                    <RotateCcw size={12} /> Zero this pose
                  </button>
                </div>
              </div>

              {/* sliders */}
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black tracking-[0.2em] text-lime-300">{activeGroup.label.toUpperCase()}</p>
                    <p className="text-[10px] text-white/30">
                      {isFace
                        ? `Face close-up mode — pose ${idx + 1} of ${w.keyframes.length}, with guided massage lines`
                        : `Editing pose ${idx + 1} of ${w.keyframes.length} — he updates live behind this panel`}
                    </p>
                  </div>
                  <input
                    value={k.name}
                    onChange={(e) => patchSelected({ name: e.target.value })}
                    className="w-32 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-bold text-white outline-none focus:border-lime-300/60"
                  />
                </div>
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                  {activeGroup.channels.map((c) => (
                    <ChannelSlider key={c.key} ch={c} value={k.pose[c.key]} onChange={(v) => sculpt({ [c.key]: v } as Partial<Pose>)} />
                  ))}
                </div>
              </div>

              {/* stamp library */}
              <div className="hidden w-56 shrink-0 flex-col border-l border-white/10 lg:flex">
                <div className="border-b border-white/10 p-3">
                  <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-cyan-300">STAMP A POSE</p>
                  <div className="relative">
                    <Search size={12} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-white/30" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search poses…"
                      className="w-full rounded-lg border border-white/12 bg-white/[0.04] py-1.5 pr-2 pl-7 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-cyan-300/60" />
                  </div>
                </div>
                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
                  {filtered.map((p) => (
                    <button key={p.id} onClick={() => { stampPose(p.id); setFlash(`${p.name} stamped`); }}
                      className="flex w-full items-center gap-2 rounded-lg border border-white/8 bg-white/[0.02] px-2.5 py-2 text-left transition hover:border-cyan-300/50 hover:bg-cyan-300/10">
                      <span className="text-base">{p.emoji}</span>
                      <span className="truncate text-[11px] font-semibold text-white/80">{p.name}</span>
                    </button>
                  ))}
                  {filtered.length === 0 && <p className="p-3 text-center text-[10px] text-white/25">No pose matches that</p>}
                </div>
              </div>
            </div>
          )}

          {/* ---------- TIMELINE ---------- */}
          {tab === "timeline" && (
            <div className="flex h-full flex-col">
              {/* sequences */}
              <div className="shrink-0 border-b border-white/10 p-3 sm:px-4">
                <p className="mb-2 text-[10px] font-black tracking-[0.2em] text-lime-300">QUICK START — LOAD A READY SEQUENCE</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {(isFace ? FACE_SEQUENCES : [...SEQUENCES, ...GYM_SEQUENCES]).map((s) => (
                    <button key={s.id} onClick={() => { loadSequence(s.id); setFlash(`${s.name} loaded`); }}
                      className={cn("flex shrink-0 items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-[11px] font-bold text-white/75 transition",
                        isFace ? "hover:border-violet-400/60 hover:bg-violet-500/10 hover:text-violet-200" : "hover:border-lime-300/60 hover:bg-lime-300/10 hover:text-lime-200")}>
                      <span className="text-sm">{s.emoji}</span>{s.name}
                    </button>
                  ))}
                  <button onClick={() => { newWorkout(); setFlash("Blank workout"); }}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/12 px-3 py-2 text-[11px] font-bold text-white/50 transition hover:text-white">
                    <Plus size={13} /> Blank
                  </button>
                </div>
              </div>

              {/* keyframe strip */}
              <div className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[10px] font-black tracking-[0.2em] text-white/40">POSE SEQUENCE · {duration.toFixed(1)}s per loop</p>
                  <button onClick={() => addKF()} className="flex items-center gap-1 rounded-lg bg-lime-300 px-3 py-1.5 text-[10px] font-black tracking-wider text-black transition hover:bg-lime-200">
                    <Plus size={12} strokeWidth={3} /> ADD POSE
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {w.keyframes.map((kk, i) => {
                    const active = i === idx;
                    return (
                      <div key={kk.id}
                        className={cn("relative rounded-2xl border p-3 transition",
                          active ? "border-lime-300/60 bg-lime-300/[0.08] shadow-[0_0_20px_rgba(212,255,63,0.18)]" : "border-white/10 bg-white/[0.02] hover:border-white/25")}>
                        <div className="mb-2 flex items-center gap-2">
                          <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px] font-black",
                            active ? "bg-lime-300 text-black" : "bg-white/10 text-white/60")}>{i + 1}</span>
                          <input value={kk.name} onChange={(e) => patchSelected({ name: e.target.value })} onFocus={() => selectKF(i)}
                            className="min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1 py-0.5 text-xs font-bold text-white outline-none hover:border-white/15 focus:border-lime-300/50 focus:bg-black/40" />
                          {active && <span className="shrink-0 rounded-full bg-lime-300/20 px-2 py-0.5 text-[9px] font-black tracking-wider text-lime-200">EDITING</span>}
                        </div>
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          <label className="block">
                            <span className="mb-0.5 block text-[9px] font-bold tracking-wider text-white/40">MOVE IN</span>
                            <div className="flex items-center gap-1">
                              <input type="range" min={0.05} max={3} step={0.05} value={kk.dur} onFocus={() => selectKF(i)}
                                onChange={(e) => patchSelected({ dur: Number(e.target.value) })} className="w-full accent-cyan-300" />
                              <span className="w-8 shrink-0 font-mono text-[10px] font-bold text-cyan-300">{kk.dur.toFixed(2)}</span>
                            </div>
                          </label>
                          <label className="block">
                            <span className="mb-0.5 block text-[9px] font-bold tracking-wider text-white/40">HOLD</span>
                            <div className="flex items-center gap-1">
                              <input type="range" min={0} max={4} step={0.05} value={kk.hold} onFocus={() => selectKF(i)}
                                onChange={(e) => patchSelected({ hold: Number(e.target.value) })} className="w-full accent-lime-300" />
                              <span className="w-8 shrink-0 font-mono text-[10px] font-bold text-lime-300">{kk.hold.toFixed(2)}</span>
                            </div>
                          </label>
                        </div>
                        <div className="mb-2 grid grid-cols-2 gap-1.5">
                          {EASES.map((e) => (
                            <button key={e.id} onClick={() => { selectKF(i); patchSelected({ ease: e.id }); }}
                              className={cn("rounded-lg border px-1.5 py-1 text-[9px] font-bold transition",
                                kk.ease === e.id ? "border-lime-300/60 bg-lime-300/15 text-lime-200" : "border-white/10 text-white/45 hover:text-white")}>
                              {e.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => { selectKF(i); setTab("pose"); setPlaying(false); }} title="Edit this pose"
                            className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-black tracking-wider transition",
                              active ? "bg-lime-300 text-black" : "bg-white/8 text-white/70 hover:bg-white/15")}>
                            <SlidersHorizontal size={11} /> TUNE
                          </button>
                          <button onClick={() => moveKF(i, -1)} disabled={i === 0} title="Move earlier"
                            className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowLeft size={13} /></button>
                          <button onClick={() => moveKF(i, 1)} disabled={i === w.keyframes.length - 1} title="Move later"
                            className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white disabled:opacity-20"><ArrowRight size={13} /></button>
                          <button onClick={() => dupKF(i)} title="Duplicate" className="rounded-lg p-1.5 text-white/45 transition hover:bg-white/10 hover:text-white"><Copy size={13} /></button>
                          <button onClick={() => delKF(i)} disabled={w.keyframes.length <= 1} title="Delete"
                            className="rounded-lg p-1.5 text-white/40 transition hover:bg-red-500/20 hover:text-red-300 disabled:opacity-20"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* loop options */}
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-white/10 bg-black/30 p-3">
                <button onClick={() => setWorkout({ loop: !w.loop })}
                  className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider transition",
                    w.loop ? "border-lime-300/60 bg-lime-300/15 text-lime-200" : "border-white/12 text-white/50 hover:text-white")}>
                  <Repeat size={13} /> {w.loop ? "LOOPING" : "PLAY ONCE"}
                </button>
                <button onClick={() => setWorkout({ autoGround: !w.autoGround })}
                  className={cn("flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black tracking-wider transition",
                    w.autoGround ? "border-cyan-300/60 bg-cyan-300/15 text-cyan-200" : "border-white/12 text-white/50 hover:text-white")}>
                  <Footprints size={13} /> {w.autoGround ? "AUTO-FLOOR ON" : "AUTO-FLOOR OFF"}
                </button>
                <p className="text-[10px] text-white/30">
                  {w.loop ? "Loops forever, counting reps" : "Plays through once then stops"}
                  {w.autoGround ? " · body auto-adjusts so hands & feet rest on the floor" : " · use raw pose heights"}
                </p>
              </div>
            </div>
          )}

          {/* ---------- BREATH ---------- */}
          {tab === "breath" && (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-2xl">
                <div className="mb-4 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-cyan-300"><Wind size={12} /> BREATHING PATTERN</p>
                  <button onClick={() => setBreath({ enabled: !w.breath.enabled })}
                    className={cn("relative h-5 w-9 rounded-full transition-colors", w.breath.enabled ? "bg-cyan-300" : "bg-white/15")}>
                    <span className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: w.breath.enabled ? 18 : 2 }} />
                  </button>
                </div>
                {w.breath.enabled ? (
                  <>
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      <button onClick={() => setBreath({ inhaleStart: 0, inhaleEnd: 0.5 })}
                        className="rounded-xl border border-white/12 px-3 py-2.5 text-[10px] font-bold text-white/60 transition hover:border-cyan-300/50 hover:text-white">
                        Inhale on the way down<br /><span className="font-normal opacity-60">push-ups, squats</span>
                      </button>
                      <button onClick={() => setBreath({ inhaleStart: 0.5, inhaleEnd: 1 })}
                        className="rounded-xl border border-white/12 px-3 py-2.5 text-[10px] font-bold text-white/60 transition hover:border-cyan-300/50 hover:text-white">
                        Exhale on the effort<br /><span className="font-normal opacity-60">crunches, lifts</span>
                      </button>
                    </div>
                    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                      {([["inhaleStart", "Inhale starts", "#c6ff2e"], ["inhaleEnd", "Inhale ends", "#ff4d2e"]] as const).map(([key, label, color]) => (
                        <div key={key}>
                          <div className="mb-1.5 flex justify-between text-[11px] font-bold">
                            <span className="text-white/55">{label}</span>
                            <span style={{ color }}>{Math.round(w.breath[key] * 100)}% through the loop</span>
                          </div>
                          <input type="range" min={0} max={100} step={1} value={Math.round(w.breath[key] * 100)}
                            onChange={(e) => setBreath({ [key]: Number(e.target.value) / 100 })} className="w-full" style={{ accentColor: color }} />
                        </div>
                      ))}
                      <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                        <p className="mb-2 text-[10px] font-bold tracking-wider text-white/40">ONE FULL LOOP</p>
                        <CycleMap inhaleStart={w.breath.inhaleStart} inhaleEnd={w.breath.inhaleEnd} frac={liveStats.phaseFrac} />
                      </div>
                      <p className="text-[10px] leading-relaxed text-white/35">
                        The map spans your whole pose sequence — so with a 4-pose flow the inhale may cover several poses.
                        The floating coach orb follows it exactly.
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-xs text-white/40">
                    Breathing coach is off for this workout.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ---------- LIBRARY ---------- */}
          {tab === "library" && (
            <div className="h-full overflow-y-auto p-4 sm:p-6">
              <div className="mx-auto max-w-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-lime-300"><FolderOpen size={12} /> MY WORKOUTS ({saved.length})</p>
                  <button onClick={() => { saveWorkout(); setFlash("Saved to your library"); }}
                    className="flex items-center gap-1.5 rounded-xl border border-lime-300/50 bg-lime-300/10 px-3 py-2 text-[10px] font-black tracking-wider text-lime-200 transition hover:bg-lime-300/20">
                    <Save size={12} /> SAVE CURRENT
                  </button>
                </div>
                {saved.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-8 text-center">
                    <p className="mb-1 text-sm font-bold text-white/60">Nothing saved yet</p>
                    <p className="text-[11px] text-white/35">Build a sequence in the Timeline tab, then hit <span className="font-bold text-lime-300">Save current</span>.</p>
                  </div>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {saved.map((m) => (
                      <div key={m.id} className={cn("flex items-center gap-2 rounded-2xl border p-3", m.id === w.id ? "border-lime-300/50 bg-lime-300/[0.06]" : "border-white/10 bg-white/[0.02]")}>
                        <Zap size={15} className="shrink-0 text-lime-300/70" />
                        <button onClick={() => { loadWorkout(m.id); setFlash(`${m.name} loaded`); }} className="min-w-0 flex-1 text-left">
                          <span className="block truncate text-xs font-bold text-white">{m.name}</span>
                          <span className="block text-[10px] text-white/35">{m.keyframes.length} poses · {totalDuration(m).toFixed(1)}s</span>
                        </button>
                        <button onClick={() => { loadWorkout(m.id); setPlaying(true); }} title="Play"
                          className="rounded-lg bg-lime-300/15 p-2 text-lime-200 transition hover:bg-lime-300 hover:text-black"><Play size={13} /></button>
                        <button onClick={() => deleteWorkout(m.id)} title="Delete"
                          className="rounded-lg p-2 text-white/35 transition hover:bg-red-500/20 hover:text-red-300"><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex shrink-0 items-center gap-2 border-t border-white/10 bg-black/50 px-4 py-3">
          <div className="hidden flex-1 items-center gap-2 sm:flex">
            <Gauge size={13} className="text-white/30" />
            <span className="text-[10px] font-bold tracking-wider text-white/35">
              {w.keyframes.length} POSES · {duration.toFixed(1)}S LOOP · {w.loop ? "∞" : "once"}
            </span>
          </div>
          <button onClick={() => { saveWorkout(); setFlash("Saved!"); }}
            className={cn("flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-[11px] font-black tracking-wider transition",
              flash === "Saved!" ? "border-lime-300 bg-lime-300 text-black" : "border-white/18 text-white/75 hover:border-lime-300/60 hover:text-lime-200")}>
            {flash === "Saved!" ? <Check size={13} strokeWidth={3} /> : <Save size={13} />} SAVE
          </button>
          <button onClick={playNow}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-lime-300 to-cyan-300 px-5 py-2.5 text-[11px] font-black tracking-wider text-black shadow-[0_0_28px_rgba(212,255,63,0.4)] transition hover:brightness-110 sm:flex-none">
            <Play size={14} strokeWidth={3} /> PLAY MY WORKOUT
          </button>
          <button onClick={() => setOpen(false)} className="rounded-xl border border-white/18 px-4 py-2.5 text-[11px] font-black tracking-wider text-white/70 transition hover:text-white">
            DONE
          </button>
        </div>

        {/* flash toast */}
        {flash && (
          <div className="pointer-events-none absolute bottom-20 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-lime-300/40 bg-black/90 px-4 py-2 text-[11px] font-bold text-lime-200 shadow-2xl">
            <Check size={13} strokeWidth={3} /> {flash}
          </div>
        )}
      </div>
    </div>
  );
}


