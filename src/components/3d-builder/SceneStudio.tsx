import { useEffect, useState } from "react";
import {
  X, Gem, Sparkles, RotateCw, Trash2, Lock, Check, Search, ShoppingCart,
  Move, Palette, Cat, Megaphone, Coins, LayoutGrid, Info,
} from "lucide-react";
import { useSceneStore } from "./scene/store";
import {
  FURNITURE, PETS, THEMES, ADS, MAX_PLACEMENTS,
  type FurnishingKind, type PetKind,
} from "./scene/data";
import FloorPlanner from "./scene/FloorPlanner";
import { cn } from "@/lib/utils";

type Tab = "furniture" | "pets" | "themes" | "ads";

export default function SceneStudio() {
  const open = useSceneStore((s) => s.panelOpen);
  const setOpen = useSceneStore((s) => s.setPanelOpen);
  const gems = useSceneStore((s) => s.gems);
  const ownedFurniture = useSceneStore((s) => s.ownedFurniture);
  const ownedPets = useSceneStore((s) => s.ownedPets);
  const placements = useSceneStore((s) => s.placements);
  const activeTheme = useSceneStore((s) => s.activeTheme);
  const selectedId = useSceneStore((s) => s.selectedId);
  const placingKind = useSceneStore((s) => s.placingKind);
  const toast = useSceneStore((s) => s.toast);
  const openPlanner = useSceneStore((s) => s.openPlanner);
  const editInPlanner = useSceneStore((s) => s.editInPlanner);
  const cancelPlacing = useSceneStore((s) => s.cancelPlacing);
  const buy = useSceneStore((s) => s.buy);
  const setTheme = useSceneStore((s) => s.setTheme);
  const rotateSelected = useSceneStore((s) => s.rotateSelected);
  const scaleSelected = useSceneStore((s) => s.scaleSelected);
  const removeSelected = useSceneStore((s) => s.removeSelected);
  const clearAll = useSceneStore((s) => s.clearAll);
  const rewardAd = useSceneStore((s) => s.rewardAd);
  const setSelected = useSceneStore((s) => s.setSelected);

  const [tab, setTab] = useState<Tab>("furniture");
  const [q, setQ] = useState("");
  const [claimed, setClaimed] = useState<string[]>([]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => useSceneStore.setState({ toast: "" }), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  if (!open) return null;

  const isPetKind = (k: string) => PETS.some((p) => p.kind === k);
  const sel = placements.find((p) => p.id === selectedId);
  const full = placements.length >= MAX_PLACEMENTS;
  const ad = ADS[useSceneStore.getState().adIndex % ADS.length];

  const furnitureList = FURNITURE.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) || f.blurb.toLowerCase().includes(q.toLowerCase()));

  const TapRow = ({ kind, emoji, name, blurb, price, owned, isPet }: {
    kind: FurnishingKind | PetKind; emoji: string; name: string; blurb: string; price: number; owned: boolean; isPet: boolean;
  }) => {
    const countInScene = placements.filter((p) => p.kind === kind).length;
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition">
        <div className="mb-2 flex items-start gap-2.5">
          <span className="text-2xl leading-none">{emoji}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-white">{name}</p>
            <p className="text-[10px] leading-snug text-white/40">{blurb}</p>
          </div>
          {countInScene > 0 && (
            <span className="shrink-0 rounded-full bg-lime-300/20 px-1.5 py-0.5 text-[9px] font-black text-lime-200">×{countInScene}</span>
          )}
        </div>
        {owned ? (
          <button
            disabled={full}
            onClick={() => openPlanner(kind, isPet ? "pet" : "furniture")}
            className={cn("flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[10.5px] font-black tracking-wider transition",
              full ? "cursor-not-allowed bg-white/6 text-white/25" : "bg-lime-300 text-black hover:bg-lime-200")}>
            <Move size={12} /> {full ? "SCENE FULL" : "PLACE IN SPACE"}
          </button>
        ) : (
          <button onClick={() => buy(kind, isPet ? "pet" : "furniture", price)}
            className={cn("flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-[10.5px] font-black tracking-wider transition",
              gems >= price ? "bg-gradient-to-r from-cyan-300 to-lime-300 text-black hover:brightness-110" : "bg-white/8 text-white/35")}>
            <Gem size={12} /> {price} {gems >= price ? "" : `· NEED ${price - gems} MORE`}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="studio-font pointer-events-auto fixed inset-0 z-[58] flex justify-end bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <aside onClick={(e) => e.stopPropagation()} className="flex h-full w-full max-w-md flex-col border-l border-white/12 bg-[#080b12] shadow-[-30px_0_80px_rgba(0,0,0,0.6)]">
        {/* header */}
        <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-violet-300/[0.1] via-transparent to-lime-300/[0.06] px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-300 to-cyan-300 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <LayoutGrid size={19} className="text-black" strokeWidth={2.4} />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-black leading-tight text-white">Scenes</h2>
              <p className="truncate text-[10.5px] text-white/40">Build your 3D training space — everything stays put</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-2.5 py-1.5">
              <Gem size={14} className="text-cyan-300" />
              <span className="font-mono text-[13px] font-bold text-cyan-200">{gems}</span>
            </div>
            <button onClick={() => setOpen(false)} className="shrink-0 rounded-xl border border-white/15 p-2 text-white/60 transition hover:bg-white/10 hover:text-white">
              <X size={17} />
            </button>
          </div>

          {/* tabs */}
          <div className="mt-3 flex gap-1 rounded-xl border border-white/10 bg-black/40 p-1">
            {([
              { id: "furniture", label: "Furniture", icon: <ShoppingCart size={12} /> },
              { id: "pets", label: "Pets", icon: <Cat size={12} /> },
              { id: "themes", label: "Themes", icon: <Palette size={12} /> },
              { id: "ads", label: "Rewards", icon: <Megaphone size={12} /> },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={cn("flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-black tracking-wide transition",
                  tab === t.id ? "bg-lime-300 text-black" : "text-white/45 hover:bg-white/8 hover:text-white")}>
                {t.icon}{t.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* placing banner */}
        {placingKind && (
          <button onClick={cancelPlacing} className="flex shrink-0 items-center gap-2 border-b border-lime-300/30 bg-lime-300/10 px-4 py-2.5 text-left">
            <Info size={14} className="shrink-0 text-lime-300" />
            <span className="min-w-0 flex-1 text-[11px] font-bold text-lime-100">Tap anywhere on the gym floor to place it</span>
            <span className="shrink-0 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black text-white/60">CANCEL</span>
          </button>
        )}

        {/* body */}
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
          {tab === "furniture" && (
            <>
              <div className="relative">
                <Search size={13} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/30" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search furniture…"
                  className="w-full rounded-xl border border-white/12 bg-white/[0.04] py-2.5 pr-3 pl-9 text-xs text-white outline-none placeholder:text-white/25 focus:border-lime-300/60" />
              </div>
              <p className="text-[10px] font-bold text-white/35">{placements.length}/{MAX_PLACEMENTS} items placed</p>
              <div className="grid grid-cols-2 gap-2">
                {furnitureList.map((f) => (
                  <TapRow key={f.kind} kind={f.kind} emoji={f.emoji} name={f.name} blurb={f.blurb} price={f.price}
                    owned={ownedFurniture.includes(f.kind)} isPet={false} />
                ))}
              </div>
            </>
          )}

          {tab === "pets" && (
            <>
              <div className="rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.05] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-black tracking-wide text-cyan-200"><Cat size={13} /> YOUR WORKOUT BUDDY</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/45">
                  Pets bounce beside you and shout encouragement every time you finish a rep. Place them anywhere — they stay put permanently.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {PETS.map((p) => (
                  <TapRow key={p.kind} kind={p.kind} emoji={p.emoji} name={p.name} blurb={p.cheers[0]} price={p.price}
                    owned={ownedPets.includes(p.kind)} isPet />
                ))}
              </div>
            </>
          )}

          {tab === "themes" && (
            <>
              <div className="rounded-2xl border border-violet-300/25 bg-violet-300/[0.05] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-black tracking-wide text-violet-200"><Palette size={13} /> SPACE THEMES</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/45">
                  Restyles the whole room — floor, grid, lighting and mat. Also attachable to any workout you build.
                </p>
              </div>
              <div className="space-y-2">
                {THEMES.map((t) => {
                  const active = activeTheme === t.id;
                  const owned = t.price === 0 || true; // themes are unlocked by purchase below
                  void owned;
                  return (
                    <button key={t.id} onClick={() => setTheme(t.id)}
                      className={cn("flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition",
                        active ? "border-lime-300/60 bg-lime-300/[0.09]" : "border-white/10 bg-white/[0.02] hover:border-white/25")}>
                      <span className="text-2xl">{t.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-white">{t.name}</p>
                        <div className="mt-1 flex gap-1">
                          {[t.rimA, t.rimB, t.rimC, t.matEdge].map((c) => (
                            <span key={c} className="h-3 w-3 rounded-full" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                      {t.price > 0 && <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-cyan-300"><Gem size={11} />{t.price}</span>}
                      {active && <Check size={15} className="shrink-0 text-lime-300" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "ads" && (
            <>
              <div className="rounded-2xl border border-lime-300/25 bg-lime-300/[0.05] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-black tracking-wide text-lime-200"><Megaphone size={13} /> SPONSOR CIRCLE</p>
                <p className="mt-1 text-[10.5px] leading-relaxed text-white/45">
                  The big ring behind the athlete is ad space — it rotates sponsors while you train. Tap claim to bank gems.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br p-5 text-center" style={{ backgroundImage: `linear-gradient(135deg, ${ad.from}, ${ad.to})` }}>
                <p className="text-[9px] font-black tracking-[0.3em] text-black/55">{ad.brand}</p>
                <p className="mt-1.5 text-xl font-black leading-tight text-white">{ad.headline}</p>
                <p className="mt-1 text-[11.5px] font-semibold text-white/85">{ad.sub}</p>
                <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-black/70 px-3 py-1.5 text-[10px] font-black tracking-widest text-white">{ad.cta}</p>
              </div>
              <button
                onClick={() => { if (!claimed.includes(ad.id)) { rewardAd(ad.reward); setClaimed((c) => [...c, ad.id]); } }}
                disabled={claimed.includes(ad.id)}
                className={cn("flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[11px] font-black tracking-wider transition",
                  claimed.includes(ad.id) ? "bg-white/8 text-white/30" : "bg-gradient-to-r from-cyan-300 to-lime-300 text-black hover:brightness-110")}>
                <Coins size={14} /> {claimed.includes(ad.id) ? "CLAIMED — NEXT SPONSOR SOON" : `CLAIM +${ad.reward} GEMS`}
              </button>
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                <p className="mb-1.5 text-[10px] font-black tracking-widest text-white/40">GEM WALLET</p>
                <p className="flex items-center gap-2 font-mono text-2xl font-bold text-cyan-200"><Gem size={18} /> {gems}</p>
                <p className="mt-1 text-[10px] text-white/35">Spend them in Furniture & Pets to unlock new items for your space.</p>
              </div>
            </>
          )}

          {/* what's already in the space */}
          {(tab === "furniture" || tab === "pets") && placements.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-black tracking-[0.2em] text-white/40">
                <LayoutGrid size={11} /> IN YOUR SPACE ({placements.length})
              </p>
              <div className="flex flex-wrap gap-1.5">
                {placements.map((p) => (
                  <button key={p.id} onClick={() => editInPlanner(p.id)} title="Edit position"
                    className="flex items-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.03] px-2.5 py-1.5 text-[10.5px] font-bold text-white/70 transition hover:border-lime-300/50 hover:text-white">
                    <span className="text-sm leading-none">{isPetKind(p.kind) ? PETS.find((q) => q.kind === p.kind)?.emoji : FURNITURE.find((f) => f.kind === p.kind)?.emoji}</span>
                    {isPetKind(p.kind) ? PETS.find((q) => q.kind === p.kind)?.name : FURNITURE.find((f) => f.kind === p.kind)?.name}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[9.5px] text-white/30">Tap any item to move, rotate, resize or remove it.</p>
            </div>
          )}

          {/* selected-in-3D quick editor */}
          {sel && (
            <div className="rounded-2xl border border-lime-300/35 bg-lime-300/[0.05] p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{isPetKind(sel.kind) ? PETS.find((p) => p.kind === sel.kind)?.emoji : FURNITURE.find((f) => f.kind === sel.kind)?.emoji}</span>
                <p className="min-w-0 flex-1 truncate text-[12px] font-bold text-white">
                  {isPetKind(sel.kind) ? PETS.find((p) => p.kind === sel.kind)?.name : FURNITURE.find((f) => f.kind === sel.kind)?.name}
                </p>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1 text-white/40 hover:text-white"><X size={14} /></button>
              </div>
              <button onClick={() => editInPlanner(sel.id)}
                className="mb-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-lime-300 py-2 text-[10.5px] font-black tracking-wider text-black hover:bg-lime-200">
                <Move size={12} /> OPEN FLOOR PLAN
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => rotateSelected(Math.PI / 8)} className="flex items-center justify-center gap-1 rounded-xl border border-white/12 py-2 text-[10px] font-bold text-white/65 hover:text-white">
                  <RotateCw size={12} /> Rotate
                </button>
                <button onClick={() => scaleSelected(0.12)} className="rounded-xl border border-white/12 py-2 text-[10px] font-bold text-white/65 hover:text-white">Size +</button>
                <button onClick={() => scaleSelected(-0.12)} className="rounded-xl border border-white/12 py-2 text-[10px] font-bold text-white/65 hover:text-white">Size −</button>
              </div>
              <button onClick={removeSelected} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-400/30 bg-red-500/10 py-2 text-[10.5px] font-black tracking-wider text-red-200 hover:bg-red-500/20">
                <Trash2 size={12} /> REMOVE FROM SCENE
              </button>
            </div>
          )}
        </div>

        {/* footer */}
        <div className="shrink-0 space-y-2 border-t border-white/10 bg-black/40 p-3">
          {placements.length > 0 && (
            <button onClick={clearAll} className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/12 py-2 text-[10px] font-bold text-white/45 hover:text-white">
              <Trash2 size={12} /> Clear all {placements.length} items
            </button>
          )}
          <button onClick={() => setOpen(false)} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-lime-300 py-3 text-[11px] font-black tracking-widest text-black transition hover:bg-lime-200">
            <Sparkles size={14} /> DONE
          </button>
          <p className="flex items-center justify-center gap-1 text-center text-[9px] text-white/25">
            <Lock size={9} /> Saved automatically to this device
          </p>
        </div>

        {/* toast */}
        {toast && (
          <div className="pointer-events-none absolute bottom-28 left-1/2 -translate-x-1/2 rounded-full border border-lime-300/40 bg-black/90 px-4 py-2 text-[11px] font-bold text-lime-200 shadow-2xl">
            {toast}
          </div>
        )}
      </aside>

      {/* top-down ground preview for placing / moving items */}
      <FloorPlanner />
    </div>
  );
}



