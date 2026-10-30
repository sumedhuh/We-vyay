import { useEffect, useRef, useState } from "react";
import { X, SlidersHorizontal, GripVertical, Move } from "lucide-react";
import { usePushupStore, liveStats } from "./store";
import { presetBreath, breathStageProgress } from "./animations";
import { cn } from "@/lib/utils";

const POS_KEY = "pushup3d-breath-pos";

function useBreath() {
  const [s, setS] = useState({ frac: 0 });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setS({ frac: liveStats.phaseFrac });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return s;
}

function loadPos(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p.x === "number" && typeof p.y === "number") return p;
  } catch { /* ignore */ }
  return null;
}

export default function BreathVisualizer() {
  const show = usePushupStore((s) => s.showBreath);
  const setShow = usePushupStore((s) => s.setShowBreath);
  const useCustom = usePushupStore((s) => s.useCustom);
  const customBreath = usePushupStore((s) => s.workout.breath);
  const animBase = usePushupStore((s) => s.anim.base);
  const setStudioOpen = usePushupStore((s) => s.setStudioOpen);
  const { frac } = useBreath();

  const [pos, setPos] = useState<{ x: number; y: number } | null>(loadPos);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ sx: number; sy: number; bx: number; by: number; moved: boolean } | null>(null);

  // persist position
  useEffect(() => {
    if (pos) {
      try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
    }
  }, [pos]);

  if (!show) return null;

  const breath = useCustom ? customBreath : presetBreath(animBase);
  if (!breath.enabled) return null;

  const { inhale, progress } = breathStageProgress(frac, breath);
  const eased = progress * progress * (3 - 2 * progress);
  const scale = inhale ? 0.55 + eased * 0.45 : 1 - eased * 0.45;
  const color = inhale ? "#B8FF2C" : "#FFB547";
  const ring = 2 * Math.PI * 20;

  const clamp = (x: number, y: number) => {
    const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
    const vh = typeof window === "undefined" ? 800 : window.innerHeight;
    return {
      x: Math.max(-vw / 2 + 80, Math.min(vw / 2 - 80, x)),
      y: Math.max(-(vh - 160), Math.min(vh - 200, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("button") || t.closest("input") || t.closest("[data-nodrag]")) return;
    drag.current = { sx: e.clientX, sy: e.clientY, bx: pos?.x ?? 0, by: pos?.y ?? 0, moved: false };
    setDragging(true);

    const onMove = (ev: PointerEvent) => {
      if (!drag.current) return;
      const dx = ev.clientX - drag.current.sx;
      const dy = ev.clientY - drag.current.sy;
      if (!drag.current.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
      drag.current.moved = true;
      setPos(clamp(drag.current.bx + dx, drag.current.by + dy));
    };
    const onUp = () => {
      drag.current = null;
      setDragging(false);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <div
      className="pointer-events-auto absolute left-1/2 z-30 select-none"
      style={{
        bottom: 110,
        transform: `translateX(-50%) translate(${pos?.x ?? 0}px, ${pos?.y ?? 0}px)`,
        touchAction: "none",
        cursor: dragging ? "grabbing" : "grab",
      }}
      onPointerDown={onPointerDown}
      title="Drag to move · breathe in on lime, out on amber"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-full border bg-black/65 py-2 pl-2.5 pr-2 shadow-2xl backdrop-blur-xl transition-shadow sm:gap-3 sm:pl-3",
          dragging ? "border-lime-300/50 shadow-[0_0_40px_rgba(212,255,63,0.25)]" : "border-white/12"
        )}
      >
        {/* drag grip */}
        <span className="flex flex-col items-center justify-center pl-1 text-white/25">
          <GripVertical size={15} />
        </span>

        {/* breathing orb (leftmost, the animation) */}
        <div className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
          <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90">
            <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
            <circle
              cx="24" cy="24" r="20" fill="none"
              stroke={color} strokeWidth="4" strokeLinecap="round"
              strokeDasharray={ring}
              strokeDashoffset={ring * (1 - progress)}
              style={{ filter: `drop-shadow(0 0 5px ${color})` }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full sm:h-10 sm:w-10"
              style={{
                transform: `scale(${scale})`,
                background: `radial-gradient(circle at 35% 30%, ${color}55, ${color}22 60%, transparent 75%)`,
                border: `2px solid ${color}88`,
                boxShadow: `0 0 24px ${color}44, inset 0 0 18px ${color}33`,
              }}
            >
              <span className="text-lg leading-none">{inhale ? "👃" : "💨"}</span>
            </div>
          </div>
        </div>

        {/* label */}
        <div className="w-[104px] shrink-0 sm:w-[120px]">
          <p className="text-[12px] font-black tracking-[0.16em] sm:text-[13px]" style={{ color }}>
            {inhale ? "BREATHE IN" : "BREATHE OUT"}
          </p>
          <p className="text-[9px] font-semibold text-white/40">
            {inhale ? "through your nose" : "through your mouth"} · {Math.round(progress * 100)}%
          </p>
        </div>

        {/* long breath map of the rep cycle */}
        <div className="hidden w-44 md:block lg:w-60">
          <CycleMap compact inhaleStart={breath.inhaleStart} inhaleEnd={breath.inhaleEnd} frac={frac} />
        </div>

        {/* edge controls */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setStudioOpen(true)}
            title="Customize breath pattern"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/55 transition hover:border-cyan-300/50 hover:text-cyan-200"
          >
            <SlidersHorizontal size={13} />
          </button>
          <button
            onClick={() => setShow(false)}
            title="Hide breathing coach"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* drag hint */}
      <div className={cn(
        "pointer-events-none absolute -bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/70 px-2.5 py-0.5 text-[8px] font-bold tracking-widest text-white/45 opacity-0 transition-opacity",
        dragging && "opacity-100"
      )}>
        <Move size={9} /> DRAGGING
      </div>
    </div>
  );
}

export function CycleMap({ inhaleStart, inhaleEnd, frac, compact = false }: { inhaleStart: number; inhaleEnd: number; frac: number; compact?: boolean }) {
  const N = 48;
  const segs: boolean[] = [];
  for (let i = 0; i < N; i++) {
    const f = i / N;
    const s = inhaleStart, e = inhaleEnd;
    let inh: boolean;
    if (Math.abs(e - s) < 1e-4 || Math.abs(e - s) > 0.999) inh = true;
    else if (s <= e) inh = f >= s && f < e;
    else inh = f >= s || f < e;
    segs.push(inh);
  }
  const activeIdx = Math.floor(frac * N) % N;
  return (
    <div>
      <div className="flex gap-[2px]">
        {segs.map((inh, i) => (
          <div
            key={i}
            className={cn("h-2.5 flex-1 rounded-full", i === activeIdx && "ring-1 ring-white")}
            style={{ background: inh ? "rgba(198,255,46,0.85)" : "rgba(255,77,46,0.8)", opacity: i === activeIdx ? 1 : 0.45 }}
          />
        ))}
      </div>
      {!compact && (
        <div className="mt-1 flex justify-between text-[8px] font-bold text-white/35">
          <span className="text-lime-300/90">■ INHALE</span>
          <span>REP CYCLE</span>
          <span className="text-orange-300/90">■ EXHALE</span>
        </div>
      )}
    </div>
  );
}


