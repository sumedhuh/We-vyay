import { useRef, useState } from "react";
import { RotateCw, Check, X, Minus, Plus, Move, Trash2 } from "lucide-react";
import { useSceneStore } from "./store";
import { FURNITURE, PETS, MIN_RADIUS, MAX_RADIUS, themeById } from "./data";
import { cn } from "@/lib/utils";

const SIZE = 300; // px of the square map
const WORLD = MAX_RADIUS + 0.6; // world units mapped to half the map
const toPx = (w: number) => (w / WORLD) * (SIZE / 2) + SIZE / 2;
const toWorld = (px: number) => ((px - SIZE / 2) / (SIZE / 2)) * WORLD;

function iconFor(kind: string) {
  return FURNITURE.find((f) => f.kind === kind)?.emoji ?? PETS.find((p) => p.kind === kind)?.emoji ?? "📦";
}
function nameFor(kind: string) {
  return FURNITURE.find((f) => f.kind === kind)?.name ?? PETS.find((p) => p.kind === kind)?.name ?? "Item";
}

export default function FloorPlanner() {
  const kind = useSceneStore((s) => s.plannerKind);
  const editId = useSceneStore((s) => s.plannerEditId);
  const x = useSceneStore((s) => s.plannerX);
  const z = useSceneStore((s) => s.plannerZ);
  const rot = useSceneStore((s) => s.plannerRot);
  const scale = useSceneStore((s) => s.plannerScale);
  const placements = useSceneStore((s) => s.placements);
  const theme = useSceneStore((s) => themeById(s.activeTheme));
  const setPos = useSceneStore((s) => s.setPlannerPos);
  const setRot = useSceneStore((s) => s.setPlannerRot);
  const setScale = useSceneStore((s) => s.setPlannerScale);
  const confirm = useSceneStore((s) => s.confirmPlanner);
  const cancel = useSceneStore((s) => s.cancelPlanner);
  const removeAndClose = useSceneStore((s) => s.removeSelected);
  const setSelected = useSceneStore((s) => s.setSelected);

  const mapRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  if (!kind) return null;

  const others = placements.filter((p) => p.id !== editId);

  const pointerToWorld = (clientX: number, clientY: number) => {
    const r = mapRef.current?.getBoundingClientRect();
    if (!r) return null;
    const px = ((clientX - r.left) / r.width) * SIZE;
    const py = ((clientY - r.top) / r.height) * SIZE;
    return { wx: toWorld(px), wz: toWorld(py) };
  };

  const startDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const p = pointerToWorld(ev.clientX, ev.clientY);
      if (p) setPos(p.wx, p.wz);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  const tapMap = (e: React.PointerEvent) => {
    const p = pointerToWorld(e.clientX, e.clientY);
    if (p) setPos(p.wx, p.wz);
  };

  return (
    <div className="fixed inset-0 z-[62] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md" onClick={cancel}>
      <div onClick={(e) => e.stopPropagation()} className="studio-font w-full max-w-sm overflow-hidden rounded-3xl border border-lime-300/25 bg-[#080b12] shadow-[0_0_80px_rgba(212,255,63,0.14)]">
        {/* header */}
        <div className="flex items-center gap-2.5 border-b border-white/10 bg-gradient-to-r from-lime-300/10 to-transparent px-4 py-3">
          <span className="text-2xl leading-none">{iconFor(kind)}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white">{nameFor(kind)}</p>
            <p className="text-[10.5px] text-white/40">{editId ? "Move it around your space" : "Drag it where you want it"}</p>
          </div>
          <button onClick={cancel} className="rounded-xl border border-white/15 p-2 text-white/55 transition hover:bg-white/10 hover:text-white">
            <X size={16} />
          </button>
        </div>

        {/* the ground preview */}
        <div className="p-4">
          <p className="mb-2 flex items-center gap-1.5 text-[9.5px] font-black tracking-[0.2em] text-white/35">
            <Move size={11} /> YOUR FLOOR — TOP VIEW
          </p>
          <div
            ref={mapRef}
            onPointerDown={tapMap}
            className="relative mx-auto touch-none overflow-hidden rounded-2xl border border-white/12"
            style={{ width: SIZE, height: SIZE, maxWidth: "100%", background: theme.floor }}
          >
            {/* grid */}
            <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
              <defs>
                <pattern id="fp-grid" width={SIZE / 12} height={SIZE / 12} patternUnits="userSpaceOnUse">
                  <path d={`M ${SIZE / 12} 0 L 0 0 0 ${SIZE / 12}`} fill="none" stroke={theme.gridCell} strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={SIZE} height={SIZE} fill="url(#fp-grid)" />
              {/* outer boundary */}
              <circle cx={SIZE / 2} cy={SIZE / 2} r={(MAX_RADIUS / WORLD) * (SIZE / 2)} fill="none" stroke={theme.gridSection} strokeWidth="1.5" strokeDasharray="5 4" />
              {/* athlete no-go zone */}
              <circle cx={SIZE / 2} cy={SIZE / 2} r={(MIN_RADIUS / WORLD) * (SIZE / 2)} fill="rgba(255,77,46,0.07)" stroke="rgba(255,77,46,0.35)" strokeWidth="1.5" strokeDasharray="4 3" />
              {/* the mat */}
              <rect
                x={toPx(-0.575)} y={toPx(-1.6)}
                width={(1.15 / WORLD) * (SIZE / 2)} height={(2.5 / WORLD) * (SIZE / 2)}
                rx="4" fill={theme.mat} stroke={theme.matEdge} strokeWidth="1.5" opacity="0.85"
              />
            </svg>

            {/* athlete marker */}
            <div className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center" style={{ left: toPx(0), top: toPx(-0.35) }}>
              <span className="text-xl leading-none">🏋️</span>
              <span className="mt-0.5 rounded-full bg-black/70 px-1.5 text-[7.5px] font-black tracking-wider text-white/70">YOU</span>
            </div>

            {/* already-placed items */}
            {others.map((p) => (
              <div key={p.id} className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 opacity-55"
                style={{ left: toPx(p.x), top: toPx(p.z) }}>
                <span className="text-lg leading-none">{iconFor(p.kind)}</span>
              </div>
            ))}

            {/* the item being placed */}
            <div
              onPointerDown={(e) => { e.stopPropagation(); startDrag(e); }}
              className={cn("absolute flex -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none flex-col items-center", dragging && "cursor-grabbing")}
              style={{ left: toPx(x), top: toPx(z) }}
            >
              <span className="absolute -inset-5 rounded-full border-2 border-dashed border-lime-300/70 bg-lime-300/15" style={{ transform: `scale(${scale})` }} />
              <span className="relative text-2xl leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]" style={{ transform: `rotate(${rot}rad) scale(${scale})` }}>
                {iconFor(kind)}
              </span>
            </div>

            {/* hint */}
            <div className="pointer-events-none absolute inset-x-0 bottom-2 text-center">
              <span className="rounded-full bg-black/75 px-2.5 py-1 text-[9px] font-bold text-white/55">
                Drag the glowing item · red zone is the athlete
              </span>
            </div>
          </div>

          {/* transform controls */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button onClick={() => setRot(rot + Math.PI / 8)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 py-2.5 text-[10.5px] font-bold text-white/65 transition hover:border-lime-300/50 hover:text-white">
              <RotateCw size={13} /> Rotate
            </button>
            <button onClick={() => setScale(scale - 0.12)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 py-2.5 text-[10.5px] font-bold text-white/65 transition hover:border-lime-300/50 hover:text-white">
              <Minus size={13} /> Smaller
            </button>
            <button onClick={() => setScale(scale + 0.12)}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-white/12 py-2.5 text-[10.5px] font-bold text-white/65 transition hover:border-lime-300/50 hover:text-white">
              <Plus size={13} /> Bigger
            </button>
          </div>
          {editId && (
            <button onClick={() => { setSelected(editId); removeAndClose(); cancel(); }}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 py-2 text-[10.5px] font-black tracking-wider text-red-200 transition hover:bg-red-500/20">
              <Trash2 size={12} /> REMOVE FROM SPACE
            </button>
          )}
        </div>

        {/* footer */}
        <div className="flex gap-2 border-t border-white/10 bg-black/40 p-3">
          <button onClick={cancel} className="flex-1 rounded-2xl border border-white/15 py-3 text-[11px] font-black tracking-wider text-white/65 transition hover:text-white">
            CANCEL
          </button>
          <button onClick={confirm}
            className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-lime-300 to-cyan-300 py-3 text-[11px] font-black tracking-wider text-black shadow-[0_0_26px_rgba(212,255,63,0.4)] transition hover:brightness-110">
            <Check size={15} strokeWidth={3} /> DONE — PLACE IT
          </button>
        </div>
      </div>
    </div>
  );
}
