import { useEffect, useRef, useState } from "react";
import {
  X, Gem, Move, RotateCw, Trash2, Lock, Check, Search, LayoutGrid,
  Image as ImageIcon, Megaphone, Upload, Palette, Boxes, MousePointer2, Eye, ShoppingBag, CloudSun, Globe2, Box, Sparkles,
} from "lucide-react";
import { useSceneStore } from "./scene/store";
import {
  FURNITURE, PETS, WALL_ITEMS, WALLPAPERS, ADS, FLOOR_COVERINGS,
  furnitureDef, wallItemDef, isWallKind,
} from "./scene/data";
import {
  DIORAMA_THEMES, dioramaThemeById, isIndoorTheme, STAGE, CENTER_KEEP_OUT,
  WALL_COVERINGS, ACCENT_LIGHT_COLORS, accentLightColorById,
} from "./scene/diorama";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type Section = "shop" | "edit";
type Tab = "world" | "floor" | "walls" | "screens" | "background" | "owned" | "uploads";

export default function SceneEditor() {
  const open = useSceneStore((s) => s.editorOpen);
  const setOpen = useSceneStore((s) => s.setEditorOpen);
  const gems = useSceneStore((s) => s.gems);
  const placements = useSceneStore((s) => s.placements);
  const selectedId = useSceneStore((s) => s.selectedId);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const setGizmoMode = useSceneStore((s) => s.setGizmoMode);
  const dragKind = useSceneStore((s) => s.dragKind);
  const ownedFurniture = useSceneStore((s) => s.ownedFurniture);
  const ownedPets = useSceneStore((s) => s.ownedPets);
  const ownedWallItems = useSceneStore((s) => s.ownedWallItems);
  const buy = useSceneStore((s) => s.buy);
  const buyWallItem = useSceneStore((s) => s.buyWallItem);
  const removeSelected = useSceneStore((s) => s.removeSelected);
  const setSelected = useSceneStore((s) => s.setSelected);
  const setScreenConfig = useSceneStore((s) => s.setScreenConfig);
  const activeWorld = useSceneStore((s) => s.activeWorld);
  const setWorld = useSceneStore((s) => s.setWorld);
  const wallCoveringId = useSceneStore((s) => s.wallCoveringId);
  const setWallCovering = useSceneStore((s) => s.setWallCovering);
  const floorCoveringId = useSceneStore((s) => s.floorCoveringId);
  const setFloorCovering = useSceneStore((s) => s.setFloorCovering);
  const floorTextureUrl = useSceneStore((s) => s.floorTextureUrl);
  const setFloorTextureUrl = useSceneStore((s) => s.setFloorTextureUrl);
  const accentLightId = useSceneStore((s) => s.accentLightId);
  const accentLightsOn = useSceneStore((s) => s.accentLightsOn);
  const accentLightIntensity = useSceneStore((s) => s.accentLightIntensity);
  const setAccentLight = useSceneStore((s) => s.setAccentLight);
  const setAccentLightsOn = useSceneStore((s) => s.setAccentLightsOn);
  const setAccentLightIntensity = useSceneStore((s) => s.setAccentLightIntensity);
  const uploadedAssets = useSceneStore((s) => s.uploadedAssets);
  const uploadAsset = useSceneStore((s) => s.uploadAsset);
  const placeUploadedAsset = useSceneStore((s) => s.placeUploadedAsset);
  const setSelectedRotation = useSceneStore((s) => s.setSelectedRotation);
  const scaleSelected = useSceneStore((s) => s.scaleSelected);
  const nightMode = useSceneStore((s) => s.nightMode);
  const setNightMode = useSceneStore((s) => s.setNightMode);
  const setDrag = useSceneStore((s) => s.setDrag);

  const [section, setSection] = useState<Section>("edit");
  const [tab, setTab] = useState<Tab>("floor");
  const [q, setQ] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") { setSelected(null); }
      if (e.key === "w") setGizmoMode("translate");
      if (e.key === "e") setGizmoMode("rotate");
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) removeSelected();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, selectedId, removeSelected, setSelected, setGizmoMode]);

  if (!open) return null;

  const selected = placements.find((p) => p.id === selectedId) ?? null;
  const selScreen = selected?.type === "screen" ? selected : null;
  const rotationDeg = selected ? Math.round((((selected.rot * 180) / Math.PI) % 360 + 360) % 360) : 0;

  /** begins an HTML5 drag from the inventory */
  const beginDrag = (e: React.DragEvent, kind: string, type: "furniture" | "pet" | "screen") => {
    e.dataTransfer.setData("text/plain", kind);
    e.dataTransfer.effectAllowed = "copy";
    const wall = isWallKind(kind);
    setDrag({
      dragKind: kind,
      dragType: type,
      dragSurface: wall ? "wall" : "floor",
      dragX: wall ? 0 : 2.2,
      dragY: wall ? 1.7 : 0,
      dragZ: wall ? -STAGE.size / 2 + 0.4 : 2.2,
      dragRot: 0,
      dragWall: wall ? "back" : undefined,
    });
  };

  const endDrag = () => setDrag({ dragKind: null });

  const onUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      setPreviewUrl(url);
      if (selScreen) setScreenConfig(selScreen.id, { source: "upload", dataUrl: url });
    };
    reader.readAsDataURL(file);
  };

  const assetFileRef = useRef<HTMLInputElement>(null);
  const onAssetUpload = (file: File) => {
    const is3D = /\.(glb|gltf)$/i.test(file.name) || file.type.includes("model") || file.name.toLowerCase().endsWith(".glb") || file.name.toLowerCase().endsWith(".gltf");
    if (!is3D) {
      useSceneStore.getState().showToast("Upload a .glb or .gltf model");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadAsset(file.name, String(reader.result));
    reader.readAsDataURL(file);
  };

  const floorUploadRef = useRef<HTMLInputElement>(null);
  const onFloorUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      useSceneStore.getState().showToast("Upload an image (PNG / JPG / WebP)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFloorTextureUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const match = (s: string) => s.toLowerCase().includes(q.toLowerCase());
  const floorList = FURNITURE.filter((f) => match(f.name));
  const wallList = WALL_ITEMS.filter((w) => match(w.name));

  const Card = ({ kind, name, emoji, blurb, price, owned, type }: {
    kind: string; name: string; emoji: string; blurb: string; price: number; owned: boolean;
    type: "furniture" | "pet" | "screen";
  }) => (
    <div
      draggable={owned && section === "edit"}
      onDragStart={(e) => beginDrag(e, kind, type)}
      onDragEnd={endDrag}
      className={cn(
        "group rounded-lg border p-2.5 transition select-none",
        owned && section === "edit"
          ? "cursor-grab border-white/10 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.07] active:cursor-grabbing"
          : "border-white/8 bg-white/[0.02]"
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <span className="text-xl leading-none">{emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11.5px] font-semibold text-white">{name}</p>
          <p className="truncate text-[9.5px] leading-snug text-white/40">{blurb}</p>
        </div>
        {owned && <Check size={12} className="shrink-0 text-white/45" strokeWidth={2.5} />}
      </div>
      {section === "shop" ? (
        owned ? (
          <div className="rounded-md bg-white/[0.06] py-1.5 text-center text-[9.5px] font-semibold text-white/45">Owned</div>
        ) : (
          <button
            onClick={() => (type === "screen" ? buyWallItem(kind, price) : buy(kind as never, type, price))}
            className={cn("flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] font-semibold transition",
              gems >= price ? "bg-white/90 text-[#12161d] hover:bg-white" : "bg-white/8 text-white/35")}
          >
            <Gem size={11} /> {price}{gems >= price ? "" : ` · need ${price - gems}`}
          </button>
        )
      ) : owned ? (
        <div className="flex items-center justify-center gap-1.5 rounded-md bg-white/[0.07] py-1.5 text-[9.5px] font-semibold text-white/60 transition group-hover:bg-white/90 group-hover:text-[#12161d]">
          <Move size={11} /> Drag into room
        </div>
      ) : (
        <button onClick={() => setSection("shop")}
          className="w-full rounded-md border border-white/12 py-1.5 text-[9.5px] font-semibold text-white/40 hover:text-white/70">
          Buy in Shop
        </button>
      )}
    </div>
  );

  return (
    <div className="studio-font pointer-events-none absolute inset-0 z-[58]">
      {/* ===== TOP-LEFT: inventory ===== */}
      <aside className="pointer-events-auto absolute top-20 left-3 flex max-h-[calc(100vh-190px)] w-[268px] flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#080b12]/95 shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:left-4">
        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
              <Boxes size={15} className="text-white/85" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold leading-tight text-white">Scene</p>
              <p className="text-[10px] text-white/40">{section === "shop" ? "Buy furniture & pets" : "Arrange your space"}</p>
            </div>
            {section === "shop" && (
              <div className="flex shrink-0 items-center gap-1 rounded-md border border-white/12 bg-white/[0.05] px-2 py-1">
                <Gem size={11} className="text-white/60" />
                <span className="font-mono text-[11px] font-semibold text-white/85">{gems}</span>
              </div>
            )}
            {/* always-visible day/night switch */}
            <button
              onClick={() => setNightMode(!nightMode)}
              title={nightMode ? "Switch to day (sunlight)" : "Switch to night (room lights)"}
              className="flex shrink-0 items-center gap-1.5 rounded-md border border-white/12 bg-white/[0.05] px-2 py-1 transition hover:border-white/30"
            >
              {nightMode ? <Moon size={12} className="text-[#a9c1ff]" /> : <Sun size={12} className="text-amber-300" />}
              <span className="text-[10px] font-bold text-white/75">{nightMode ? "Night" : "Day"}</span>
            </button>
          </div>

          {/* SHOP / EDIT split */}
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/40 p-1">
            <button onClick={() => { setSection("shop"); setTab("floor"); }}
              className={cn("flex items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-semibold transition",
                section === "shop" ? "bg-white/90 text-[#12161d]" : "text-white/50 hover:bg-white/8 hover:text-white")}>
              <ShoppingBag size={12} /> Shop &amp; Pets
            </button>
            <button onClick={() => { setSection("edit"); setTab("world"); }}
              className={cn("flex items-center justify-center gap-1.5 rounded-md py-2 text-[11px] font-semibold transition",
                section === "edit" ? "bg-white/90 text-[#12161d]" : "text-white/50 hover:bg-white/8 hover:text-white")}>
              <Move size={12} /> Edit Space
            </button>
          </div>

          <div className="relative mt-2.5">
            <Search size={12} className="absolute top-1/2 left-2.5 -translate-y-1/2 text-white/30" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="w-full rounded-md border border-white/10 bg-white/[0.04] py-1.5 pr-2 pl-7 text-[11px] text-white outline-none placeholder:text-white/25 focus:border-white/30" />
          </div>
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 bg-black/25 px-2 py-2" style={{ scrollbarWidth: "none" }}>
          {(section === "shop"
            ? ([
              { id: "floor", label: "Furniture", icon: <LayoutGrid size={11} /> },
              { id: "walls", label: "Wall Art", icon: <ImageIcon size={11} /> },
            ] as const)
            : ([
              { id: "world", label: "World", icon: <Globe2 size={11} /> },
              { id: "floor", label: "Place", icon: <LayoutGrid size={11} /> },
              { id: "walls", label: "Walls", icon: <ImageIcon size={11} /> },
              { id: "screens", label: "Screens", icon: <Palette size={11} /> },
              { id: "background", label: "Walls & Lights", icon: <CloudSun size={11} /> },
              { id: "uploads", label: "Uploads", icon: <Box size={11} /> },
              { id: "owned", label: `In room ${placements.length}`, icon: <Eye size={11} /> },
            ] as const)
          ).map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex shrink-0 items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-medium transition",
                tab === t.id ? "bg-white/12 text-white" : "text-white/45 hover:bg-white/6 hover:text-white/80")}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          {tab === "world" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white"><Globe2 size={13} /> Diorama theme</p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                  Swapping a theme changes the floor, the cutaway walls and the animated skybox only — everything you've placed stays exactly where it is.
                </p>
              </div>

              <div className="space-y-2">
                {DIORAMA_THEMES.map((theme) => (
                  <button key={theme.id} onClick={() => setWorld(theme.id)}
                    className={cn("flex w-full items-center gap-3 overflow-hidden rounded-lg border p-2 text-left transition",
                      activeWorld === theme.id ? "border-white/70 bg-white/[0.08]" : "border-white/10 bg-white/[0.02] hover:border-white/30")}>
                    {/* theme swatch preview */}
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md" style={{ background: `linear-gradient(180deg,${theme.sky.top},${theme.sky.horizon})` }}>
                      <span className="absolute top-1 h-3 w-3 rounded-full" style={{ background: theme.sky.sun, right: theme.indoor ? "1.4rem" : "0.4rem" }} />
                      {theme.indoor && (
                        <>
                          <span className="absolute top-0 bottom-0 left-0 w-3" style={{ background: theme.wall }} />
                          <span className="absolute top-0 bottom-0 left-0 w-3 border-r" style={{ borderColor: theme.wallTrim }} />
                        </>
                      )}
                      <div className="absolute right-0 bottom-0 left-0 h-4" style={{ background: theme.floor }} />
                      <div className="absolute right-0 bottom-0 left-0 h-1.5" style={{ background: theme.floorAccent }} />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[11.5px] font-semibold text-white">{theme.icon} {theme.name}</span>
                      <span className="block text-[9.5px] leading-snug text-white/40">{theme.blurb}</span>
                      <span className={cn("mt-0.5 inline-block rounded px-1.5 py-0.5 text-[8px] font-semibold",
                        theme.indoor ? "bg-white/10 text-white/50" : "bg-[#59b8aa]/15 text-[#7fcec1]")}>
                        {theme.indoor ? "CUTAWAY WALLS" : "OPEN AIR"}
                      </span>
                    </span>
                    {activeWorld === theme.id && <Check size={13} className="shrink-0 text-white/80" />}
                  </button>
                ))}
              </div>

              {/* ---------- DAY / NIGHT ---------- */}
              <button onClick={() => setNightMode(!nightMode)}
                className={cn("flex w-full items-center gap-3 rounded-lg border p-3 text-left transition",
                  nightMode ? "border-[#7aa2ff]/60 bg-[#7aa2ff]/10" : "border-white/10 bg-white/[0.03] hover:border-white/30")}>
                <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  nightMode ? "bg-[#7aa2ff]/20 text-[#a9c1ff]" : "bg-white/10 text-white/70")}>
                  {nightMode ? <Moon size={16} /> : <Sun size={16} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[11.5px] font-semibold text-white">
                    {nightMode ? "Night mode — lights on" : "Day mode"}
                  </span>
                  <span className="block text-[9.5px] leading-snug text-white/40">
                    {nightMode
                      ? "The room lights up: ceiling panels, wall sconces and lamps."
                      : "Bright natural daylight. Switch to night to turn on the room lights."}
                  </span>
                </span>
                <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors",
                  nightMode ? "bg-[#7aa2ff]" : "bg-white/15")}>
                  <span className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all"
                    style={{ left: nightMode ? 18 : 2 }} />
                </span>
              </button>

              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="mb-1.5 text-[9px] font-semibold tracking-wide text-white/40">STAGE</p>
                <p className="font-mono text-[9.5px] leading-relaxed text-white/55">
                  {STAGE.size}m × {STAGE.size}m · {STAGE.cell}-metre snap grid<br />
                  centre keep-out radius {CENTER_KEEP_OUT}m (the athlete)
                </p>
              </div>

              {!dioramaThemeById(activeWorld).indoor && (
                <div className="rounded-lg border border-[#59b8aa]/25 bg-[#59b8aa]/[0.07] p-3 text-[10px] leading-relaxed text-white/55">
                  <span className="font-semibold text-[#7fcec1]">Open-air theme.</span> There are no walls here, so wall screens stay safely saved but hidden. Floor items and pets all work normally.
                </div>
              )}
            </div>
          )}

          {tab === "floor" && (
            <>
              <p className="flex items-center gap-1 text-[9px] font-bold text-white/30"><MousePointer2 size={9} /> Drag onto the floor around the athlete</p>
              <div className="grid grid-cols-2 gap-2">
                {floorList.map((f) => (
                  <Card key={f.kind} kind={f.kind} name={f.name} emoji={f.emoji} blurb={f.blurb} price={f.price}
                    owned={ownedFurniture.includes(f.kind)} type="furniture" />
                ))}
              </div>
              {PETS.some((p) => match(p.name)) && (
                <>
                  <p className="pt-1 text-[9px] font-black tracking-widest text-cyan-300/70">PETS</p>
                  <div className="grid grid-cols-2 gap-2">
                    {PETS.filter((p) => match(p.name)).map((p) => (
                      <Card key={p.kind} kind={p.kind} name={p.name} emoji={p.emoji} blurb={p.cheers[0]} price={p.price}
                        owned={ownedPets.includes(p.kind)} type="pet" />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {tab === "walls" && isIndoorTheme(activeWorld) && (
            <>
              <p className="flex items-center gap-1 text-[9px] font-bold text-white/30"><MousePointer2 size={9} /> Drag onto any wall — it snaps flat</p>
              <div className="grid grid-cols-2 gap-2">
                {wallList.map((w) => (
                  <Card key={w.kind} kind={w.kind} name={w.name} emoji={w.emoji} blurb={w.blurb} price={w.price}
                    owned={ownedWallItems.includes(w.kind)} type="screen" />
                ))}
              </div>
              <div className="rounded-lg border border-white/10 bg-black/25 p-3">
                <p className="text-[9px] font-semibold tracking-wide text-white/40">CUTAWAY WALLS</p>
                <p className="mt-0.5 text-[10px] leading-relaxed text-white/40">
                  Only the back and left walls are built, so the isometric camera always sees in. Screens snap onto either of them.
                </p>
              </div>
            </>
          )}

          {tab === "walls" && !isIndoorTheme(activeWorld) && (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-center">
              <Globe2 size={22} className="mx-auto mb-2 text-white/25" />
              <p className="text-[11px] font-semibold text-white/60">This theme has no walls</p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">Pick <span className="font-semibold text-white/60">Bedroom</span> or <span className="font-semibold text-white/60">Garage Gym</span> in the World tab to place TVs, posters and mirrors.</p>
            </div>
          )}

          {tab === "screens" && selScreen && (
            <>
              <p className="text-[9px] font-black tracking-widest text-white/35">SELECTED: {wallItemDef(selScreen.kind)?.name?.toUpperCase()}</p>
              <div className="space-y-2">
                <p className="flex items-center gap-1 text-[9.5px] font-black tracking-wider text-white/45"><ImageIcon size={11} /> WALLPAPER</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {WALLPAPERS.map((w) => (
                    <button key={w.id} onClick={() => setScreenConfig(selScreen.id, { source: "wallpaper", wallpaperId: w.id })}
                      className={cn("rounded-xl border p-1.5 transition", selScreen.screen?.wallpaperId === w.id && selScreen.screen?.source === "wallpaper"
                        ? "border-lime-300/60 bg-lime-300/10" : "border-white/12 hover:border-white/30")}>
                      <div className="mb-1 h-8 rounded-lg" style={{ background: `linear-gradient(135deg,${w.from},${w.to})` }} />
                      <p className="text-center text-[8.5px] font-bold text-white/60">{w.emoji} {w.name}</p>
                    </button>
                  ))}
                </div>

                <p className="flex items-center gap-1 pt-1 text-[9.5px] font-black tracking-wider text-white/45"><Upload size={11} /> YOUR IMAGE</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onUpload(f); }} />
                <button onClick={() => fileRef.current?.click()}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-lime-300/40 py-2.5 text-[10px] font-black tracking-wider text-lime-200 hover:bg-lime-300/10">
                  <Upload size={12} /> UPLOAD PHOTO
                </button>
                {previewUrl && (
                  <div className="overflow-hidden rounded-xl border border-white/12">
                    <img src={previewUrl} alt="preview" className="h-24 w-full object-cover" />
                  </div>
                )}

                <p className="flex items-center gap-1 pt-1 text-[9.5px] font-black tracking-wider text-white/45"><Megaphone size={11} /> RUN AN AD</p>
                <div className="space-y-1.5">
                  {ADS.map((a) => (
                    <button key={a.id} onClick={() => setScreenConfig(selScreen.id, { source: "ad", adId: a.id })}
                      className={cn("flex w-full items-center gap-2 rounded-xl border p-2 text-left transition",
                        selScreen.screen?.adId === a.id && selScreen.screen?.source === "ad"
                          ? "border-lime-300/60 bg-lime-300/10" : "border-white/12 hover:border-white/30")}>
                      <span className="h-7 w-7 shrink-0 rounded-lg" style={{ background: `linear-gradient(135deg,${a.from},${a.to})` }} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10.5px] font-bold text-white">{a.headline}</span>
                        <span className="block truncate text-[9px] text-white/40">{a.brand}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === "screens" && !selScreen && (
            <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
              <ImageIcon size={24} className="mx-auto mb-2 text-white/20" />
              <p className="text-[11px] font-bold text-white/50">No screen selected</p>
              <p className="mt-1 text-[10px] leading-relaxed text-white/35">
                Drag a <span className="font-bold text-lime-300">Big Screen TV</span> or <span className="font-bold text-lime-300">Poster Board</span> from the Walls tab onto a wall, then click it to customise what it displays.
              </p>
            </div>
          )}

          {tab === "background" && (
            <div className="space-y-3">
              {/* ---------- ACCENT LIGHTING ---------- */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="flex items-start gap-2">
                  <span
                    className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: accentLightsOn ? `${accentLightColorById(accentLightId).hex}22` : "rgba(255,255,255,0.06)",
                      boxShadow: accentLightsOn ? `0 0 14px ${accentLightColorById(accentLightId).hex}55` : "none",
                    }}
                  >
                    <Sparkles size={15} style={{ color: accentLightsOn ? accentLightColorById(accentLightId).hex : "rgba(255,255,255,0.45)" }} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white">Accent lights</p>
                    <p className="mt-0.5 text-[9.5px] leading-snug text-white/40">
                      Neon strips on the wall corners, wall edges and the whole platform rim.
                    </p>
                  </div>
                  <button
                    onClick={() => setAccentLightsOn(!accentLightsOn)}
                    className={cn("relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors",
                      accentLightsOn ? "bg-lime-300" : "bg-white/15")}
                  >
                    <span
                      className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all"
                      style={{ left: accentLightsOn ? 18 : 2 }}
                    />
                  </button>
                </div>

                {accentLightsOn && (
                  <>
                    <div className="mt-3 grid grid-cols-4 gap-1.5">
                      {ACCENT_LIGHT_COLORS.map((c) => {
                        const active = accentLightId === c.id;
                        return (
                          <button
                            key={c.id}
                            onClick={() => setAccentLight(c.id)}
                            title={c.name}
                            className={cn("group relative flex h-11 items-center justify-center rounded-lg border transition",
                              active ? "border-white/70" : "border-white/10 hover:border-white/35")}
                            style={{
                              background: `linear-gradient(145deg, ${c.hex}33, ${c.hex}12)`,
                              boxShadow: active ? `0 0 16px ${c.hex}70` : "none",
                            }}
                          >
                            <span
                              className="h-5 w-5 rounded-full"
                              style={{ background: c.hex, boxShadow: `0 0 10px ${c.hex}` }}
                            />
                            {active && (
                              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-black">
                                <Check size={9} strokeWidth={4} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-2 text-center text-[9.5px] font-semibold" style={{ color: accentLightColorById(accentLightId).hex }}>
                      {accentLightColorById(accentLightId).name}
                    </p>

                    <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2">
                      <div className="mb-1.5 flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-white/45">Brightness</span>
                        <span className="font-mono text-[10px] font-semibold text-white/80">
                          {Math.round(accentLightIntensity * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0.2}
                        max={2}
                        step={0.05}
                        value={accentLightIntensity}
                        onChange={(e) => setAccentLightIntensity(Number(e.target.value))}
                        className="w-full"
                        style={{ accentColor: accentLightColorById(accentLightId).hex }}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* ---------- FLOOR COVERING ---------- */}
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                  <LayoutGrid size={13} /> Floor finish
                </p>
                <p className="mt-1 text-[9.5px] leading-snug text-white/40">Choose a floor material, or upload your own artwork. Applies instantly and saves with the room.</p>

                <div className="mt-2 grid grid-cols-2 gap-2">
                  {/* Theme default */}
                  <button
                    onClick={() => setFloorCovering("theme")}
                    className={cn(
                      "group overflow-hidden rounded-lg border text-left transition",
                      floorCoveringId === "theme" || !floorCoveringId
                        ? "border-cyan-300/70 bg-cyan-300/[0.08]"
                        : "border-white/10 bg-white/[0.02] hover:border-white/30"
                    )}>
                    <div className="h-16" style={{ background: `linear-gradient(135deg, ${dioramaThemeById(activeWorld).floor}, ${dioramaThemeById(activeWorld).floorAccent})` }}>
                      {(floorCoveringId === "theme" || !floorCoveringId) && (
                        <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300 text-black">
                          <Check size={11} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="bg-black/35 px-2 py-1.5">
                      <p className="text-[10px] font-bold text-white">Current theme</p>
                      <p className="text-[8.5px] text-white/40">Matches the diorama</p>
                    </div>
                  </button>

                  {FLOOR_COVERINGS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setFloorCovering(c.id)}
                      className={cn(
                        "group overflow-hidden rounded-lg border text-left transition",
                        floorCoveringId === c.id
                          ? "border-cyan-300/70 bg-cyan-300/[0.08]"
                          : "border-white/10 bg-white/[0.02] hover:border-white/30"
                      )}>
                      <div className="relative h-16 overflow-hidden" style={{ background: c.preview }}>
                        {floorCoveringId === c.id && (
                          <span className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300 text-black">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        )}
                        <span className="absolute bottom-1.5 left-1.5 text-lg">{c.emoji}</span>
                      </div>
                      <div className="min-h-[44px] bg-black/35 px-2 py-1.5">
                        <p className="text-[10px] font-bold text-white">{c.name}</p>
                        <p className="truncate text-[8.5px] text-white/40">{c.blurb}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <input ref={floorUploadRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onFloorUpload(f); }} />
                <button
                  onClick={() => floorUploadRef.current?.click()}
                  className={cn(
                    "mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed py-2 text-[10px] font-semibold transition",
                    floorCoveringId === "upload"
                      ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-200"
                      : "border-white/20 bg-white/[0.03] text-white/80 hover:bg-white/[0.06]"
                  )}>
                  <Upload size={12} /> Upload your own artwork
                </button>

                {floorCoveringId === "upload" && floorTextureUrl && (
                  <div className="mt-2 overflow-hidden rounded-lg border border-cyan-300/30">
                    <img src={floorTextureUrl} alt="floor" className="h-24 w-full object-cover" />
                    <div className="bg-black/45 px-2 py-1.5 text-[8.5px] text-cyan-200">Custom artwork applied to the floor</div>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white">
                  <CloudSun size={13} /> Wall wallpaper
                </p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                  Pick a prebuilt finish for both cutaway walls. Changes appear instantly and save with your space.
                </p>
              </div>

              {!isIndoorTheme(activeWorld) ? (
                <div className="rounded-lg border border-violet-400/25 bg-violet-500/[0.08] p-4 text-center">
                  <Globe2 size={22} className="mx-auto mb-2 text-violet-300" />
                  <p className="text-[11px] font-semibold text-white/75">Wallpapers need an indoor theme</p>
                  <p className="mt-1 text-[10px] leading-relaxed text-white/40">
                    Choose Bedroom or Garage Gym in the World tab. Your wallpaper stays saved when you go outdoors.
                  </p>
                  <button
                    onClick={() => setTab("world")}
                    className="mt-3 rounded-md bg-violet-500 px-3 py-1.5 text-[10px] font-bold text-white hover:bg-violet-400"
                  >
                    Choose indoor world
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {WALL_COVERINGS.map((wallpaper) => {
                    const selectedWallpaper = wallCoveringId === wallpaper.id;
                    return (
                      <button
                        key={wallpaper.id}
                        onClick={() => setWallCovering(wallpaper.id)}
                        className={cn(
                          "group overflow-hidden rounded-lg border text-left transition",
                          selectedWallpaper
                            ? "border-lime-300/70 bg-lime-300/[0.08] shadow-[0_0_18px_rgba(198,255,46,0.18)]"
                            : "border-white/10 bg-white/[0.02] hover:border-white/30"
                        )}
                      >
                        <div className="relative h-20 overflow-hidden" style={{ background: wallpaper.preview }}>
                          {/* These overlays make simple CSS cards read closer to the procedural 3D texture. */}
                          {wallpaper.pattern === "grid" && (
                            <span
                              className="absolute inset-0 opacity-40"
                              style={{
                                backgroundImage: `linear-gradient(${wallpaper.accent}55 1px,transparent 1px),linear-gradient(90deg,${wallpaper.accent}55 1px,transparent 1px)`,
                                backgroundSize: "16px 16px",
                              }}
                            />
                          )}
                          {wallpaper.pattern === "slats" && (
                            <span className="absolute inset-0" style={{ background: wallpaper.preview }} />
                          )}
                          {wallpaper.pattern === "terrazzo" && (
                            <span
                              className="absolute inset-0 opacity-80"
                              style={{
                                backgroundImage: `radial-gradient(${wallpaper.accent} 2px,transparent 3px),radial-gradient(${wallpaper.accent2} 2px,transparent 3px),radial-gradient(#c6ff2e 1px,transparent 2px)`,
                                backgroundPosition: "0 0,12px 10px,6px 18px",
                                backgroundSize: "28px 26px",
                              }}
                            />
                          )}
                          {selectedWallpaper && (
                            <span className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-lime-300 text-black shadow-[0_0_12px_rgba(198,255,46,0.55)]">
                              <Check size={13} strokeWidth={3} />
                            </span>
                          )}
                        </div>
                        <div className="min-h-[54px] bg-black/35 px-2.5 py-2">
                          <p className={cn("text-[10.5px] font-bold", selectedWallpaper ? "text-lime-300" : "text-white")}>{wallpaper.name}</p>
                          <p className="mt-0.5 line-clamp-2 text-[8.5px] leading-snug text-white/40">{wallpaper.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {tab === "uploads" && (
            <div className="space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-white"><Box size={13} /> Upload your own 3D object</p>
                <p className="mt-1 text-[10px] leading-relaxed text-white/40">Open marketplace: upload any GLB/GLTF model, save it permanently, then drag it into your space like a normal item.</p>
              </div>
              <input ref={assetFileRef} type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) onAssetUpload(f); }} />
              <button onClick={() => assetFileRef.current?.click()}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/20 bg-white/[0.03] py-3 text-[10.5px] font-semibold text-white/80 hover:bg-white/[0.06]">
                <Upload size={12} /> Upload .glb / .gltf
              </button>
              {uploadedAssets.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/12 p-5 text-center text-[10px] text-white/35">No custom objects yet.</div>
              ) : (
                <div className="space-y-2">
                  {uploadedAssets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
                      <span className="text-lg">{asset.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold text-white">{asset.name}</p>
                        <p className="text-[9px] text-white/35">Uploaded model</p>
                      </div>
                      <button onClick={() => placeUploadedAsset(asset.id)}
                        className="rounded-md bg-white/90 px-2.5 py-1.5 text-[9.5px] font-semibold text-[#12161d] hover:bg-white">
                        Place
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === "owned" && (
            <>
              {placements.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center">
                  <p className="text-[11px] font-bold text-white/50">Nothing placed yet</p>
                  <p className="mt-1 text-[10px] text-white/35">Drag an item into the room to get started.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {placements.map((p) => (
                    <button key={p.id} onClick={() => setSelected(p.id)}
                      className={cn("flex w-full items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                        p.id === selectedId ? "border-lime-300/60 bg-lime-300/10" : "border-white/12 hover:border-white/30")}>
                      <span className="text-base leading-none">
                        {p.type === "screen" ? wallItemDef(p.kind)?.emoji : furnitureDef(p.kind as never)?.emoji ?? "🐾"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-bold text-white">
                          {p.type === "screen" ? wallItemDef(p.kind)?.name : furnitureDef(p.kind as never)?.name ?? "Pet"}
                        </span>
                        <span className="block font-mono text-[8.5px] text-white/35">
                          {p.surface === "wall" ? `WALL ${p.wall ?? ""} · y${p.y.toFixed(1)}` : `FLOOR · x${p.x.toFixed(1)} z${p.z.toFixed(1)}`}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ===== BOTTOM-CENTRE: the arrange toolbar (always available) ===== */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
        <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#12161d]/95 p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          {/* mode switch */}
          <div className="flex gap-1 rounded-xl bg-black/50 p-1">
            <button onClick={() => setGizmoMode("translate")}
              title="Move things around (W)"
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition",
                gizmoMode === "translate" ? "bg-lime-300 text-black shadow-[0_0_16px_rgba(198,255,46,0.45)]" : "text-white/55 hover:bg-white/10 hover:text-white")}>
              <Move size={13} /> Move
            </button>
            <button onClick={() => setGizmoMode("rotate")}
              title="Rotate things (E)"
              className={cn("flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-bold transition",
                gizmoMode === "rotate" ? "bg-violet-500 text-white shadow-[0_0_16px_rgba(139,92,246,0.5)]" : "text-white/55 hover:bg-white/10 hover:text-white")}>
              <RotateCw size={13} /> Rotate
            </button>
          </div>

          {/* selection-aware controls */}
          {selected ? (
            <>
              <span className="hidden max-w-[130px] truncate px-1 text-[11px] font-semibold text-white/80 sm:block">
                {selected.type === "screen" ? wallItemDef(selected.kind)?.name : furnitureDef(selected.kind as never)?.name ?? "Pet"}
              </span>

              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-black/30 px-2.5 py-1.5">
                <span className="text-[9px] font-semibold text-white/40">SIZE</span>
                <button onClick={() => scaleSelected(-0.12)} title="Smaller"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] text-[13px] font-bold text-white/70 hover:bg-white/15 hover:text-white">−</button>
                <span className="w-8 text-center font-mono text-[10px] font-semibold text-white/75">{selected.scale.toFixed(2)}</span>
                <button onClick={() => scaleSelected(0.12)} title="Bigger"
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-white/[0.07] text-[13px] font-bold text-white/70 hover:bg-white/15 hover:text-white">+</button>
              </div>

              {gizmoMode === "rotate" && (
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/30 px-2 py-1.5">
                  <button onClick={() => setSelectedRotation((((rotationDeg - 15 + 360) % 360) * Math.PI) / 180)}
                    className="rounded-md bg-white/[0.07] px-2 py-1 text-[9.5px] font-semibold text-white/60 hover:bg-white/15 hover:text-white">−15°</button>
                  <span className="w-9 text-center font-mono text-[10px] font-semibold text-white/80">{rotationDeg}°</span>
                  <button onClick={() => setSelectedRotation((((rotationDeg + 15) % 360) * Math.PI) / 180)}
                    className="rounded-md bg-white/[0.07] px-2 py-1 text-[9.5px] font-semibold text-white/60 hover:bg-white/15 hover:text-white">+15°</button>
                  <button onClick={() => setSelectedRotation(0)}
                    className="rounded-md bg-white/[0.07] px-2 py-1 text-[9.5px] font-semibold text-white/60 hover:bg-white/15 hover:text-white">Reset</button>
                </div>
              )}

              <button onClick={removeSelected} title="Delete selection (Del)"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/25 bg-red-500/10 text-red-200/90 transition hover:bg-red-500/20">
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <span className="px-1 text-[10.5px] text-white/40">
              {gizmoMode === "translate" ? "Drag any item to move it" : "Drag the ring to rotate · or fine-tune above"}
            </span>
          )}

          {/* exit — closes the editor, scene auto-saves */}
          <button onClick={() => setOpen(false)}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-[11px] font-bold text-white/80 transition hover:bg-white/20 hover:text-white">
            <X size={13} strokeWidth={2.5} /> Close
          </button>
        </div>
      </div>

      {/* ===== drop hint while dragging ===== */}
      {dragKind && (
        <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
          <div className="flex items-center gap-2 rounded-full border border-lime-300/50 bg-black/90 px-4 py-2 text-[11px] font-black tracking-wide text-lime-200 shadow-2xl">
            <Move size={14} /> DROP TO PLACE — {isWallKind(dragKind) ? "AIM AT A WALL" : "AIM AT THE FLOOR"}
          </div>
        </div>
      )}

      {/* first-time coach mark */}
      <SceneHint />
    </div>
  );
}

function SceneHint() {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 7000);
    return () => clearTimeout(t);
  }, []);
  if (!show) return null;
  return (
    <div className="pointer-events-auto absolute bottom-24 left-1/2 hidden -translate-x-1/2 items-center gap-2.5 rounded-2xl border border-white/12 bg-black/80 px-4 py-2.5 backdrop-blur-xl md:flex">
      <Lock size={13} className="shrink-0 text-lime-300" />
      <p className="text-[11px] font-semibold text-white/70">
        Drag an item from the left panel into the room · <kbd className="rounded bg-white/10 px-1 font-bold">W</kbd> move ·
        <kbd className="ml-1 rounded bg-white/10 px-1 font-bold">E</kbd> rotate ·
        <kbd className="ml-1 rounded bg-white/10 px-1 font-bold">Del</kbd> delete
      </p>
      <button onClick={() => setShow(false)} className="text-white/40 hover:text-white">✕</button>
    </div>
  );
}



