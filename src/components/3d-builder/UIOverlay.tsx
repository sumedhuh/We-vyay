import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, RotateCcw, Orbit, Video, Move3d, MousePointer2,
  PersonStanding, ArrowLeftRight, ArrowDownToLine, ChevronsUp,
  Zap, Grid3x3, Spline, Ruler, Turtle, Dumbbell, Eye, X, Activity,
  Hexagon, Triangle, Footprints, Minus, Heart, ArrowUpFromLine, Repeat,
  MoveHorizontal, SlidersHorizontal, Clapperboard, Palette, Flame,
  Sparkles, Wind, Pencil, ChevronUp, Check, ClipboardList,
  Star, Settings, Trees, Film, ChevronLeft, ChevronRight,
  Upload,
} from "lucide-react";
import { usePushupStore, liveStats, SKIN_TONES, SHIRT_COLORS, SHORTS_COLORS, ACHIEVEMENTS, xpForLevel, type CameraPreset } from "./store";
import { PRESETS, type PresetId, type AnimConfig, type RigBase } from "./animations";
import { useBuilderStore } from "./store";
import { useSceneStore } from "./scene/store";
import SceneStudio from "./SceneStudio";
import SceneEditor from "./SceneEditor";
import ColorThemePanel from "./ColorThemePanel";
import CustomStudio from "./CustomStudio";
import BreathVisualizer from "./BreathVisualizer";
import WorkoutBuilder from "./builder/WorkoutBuilder";
import { cn } from "@/lib/utils";
import { usePublishedAnimationsStore } from "@/stores/published-animations-store";

/* ============ palette (single source of truth for this file) ============ */
const LIME = "#22D8FF";
const VIOLET = "#8B5CF6";
const VIOLET_LT = "#A78BFA";
const AMBER = "#FFB547";
const INK = "#0a1114";

const CAMERAS: { id: CameraPreset; label: string; key: string; icon: React.ReactNode }[] = [
  { id: "hero", label: "Isometric", key: "1", icon: <Clapperboard size={15} /> },
  { id: "top", label: "High Iso", key: "2", icon: <ArrowDownToLine size={15} /> },
  { id: "low", label: "Low Iso", key: "3", icon: <Video size={15} /> },
  { id: "side", label: "Side", key: "4", icon: <ArrowLeftRight size={15} /> },
  { id: "front", label: "Front", key: "5", icon: <PersonStanding size={15} /> },
  { id: "close", label: "Close", key: "6", icon: <Eye size={15} /> },
  { id: "back", label: "Behind", key: "7", icon: <ChevronsUp size={15} /> },
];

const PRESET_LIST: { id: PresetId; icon: React.ReactNode }[] = [
  { id: "pushup", icon: <Dumbbell size={14} /> },
  { id: "wide", icon: <MoveHorizontal size={14} /> },
  { id: "diamond", icon: <Hexagon size={14} /> },
  { id: "pike", icon: <Triangle size={14} /> },
  { id: "climbers", icon: <Footprints size={14} /> },
  { id: "plank", icon: <Minus size={14} /> },
  { id: "crunch", icon: <Heart size={14} /> },
  { id: "situp", icon: <ArrowUpFromLine size={14} /> },
  { id: "legraise", icon: <ChevronsUp size={14} /> },
  { id: "flutter", icon: <Repeat size={14} /> },
];

function useLiveStats() {
  const [s, setS] = useState({ effort: 0, joint: 170, jointLabel: "ELBOW", phase: "top", frac: 0, mode: "plank", curl: 0, legRaise: 0, kneeDrive: 0, depth: 0, height: 0.6, kfIndex: 0, kfTotal: 1 });
  useEffect(() => {
    let raf = 0;
    let n = 0;
    const loop = () => {
      n++;
      if (n % 2 === 0) {
        setS({
          effort: liveStats.effort, joint: liveStats.jointAngle, jointLabel: liveStats.jointLabel,
          phase: liveStats.phase, frac: liveStats.phaseFrac, mode: liveStats.mode,
          curl: liveStats.curl, legRaise: liveStats.legRaise, kneeDrive: liveStats.kneeDrive,
          depth: liveStats.plankDepth, height: liveStats.shoulderHeight,
          kfIndex: liveStats.kfIndex, kfTotal: liveStats.kfTotal,
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return s;
}

/* ---------------- shared atoms ---------------- */

function Toggle({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-xs font-medium transition-all",
        active ? "border-[#22D8FF]/40 bg-[#22D8FF]/10 text-[#F5F7F2]" : "border-white/10 bg-white/[0.03] text-white/55 hover:bg-white/[0.07] hover:text-white"
      )}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      <span className={cn("relative rounded-full transition-colors", active ? "bg-[#22D8FF]" : "bg-white/15")} style={{ height: 18, width: 32 }}>
        <span className="absolute top-[2px] h-[14px] w-[14px] rounded-full shadow transition-all" style={{ left: active ? 16 : 2, background: active ? INK : "#fff" }} />
      </span>
    </button>
  );
}

function Slider({ label, value, min, max, step, onChange, format, accent = LIME }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; format?: (v: number) => string; accent?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] font-bold">
        <span className="text-white/50">{label}</span>
        <span style={{ color: accent }}>{format ? format(value) : value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" style={{ accentColor: accent }} />
    </div>
  );
}

function SectionTitle({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#929A91]">{icon}{children}</p>;
}

function PopMenu({ open, onClose, children, width = 224, align = "center" }: { open: boolean; onClose: () => void; children: React.ReactNode; width?: number; align?: "center" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);
  if (!open) return null;
  const centered = align === "center";
  return (
    <div
      ref={ref}
      className={cn(
        "absolute bottom-full z-40 mb-3 rounded-2xl border border-white/10 bg-[#191D1A]/95 p-2 shadow-[0_18px_60px_rgba(0,0,0,0.6)] backdrop-blur-2xl",
        centered ? "left-1/2 -translate-x-1/2" : "right-0"
      )}
      style={{ width }}
    >
      {children}
      <span className={cn("absolute -bottom-[7px] h-3.5 w-3.5 rotate-45 border-r border-b border-white/10 bg-[#191D1A]", centered ? "left-1/2 -translate-x-1/2" : "right-6")} />
    </div>
  );
}

/* ---------------- GAMIFICATION ---------------- */

function XpCluster() {
  const xp = usePushupStore((s: any) => s.xp);
  const level = usePushupStore((s: any) => s.level);
  const streak = usePushupStore((s: any) => s.streak);
  const need = xpForLevel(level);
  const base = (level - 1) * 500;
  const pct = Math.min(100, Math.round(((xp - base) / need) * 100));
  return (
    <div className="hidden items-center gap-3 md:flex">
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-1.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-black" style={{ background: LIME, color: INK }}>
          {level}
        </span>
        <div className="w-28">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-bold tracking-widest text-[#929A91]">LEVEL</span>
            <span className="font-mono text-[10px] font-bold text-white tabular-nums">{xp - base}/{need} XP</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="bar-shine h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: LIME }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 rounded-xl border px-2.5 py-2" style={{ borderColor: `${AMBER}55`, background: `${AMBER}14` }}>
        <Flame size={15} style={{ color: AMBER }} />
        <span className="text-sm font-black text-white tabular-nums">{streak}</span>
        <span className="text-[9px] font-bold tracking-widest text-white/50">DAY STREAK</span>
      </div>
    </div>
  );
}

/** Floating rep / combo / level-up / achievement feedback over the scene. */
function GameFeedback() {
  const lastGain = usePushupStore((s: any) => s.lastGain);
  const levelUpFlash = usePushupStore((s: any) => s.levelUpFlash);
  const newAchievement = usePushupStore((s: any) => s.newAchievement);
  const dismissLevelUp = usePushupStore((s: any) => s.dismissLevelUp);
  const dismissAchievement = usePushupStore((s: any) => s.dismissAchievement);
  const [floaters, setFloaters] = useState<{ key: number; xp: number; combo: number }[]>([]);
  const [showCombo, setShowCombo] = useState(false);

  useEffect(() => {
    if (!lastGain) return;
    setFloaters((f) => [...f.slice(-3), lastGain]);
    const t = setTimeout(() => setFloaters((f) => f.filter((x) => x.key !== lastGain.key)), 1050);
    if (lastGain.combo >= 2) {
      setShowCombo(true);
      const c = setTimeout(() => setShowCombo(false), 1100);
      return () => { clearTimeout(t); clearTimeout(c); };
    }
    return () => clearTimeout(t);
  }, [lastGain]);

  useEffect(() => {
    if (!levelUpFlash) return;
    const t = setTimeout(dismissLevelUp, 2600);
    return () => clearTimeout(t);
  }, [levelUpFlash, dismissLevelUp]);

  useEffect(() => {
    if (!newAchievement) return;
    const t = setTimeout(dismissAchievement, 3200);
    return () => clearTimeout(t);
  }, [newAchievement, dismissAchievement]);

  const ach = newAchievement ? ACHIEVEMENTS.find((a) => a.id === newAchievement.id) : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute top-[38%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-1">
        {floaters.map((f) => (
          <div key={f.key} className="anim-xp-pop font-mono text-lg font-black tabular-nums" style={{ color: LIME, textShadow: `0 0 18px ${LIME}` }}>
            +{f.xp} XP
          </div>
        ))}
        {showCombo && lastGain && lastGain.combo >= 2 && (
          <div key={`c${lastGain.key}`} className="anim-combo-pop rounded-xl border border-white/15 bg-black/70 px-3 py-1.5 backdrop-blur-md">
            <span className="text-sm font-black tracking-widest text-white">COMBO </span>
            <span className="font-mono text-base font-black" style={{ color: AMBER }}>×{lastGain.combo}</span>
          </div>
        )}
      </div>

      {levelUpFlash && (
        <button onClick={dismissLevelUp} className="anim-level-up pointer-events-auto absolute top-[16%] left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl border bg-black/80 px-5 py-3 backdrop-blur-xl" style={{ borderColor: `${LIME}66`, boxShadow: `0 0 40px ${LIME}33` }}>
          <Star size={26} style={{ color: AMBER }} />
          <div className="text-left">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/60">LEVEL UP</p>
            <p className="text-xl font-black text-white">LEVEL {String(levelUpFlash.level).padStart(2, "0")}</p>
          </div>
        </button>
      )}

      {ach && (
        <button onClick={dismissAchievement} className="anim-toast-in pointer-events-auto absolute top-[16%] right-4 flex items-center gap-3 rounded-2xl border bg-black/80 px-4 py-3 backdrop-blur-xl" style={{ borderColor: `${AMBER}55` }}>
          <span className="text-2xl">{ach.icon}</span>
          <div className="text-left">
            <p className="text-[9px] font-bold tracking-[0.2em]" style={{ color: AMBER }}>ACHIEVEMENT UNLOCKED</p>
            <p className="text-sm font-black text-white">{ach.name}</p>
          </div>
        </button>
      )}
    </div>
  );
}

/* ---------------- MOTION LAB ---------------- */

function MotionTab() {
  const presetId = usePushupStore((s: any) => s.presetId);
  const applyPreset = usePushupStore((s: any) => s.applyPreset);
  const anim = usePushupStore((s: any) => s.anim);
  const setAnim = usePushupStore((s: any) => s.setAnim);
  const setBase = usePushupStore((s: any) => s.setBase);
  const useCustom = usePushupStore((s: any) => s.useCustom);
  const workout = usePushupStore((s: any) => s.workout);
  const setUseCustom = usePushupStore((s: any) => s.setUseCustom);
  const setStudioOpen = usePushupStore((s: any) => s.setStudioOpen);
  const base: RigBase = anim.base;
  const set = (patch: Partial<AnimConfig>) => setAnim(patch);
  const poseCount = workout.keyframes.length;

  return (
    <div className="space-y-4">
      {useCustom ? (
        <div className="rounded-2xl border p-3" style={{ borderColor: `${VIOLET}66`, background: `linear-gradient(135deg, ${VIOLET}26, transparent)` }}>
          <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em]" style={{ color: VIOLET_LT }}>
            <Sparkles size={12} /> CUSTOM MOVE PLAYING
          </p>
          <p className="mt-1 truncate text-sm font-bold text-white">“{workout.name}”</p>
          <p className="text-[10px] text-white/45">{poseCount} poses choreographed · {workout.loop ? "loops ∞" : "plays once"}</p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <button onClick={() => setStudioOpen(true)} className="flex items-center justify-center gap-1 rounded-xl px-2 py-2 text-[10px] font-bold tracking-wider text-white transition hover:brightness-110" style={{ background: VIOLET }}>
              <Pencil size={11} /> EDIT
            </button>
            <button onClick={() => setUseCustom(false)} className="rounded-xl border border-white/20 px-2 py-2 text-[10px] font-bold tracking-wider text-white/70 transition hover:border-white/50 hover:text-white">
              EXIT
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setStudioOpen(true)}
          className="group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all hover:border-[#8B5CF6]"
          style={{ borderColor: `${VIOLET}55`, background: `linear-gradient(135deg, ${VIOLET}22, transparent)` }}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-transform group-hover:scale-105" style={{ background: VIOLET }}>
            <Sparkles size={18} strokeWidth={2.4} />
          </span>
          <span>
            <span className="block text-xs font-bold tracking-wide text-white">+ CUSTOM ANIMATION</span>
            <span className="block text-[10px] text-white/45">Pick joints, set movement, generate</span>
          </span>
        </button>
      )}
      <div>
        <SectionTitle icon={<SlidersHorizontal size={12} />}>PRESET WORKOUTS</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_LIST.map((p) => (
            <button key={p.id} onClick={() => applyPreset(p.id)}
              className={cn("flex items-center gap-1.5 rounded-xl border px-2 py-2 text-[10px] font-bold transition-all",
                presetId === p.id ? "text-black" : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white")}
              style={presetId === p.id ? { background: LIME, borderColor: LIME } : undefined}>
              {p.icon}<span className="truncate">{PRESETS[p.id].name}</span>
            </button>
          ))}
        </div>
        {presetId === "custom" && <p className="mt-1.5 text-center text-[10px] font-bold tracking-widest" style={{ color: VIOLET_LT }}>★ CUSTOM MOTION</p>}
      </div>

      <div>
        <SectionTitle icon={<PersonStanding size={12} />}>BODY POSITION</SectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setBase("plank")}
            className={cn("rounded-xl border px-2 py-2.5 text-[10px] font-bold transition", base === "plank" ? "text-black" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white")}
            style={base === "plank" ? { background: LIME, borderColor: LIME } : undefined}>
            🤸 Hands down
          </button>
          <button onClick={() => setBase("supine")}
            className={cn("rounded-xl border px-2 py-2.5 text-[10px] font-bold transition", base === "supine" ? "text-black" : "border-white/10 bg-white/[0.03] text-white/55 hover:text-white")}
            style={base === "supine" ? { background: LIME, borderColor: LIME } : undefined}>
            🛌 Lying back
          </button>
        </div>
      </div>

      {base === "plank" ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-bold tracking-[0.16em] text-white/35">MOTION PATH — KEYFRAME A → B</p>
          <Slider label="Depth · start (A)" value={anim.fromDepth} min={0} max={1} step={0.01} onChange={(v) => set({ fromDepth: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Depth · end (B)" value={anim.toDepth} min={0} max={1} step={0.01} onChange={(v) => set({ toDepth: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Hip pike" value={anim.pike} min={0} max={0.8} step={0.01} onChange={(v) => set({ pike: v })} accent={VIOLET_LT} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Hand width" value={anim.handSpread} min={0.4} max={1.8} step={0.02} onChange={(v) => set({ handSpread: v })} format={(v) => `${v.toFixed(2)}×`} />
          <Slider label="Knee drive" value={anim.kneeDrive} min={0} max={1} step={0.01} onChange={(v) => set({ kneeDrive: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <p className="text-[9px] leading-relaxed text-white/35">
            A = top of the rep, B = bottom. Equal A & B = static hold. Knee drive alternates legs each rep (mountain climbers).
          </p>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-[10px] font-bold tracking-[0.16em] text-white/35">MOTION PATH — KEYFRAME A → B</p>
          <Slider label="Torso curl · A" value={anim.fromCurl} min={0} max={1.4} step={0.01} onChange={(v) => set({ fromCurl: v })} format={(v) => `${Math.round((v / 1.4) * 100)}%`} />
          <Slider label="Torso curl · B" value={anim.toCurl} min={0} max={1.4} step={0.01} onChange={(v) => set({ toCurl: v })} format={(v) => `${Math.round((v / 1.4) * 100)}%`} />
          <Slider label="Leg raise · A" value={anim.fromLegRaise} min={0} max={1} step={0.01} onChange={(v) => set({ fromLegRaise: v })} accent={VIOLET_LT} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Leg raise · B" value={anim.toLegRaise} min={0} max={1} step={0.01} onChange={(v) => set({ toLegRaise: v })} accent={VIOLET_LT} format={(v) => `${Math.round(v * 100)}%`} />
          <Slider label="Knee bend (rest)" value={anim.kneeBend} min={0} max={1} step={0.01} onChange={(v) => set({ kneeBend: v })} format={(v) => `${Math.round(v * 100)}%`} />
          <div>
            <p className="mb-1 text-[10px] font-bold text-white/50">Arm position</p>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => set({ arms: "head" })} className={cn("rounded-lg border px-2 py-1.5 text-[10px] font-bold", anim.arms === "head" ? "text-black" : "border-white/10 bg-white/[0.03] text-white/55")} style={anim.arms === "head" ? { background: LIME, borderColor: LIME } : undefined}>Behind head</button>
              <button onClick={() => set({ arms: "chest" })} className={cn("rounded-lg border px-2 py-1.5 text-[10px] font-bold", anim.arms === "chest" ? "text-black" : "border-white/10 bg-white/[0.03] text-white/55")} style={anim.arms === "chest" ? { background: LIME, borderColor: LIME } : undefined}>Across chest</button>
            </div>
          </div>
          <p className="text-[9px] leading-relaxed text-white/35">
            Curl lifts the shoulders off the floor; leg raise swings the legs up. Combine both for combo core moves.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------------- FORM PANEL ---------------- */

function FormPanel() {
  const live = useLiveStats();
  const setShowAnalysis = usePushupStore((s: any) => s.setShowAnalysis);
  const useCustom = usePushupStore((s: any) => s.useCustom);
  const kfName = usePushupStore((s: any) => s.workout.keyframes[Math.min(s.selectedKF, s.workout.keyframes.length - 1)]?.name ?? "");
  const isPlank = live.mode === "plank";

  const phaseMeta = isPlank
    ? live.phase === "top" ? { label: "Top — lockout", color: LIME, bg: "rgba(34,216,255,0.10)" }
    : live.phase === "bottom" ? { label: "Bottom — chest down", color: AMBER, bg: "rgba(255,181,71,0.12)" }
    : live.phase === "lower" ? { label: "Lowering", color: VIOLET_LT, bg: "rgba(139,92,246,0.12)" }
    : { label: "Pushing up", color: LIME, bg: "rgba(34,216,255,0.10)" }
    : live.phase === "rest" ? { label: "Rest — spine flat", color: VIOLET_LT, bg: "rgba(139,92,246,0.12)" }
    : live.phase === "peak" ? { label: "Peak contraction", color: AMBER, bg: "rgba(255,181,71,0.12)" }
    : live.phase === "crunch" ? { label: "Curling up", color: LIME, bg: "rgba(34,216,255,0.10)" }
    : { label: "Unrolling", color: VIOLET_LT, bg: "rgba(139,92,246,0.12)" };

  const muscles = isPlank
    ? [
      { name: "Chest", v: Math.round(25 + live.depth * 75), c: LIME },
      { name: "Triceps", v: Math.round(20 + live.depth * 70 + (live.phase === "push" ? 10 : 0)), c: VIOLET_LT },
      { name: "Shoulders", v: Math.round(30 + live.depth * 55), c: AMBER },
      { name: "Core", v: Math.round(62 + live.depth * 18), c: "#F5F7F2" },
    ]
    : [
      { name: "Abs", v: Math.round(18 + live.curl * 82), c: LIME },
      { name: "Hip flexors", v: Math.round(15 + live.legRaise * 80), c: VIOLET_LT },
      { name: "Obliques", v: Math.round(20 + live.curl * 55), c: AMBER },
      { name: "Thighs", v: Math.round(25 + live.legRaise * 45), c: "#F5F7F2" },
    ];

  return (
    <aside className="pointer-events-auto relative hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto rounded-2xl border border-white/10 bg-[#191D1A]/85 p-4 backdrop-blur-xl md:flex" style={{ maxHeight: "calc(100vh - 330px)", minHeight: 0 }}>
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[#929A91]"><Activity size={12} /> FORM</p>
        <button onClick={() => setShowAnalysis(false)} title="Hide panel" className="rounded-lg p-1 text-white/40 transition hover:bg-white/10 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="rounded-xl border p-3 text-center" style={{ background: phaseMeta.bg, borderColor: `${phaseMeta.color}44` }}>
        {useCustom ? (
          <>
            <p className="truncate text-[13px] font-bold tracking-wider" style={{ color: phaseMeta.color }}>
              {live.phase || kfName}
            </p>
            <p className="mt-0.5 text-[11px] text-white/45">
              pose {(live.kfIndex ?? 0) + 1}/{live.kfTotal} · {Math.round(live.effort * 100)}% load
            </p>
          </>
        ) : (
          <>
            <p className="text-[13px] font-bold tracking-widest" style={{ color: phaseMeta.color }}>{phaseMeta.label}</p>
            <p className="mt-0.5 text-[11px] text-white/45">{Math.round(live.effort * 100)}% contraction</p>
          </>
        )}
      </div>

      {isPlank ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
            <span className="text-white/50">CHEST DEPTH</span>
            <span style={{ color: LIME }}>{live.height.toFixed(2)}m</span>
          </div>
          <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full" style={{ width: `${live.depth * 100}%`, background: `linear-gradient(90deg, ${VIOLET}, ${AMBER})` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[9px] font-bold text-white/30"><span>LOCKOUT</span><span>CHEST TO FLOOR</span></div>
          {live.kneeDrive > 0.05 && (
            <div className="mt-2.5">
              <div className="mb-1 flex justify-between text-[10px] font-bold"><span style={{ color: AMBER }}>KNEE DRIVE</span><span style={{ color: AMBER }}>{Math.round(live.kneeDrive * 100)}%</span></div>
              <div className="h-1.5 rounded-full bg-white/10"><div className="h-full rounded-full" style={{ width: `${live.kneeDrive * 100}%`, background: AMBER }} /></div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-white/50">TORSO CURL</span>
              <span style={{ color: LIME }}>{Math.round((live.curl / 1.4) * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${Math.min(100, (live.curl / 1.4) * 100)}%`, background: LIME }} />
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-white/50">LEG RAISE</span>
              <span style={{ color: VIOLET_LT }}>{Math.round(live.legRaise * 100)}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${live.legRaise * 100}%`, background: VIOLET }} />
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold">
          <span className="text-white/50">{live.jointLabel} ANGLE</span>
          <span style={Math.round(live.joint) < (isPlank ? 100 : 120) ? { color: LIME } : { color: "#fff" }}>{Math.round(live.joint)}°</span>
        </div>
        <div className="relative h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, (180 - live.joint) / 1.2))}%`, background: VIOLET }} />
        </div>
        <p className="mt-1.5 text-[10px] text-white/35">
          {isPlank ? (Math.round(live.joint) < 100 ? "✓ Good depth — elbows flexed" : "Extend at top, bend going down") : Math.round(live.joint) < 120 ? "✓ Knees tracking the load" : "Bend knees or lift legs"}
        </p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-white/50"><Zap size={11} style={{ color: LIME }} /> MUSCLE ACTIVATION</p>
        <div className="space-y-2">
          {muscles.map((m) => (
            <div key={m.name}>
              <div className="mb-1 flex justify-between text-[10px] font-bold"><span className="text-white/55">{m.name}</span><span style={{ color: m.c }}>{m.v}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full" style={{ width: `${m.v}%`, background: m.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

/* ---------------- MAIN OVERLAY ---------------- */

export default function UIOverlay() {
  return <OverlayInner />;
}

function OverlayInner() {
  const playing = usePushupStore((s: any) => s.playing);
  const togglePlaying = usePushupStore((s: any) => s.togglePlaying);
  const speed = usePushupStore((s: any) => s.speed);
  const setSpeed = usePushupStore((s: any) => s.setSpeed);
  const reps = usePushupStore((s: any) => s.reps);
  const resetReps = usePushupStore((s: any) => s.resetReps);
  const autoRotate = usePushupStore((s: any) => s.autoRotate);
  const setAutoRotate = usePushupStore((s: any) => s.setAutoRotate);
  const cameraPreset = usePushupStore((s: any) => s.cameraPreset);
  const setCameraPreset = usePushupStore((s: any) => s.setCameraPreset);
  const skinTone = usePushupStore((s: any) => s.skinTone);
  const setSkinTone = usePushupStore((s: any) => s.setSkinTone);
  const shirtColor = usePushupStore((s: any) => s.shirtColor);
  const setShirtColor = usePushupStore((s: any) => s.setShirtColor);
  const shortsColor = usePushupStore((s: any) => s.shortsColor);
  const setShortsColor = usePushupStore((s: any) => s.setShortsColor);
  const showGrid = usePushupStore((s: any) => s.showGrid);
  const setShowGrid = usePushupStore((s: any) => s.setShowGrid);
  const showTrail = usePushupStore((s: any) => s.showTrail);
  const setShowTrail = usePushupStore((s: any) => s.setShowTrail);
  const showAngles = usePushupStore((s: any) => s.showAngles);
  const setShowAngles = usePushupStore((s: any) => s.setShowAngles);
  const showAnalysis = usePushupStore((s: any) => s.showAnalysis);
  const setShowAnalysis = usePushupStore((s: any) => s.setShowAnalysis);
  const slowMo = usePushupStore((s: any) => s.slowMo);
  const setSlowMo = usePushupStore((s: any) => s.setSlowMo);
  const presetId = usePushupStore((s: any) => s.presetId);
  const useCustom = usePushupStore((s: any) => s.useCustom);
  const customName = usePushupStore((s: any) => s.workout.name);
  const setStudioOpen = usePushupStore((s: any) => s.setStudioOpen);
  const showBreath = usePushupStore((s: any) => s.showBreath);
  const setShowBreath = usePushupStore((s: any) => s.setShowBreath);
  const sceneCount = useSceneStore((s: any) => s.placements.length);
  const editorOpen = useSceneStore((s: any) => s.editorOpen);
  const autoFit = useSceneStore((s: any) => s.autoFit);
  const setAutoFit = useSceneStore((s: any) => s.setAutoFit);
  const colorPanelOpen = usePushupStore((s: any) => s.colorPanelOpen);
  const setColorPanelOpen = usePushupStore((s: any) => s.setColorPanelOpen);
  const togglePlaying2 = usePushupStore((s: any) => s.togglePlaying);
  const publishAnimation = usePublishedAnimationsStore((s) => s.publishAnimation);
  const [publishFeedback, setPublishFeedback] = useState<string | null>(null);

  const live = useLiveStats();
  const [showHint, setShowHint] = useState(true);
  const [tab, setTab] = useState<"motion" | "scene" | "style">("motion");
  const [menu, setMenu] = useState<"none" | "motion">("none");
  const toggleMenu = (m: "motion") => setMenu((cur) => (cur === m ? "none" : m));

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 6000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT")) return;
      if (e.code === "Space") { e.preventDefault(); togglePlaying2(); }
      else if (e.key === "r" || e.key === "R") resetReps();
      else if (e.key >= "1" && e.key <= "7") {
        const cam = CAMERAS[Number(e.key) - 1];
        if (cam) setCameraPreset(cam.id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlaying2, resetReps, setCameraPreset]);

  const tabBtn = (id: typeof tab, label: string, icon: React.ReactNode) => (
    <button onClick={() => setTab(id)}
      className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold tracking-wider transition",
        tab === id ? "text-black" : "text-white/50 hover:bg-white/10 hover:text-white")}
      style={tab === id ? { background: LIME } : undefined}>
      {icon}{label}
    </button>
  );

  const activeName = useCustom ? customName : presetId !== "custom" ? PRESETS[presetId as PresetId]?.name : "Custom";
  const hudIsPlank = live.mode === "plank";
  const hudPhase = hudIsPlank
    ? live.phase === "top" ? { label: "Top — lockout", color: LIME }
    : live.phase === "bottom" ? { label: "Bottom — chest down", color: AMBER }
    : live.phase === "lower" ? { label: "Lowering", color: VIOLET_LT }
    : { label: "Pushing up", color: LIME }
    : live.phase === "rest" ? { label: "Rest — spine flat", color: VIOLET_LT }
    : live.phase === "peak" ? { label: "Peak contraction", color: AMBER }
    : live.phase === "crunch" ? { label: "Curling up", color: LIME }
    : { label: "Unrolling", color: VIOLET_LT };

  if (editorOpen) return <SceneEditor />;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between font-sans">
      {/* ---------- TOP NAV ---------- */}
      <header className="pointer-events-auto flex items-center justify-between gap-3 border-b border-white/10 bg-[#111411]/80 px-4 py-2.5 backdrop-blur-2xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: LIME }}>
            <Dumbbell size={18} strokeWidth={2.6} style={{ color: INK }} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[13px] font-black tracking-[0.14em] text-[#F5F7F2]">
              MOTION<span style={{ color: LIME }}>LAB</span>
            </h1>
            <p className="truncate text-[10px] font-semibold text-[#929A91]">
              {useCustom ? `✨ ${activeName}` : activeName} · rep {reps + 1}
            </p>
          </div>
        </div>

        <XpCluster />

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] font-semibold text-white/50 xl:flex">
            <MousePointer2 size={12} /> Drag to orbit · <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-bold text-white/80">Space</kbd> play
          </div>
          <button
            onClick={() => setStudioOpen(true)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-bold tracking-wide text-white transition hover:brightness-110 sm:px-4"
            style={{ background: VIOLET }}
          >
            <Sparkles size={13} /> <span className="hidden sm:inline">STUDIO</span>
          </button>
          <button
            onClick={() => {
              const exerciseName = (useCustom ? customName : presetId !== "custom" ? PRESETS[presetId as PresetId]?.name : "Custom Exercise") || "Custom Exercise";
              publishAnimation({
                exerciseName: exerciseName.toLowerCase().trim(),
                displayName: exerciseName,
                sceneConfig: {
                  presetId: presetId ?? "custom",
                  skinTone,
                  shirtColor,
                  shortsColor,
                  cameraPreset,
                  speed,
                  autoRotate,
                },
                author: "You",
              });
              setPublishFeedback(exerciseName);
              setTimeout(() => setPublishFeedback(null), 2500);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-[#22D8FF]/40 bg-[#22D8FF]/10 px-3 py-2.5 text-[11px] font-bold tracking-wide text-[#22D8FF] transition hover:bg-[#22D8FF]/20 sm:px-4"
          >
            <Upload size={13} /> <span className="hidden sm:inline">PUBLISH</span>
          </button>
          <button
            onClick={() => useBuilderStore.getState().open()}
            className="hidden items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[11px] font-bold tracking-wide text-white/80 transition hover:border-white/40 hover:text-white sm:flex"
          >
            <ClipboardList size={13} /> PLAN
          </button>
          <button
            onClick={() => { setMenu("none"); setColorPanelOpen(true); }}
            title="Color studio"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border transition",
              colorPanelOpen ? "text-black" : "border-white/15 bg-white/[0.04] text-white/60 hover:text-white"
            )}
            style={colorPanelOpen ? { background: LIME, borderColor: LIME } : undefined}
          >
            <Palette size={16} />
          </button>
          <button onClick={togglePlaying} className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold text-black transition hover:brightness-110 md:hidden" style={{ background: LIME }}>
            {playing ? <Pause size={14} strokeWidth={3} /> : <Play size={14} strokeWidth={3} />}
          </button>
        </div>
      </header>

      {/* ---------- MIDDLE ---------- */}
      <div className="flex flex-1 items-stretch justify-between gap-3 overflow-hidden px-3 py-3 sm:px-4">
        <aside className="pointer-events-auto hidden w-60 flex-col gap-3 rounded-2xl border border-white/10 bg-[#191D1A]/85 p-3 backdrop-blur-xl lg:flex" style={{ maxHeight: "calc(100vh - 280px)" }}>
          <div className="flex gap-1 rounded-xl border border-white/10 bg-black/30 p-1">
            {tabBtn("motion", "MOTION", <SlidersHorizontal size={11} />)}
            {tabBtn("scene", "SCENE", <Move3d size={11} />)}
            {tabBtn("style", "STYLE", <Palette size={11} />)}
          </div>
          <div className="flex-1 overflow-y-auto pr-0.5">
            {tab === "motion" && <MotionTab />}
            {tab === "scene" && (
              <div className="space-y-1.5">
                <SectionTitle icon={<Move3d size={12} />}>CAMERA ANGLES</SectionTitle>
                <div className="mb-3 grid grid-cols-2 gap-1.5">
                  {CAMERAS.map((c: any) => (
                    <button key={c.id} onClick={() => setCameraPreset(c.id)}
                      className={cn("flex items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-bold transition-all",
                        cameraPreset === c.id ? "text-black" : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:text-white")}
                      style={cameraPreset === c.id ? { background: LIME, borderColor: LIME } : undefined}>
                      {c.icon}<span>{c.label}</span>
                      <kbd className="ml-auto text-[9px] opacity-40">{c.key}</kbd>
                    </button>
                  ))}
                </div>
                <SectionTitle icon={<Eye size={12} />}>SCENE OPTIONS</SectionTitle>
                <div className="space-y-1.5">
                  <Toggle active={autoRotate} onClick={() => setAutoRotate(!autoRotate)} icon={<Orbit size={13} />} label="Auto-orbit" />
                  <Toggle active={showTrail} onClick={() => setShowTrail(!showTrail)} icon={<Spline size={13} />} label="Motion trail" />
                  <Toggle active={showAngles} onClick={() => setShowAngles(!showAngles)} icon={<Ruler size={13} />} label="Joint angles" />
                  <Toggle active={showGrid} onClick={() => setShowGrid(!showGrid)} icon={<Grid3x3 size={13} />} label="Floor grid" />
                  <Toggle active={showBreath} onClick={() => setShowBreath(!showBreath)} icon={<Wind size={13} />} label="Breathing coach" />
                  <Toggle active={slowMo} onClick={() => setSlowMo(!slowMo)} icon={<Turtle size={13} />} label="Slow motion" />
                </div>
              </div>
            )}
            {tab === "style" && (
              <div>
                <SectionTitle icon={<Palette size={12} />}>ATHLETE LOOK</SectionTitle>
                <p className="mb-1 text-[10px] font-bold text-white/35">Skin</p>
                <div className="mb-3 flex gap-1.5">
                  {SKIN_TONES.map((c: any) => (
                    <button key={c} onClick={() => setSkinTone(c)} className={cn("h-7 w-7 rounded-full border-2 transition", skinTone === c ? "scale-110" : "border-white/20 hover:scale-105")} style={{ background: c, ...(skinTone === c ? { borderColor: LIME } : {}) }} />
                  ))}
                </div>
                <p className="mb-1 text-[10px] font-bold text-white/35">Shirt</p>
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {SHIRT_COLORS.map((c: any) => (
                    <button key={c} onClick={() => setShirtColor(c)} className={cn("h-7 w-7 rounded-full border-2 transition", shirtColor === c ? "scale-110" : "border-white/20 hover:scale-105")} style={{ background: c, ...(shirtColor === c ? { borderColor: LIME } : {}) }} />
                  ))}
                </div>
                <p className="mb-1 text-[10px] font-bold text-white/35">Shorts</p>
                <div className="flex flex-wrap gap-1.5">
                  {SHORTS_COLORS.map((c: any) => (
                    <button key={c} onClick={() => setShortsColor(c)} className={cn("h-7 w-7 rounded-full border-2 transition", shortsColor === c ? "scale-110" : "border-white/20 hover:scale-105")} style={{ background: c, ...(shortsColor === c ? { borderColor: LIME } : {}) }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <div className="relative flex flex-1 flex-col items-center justify-end">
          {showHint && (
            <div className="pointer-events-auto absolute top-1 left-1/2 hidden -translate-x-1/2 items-center gap-3 rounded-full border border-white/15 bg-black/70 py-2 pr-5 pl-3 shadow-2xl backdrop-blur-xl md:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-black" style={{ background: LIME }}><Move3d size={16} /></span>
              <p className="whitespace-nowrap text-xs font-semibold text-white">Drag to rotate · Scroll to zoom · Right-drag to pan</p>
              <button onClick={() => setShowHint(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
          )}
          <GameFeedback />
          {/* Publish feedback toast */}
          {publishFeedback && (
            <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 z-30">
              <div className="anim-toast-in flex items-center gap-2 rounded-2xl border border-[#22D8FF]/40 bg-black/80 px-4 py-3 backdrop-blur-xl">
                <Check size={16} style={{ color: LIME }} strokeWidth={3} />
                <div className="text-left">
                  <p className="text-[9px] font-bold tracking-[0.2em]" style={{ color: LIME }}>ANIMATION PUBLISHED</p>
                  <p className="text-sm font-bold text-white truncate max-w-[200px]">&ldquo;{publishFeedback}&rdquo;</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="hidden flex-col gap-3 overflow-y-auto md:flex" style={{ maxHeight: "calc(100vh - 280px)" }}>
          {showAnalysis ? <FormPanel /> : (
            <button onClick={() => setShowAnalysis(true)}
              className="pointer-events-auto flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-[#191D1A]/85 px-4 py-3 text-[11px] font-bold tracking-widest text-white/70 backdrop-blur-xl transition hover:text-white">
              <Activity size={14} /> SHOW FORM
            </button>
          )}
        </div>
      </div>

      <BreathVisualizer />

      {/* ---------- BOTTOM GAME HUD ---------- */}
      <footer className="pointer-events-auto border-t border-white/10 bg-[#111411]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2.5 sm:gap-4">
          <div className="hidden min-w-0 flex-1 sm:block">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[10px] font-bold tracking-widest text-[#929A91]">
                {useCustom ? `✨ ${customName}` : presetId !== "custom" ? PRESETS[presetId as PresetId]?.name : "Custom"}
                <span className="text-white/30"> · REP {reps + 1}</span>
              </span>
              <span
                className="shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black tracking-widest"
                style={{ color: hudPhase.color, borderColor: `${hudPhase.color}55`, background: `${hudPhase.color}14` }}
              >
                {hudPhase.label.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-[9px] font-bold tracking-widest text-white/35">SPEED</span>
              <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-24 sm:w-28" style={{ accentColor: LIME }} />
              <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums" style={{ color: LIME }}>{speed.toFixed(2)}×</span>
            </div>
            <div className="mt-1 flex justify-between text-[9px] font-bold text-white/30">
              <span className="tabular-nums">{Math.round(live.effort * 100)}% effort · {Math.round(live.frac * 100)}% rep</span>
              <span className="tabular-nums">{live.jointLabel} {Math.round(live.joint)}°</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:hidden">
            <Flame size={16} style={{ color: AMBER }} />
            <span key={reps} className="anim-rep-flash text-xl font-black tabular-nums text-white">{reps}</span>
            <span
              className="rounded-full border px-1.5 py-0.5 text-[8px] font-black tracking-widest"
              style={{ color: hudPhase.color, borderColor: `${hudPhase.color}55` }}
            >
              {hudPhase.label.toUpperCase()}
            </span>
          </div>

          {/* repeat / previous rep */}
          <button title="Previous rep" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/35 hover:text-white sm:flex">
            <ChevronLeft size={18} />
          </button>

          <button onClick={togglePlaying} title="Play / pause (Space)"
            className="glow-lime relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-[1.04] active:scale-95"
            style={{ background: LIME, color: INK }}>
            {playing ? <Pause size={26} strokeWidth={2.8} /> : <Play size={26} strokeWidth={2.8} className="ml-1" />}
          </button>

          {/* next rep */}
          <button title="Next rep" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/55 transition hover:border-white/35 hover:text-white sm:flex">
            <ChevronRight size={18} />
          </button>

          <button onClick={resetReps} title="Repeat (R)" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/40 hover:text-white sm:flex">
            <RotateCcw size={16} />
          </button>

          <div className="relative">
            <button onClick={() => toggleMenu("motion")} title="Settings"
              className={cn("flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[11px] font-bold text-white/60 transition hover:border-white/30 hover:text-white",
                menu === "motion" && "border-white/40 text-white")}>
              <Settings size={16} />
              <span className="hidden sm:inline">SETTINGS</span>
              <ChevronUp size={12} className={cn("transition-transform", menu === "motion" && "rotate-180")} />
              {(slowMo || autoRotate || autoFit) && <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full" style={{ background: LIME }} />}
            </button>
            <PopMenu open={menu === "motion"} onClose={() => setMenu("none")} width={264}>
              <p className="px-2 pt-1 pb-2 text-[9px] font-bold tracking-[0.2em] text-[#929A91]">SETTINGS</p>

              <button onClick={() => setAutoFit(!autoFit)}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition",
                  autoFit ? "text-black" : "text-white/60 hover:bg-white/8 hover:text-white")}
                style={autoFit ? { background: LIME } : undefined}>
                <Film size={15} /> Auto fit to screen
                {autoFit && <Check size={13} strokeWidth={3} className="ml-auto" />}
              </button>
              <p className="px-3 pb-2 text-[9px] leading-snug text-white/35">
                Frames the whole stage for your screen ratio and re-frames on resize.
              </p>

              <button onClick={() => setAutoRotate(!autoRotate)}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition",
                  autoRotate ? "text-white" : "text-white/60 hover:bg-white/8 hover:text-white")}
                style={autoRotate ? { background: `${VIOLET}33` } : undefined}>
                <Orbit size={15} /> Auto-orbit camera
                {autoRotate && <Check size={13} strokeWidth={3} className="ml-auto" style={{ color: VIOLET_LT }} />}
              </button>

              <button onClick={() => setSlowMo(!slowMo)}
                className={cn("flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold transition",
                  slowMo ? "text-white" : "text-white/60 hover:bg-white/8 hover:text-white")}
                style={slowMo ? { background: `${AMBER}2e` } : undefined}>
                <Turtle size={15} /> Slow motion
                {slowMo && <Check size={13} strokeWidth={3} className="ml-auto" style={{ color: AMBER }} />}
              </button>

              <div className="mx-1 my-2 h-px bg-white/10" />

              <div className="px-2 pb-1">
                <div className="mb-1.5 flex justify-between text-[9px] font-bold tracking-widest text-white/35">
                  <span>SPEED</span><span className="text-white/60 tabular-nums">{speed.toFixed(2)}×</span>
                </div>
                <input type="range" min={0.25} max={2} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full" />
              </div>

              <div className="mx-1 my-2 h-px bg-white/10" />

              <p className="px-2 pb-2 pt-1 text-[9px] font-bold tracking-[0.2em] text-[#929A91]">CAMERA</p>
              <div className="grid grid-cols-2 gap-1">
                {CAMERAS.map((c: any) => (
                  <button key={c.id} onClick={() => { setCameraPreset(c.id); setMenu("none"); }}
                    className={cn("flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[11px] font-bold transition",
                      cameraPreset === c.id ? "text-black" : "text-white/60 hover:bg-white/8 hover:text-white")}
                    style={cameraPreset === c.id ? { background: LIME } : undefined}>
                    {c.icon}<span>{c.label}</span>
                  </button>
                ))}
              </div>

              <div className="mx-1 my-2 h-px bg-white/10" />

              <button onClick={() => { setMenu("none"); useSceneStore.getState().setEditorOpen(true); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-bold text-white transition hover:brightness-110"
                style={{ background: `${VIOLET}26` }}>
                <Trees size={15} /> Scene editor
                {sceneCount > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-black text-white" style={{ background: VIOLET }}>{sceneCount}</span>
                )}
              </button>
            </PopMenu>
          </div>
        </div>
      </footer>
      <CustomStudio />
      <SceneStudio />
      <ColorThemePanel />
      <WorkoutBuilder />
    </div>
  );
}




