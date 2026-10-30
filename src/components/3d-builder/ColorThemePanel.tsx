import { X, Palette, Moon, Sun, Sparkles, Shirt, User, Check } from "lucide-react";
import { usePushupStore, SKIN_TONES, SHIRT_COLORS, SHORTS_COLORS } from "./store";
import { useSceneStore } from "./scene/store";
import { ACCENT_LIGHT_COLORS, accentLightColorById } from "./scene/diorama";
import { SCENE_STYLES } from "./scene/style";
import { cn } from "@/lib/utils";

type ThemeId = "gamer" | "pastel";

const THEMES: { id: ThemeId; name: string; tagline: string; swatch: string; ring: string }[] = [
  {
    id: "gamer",
    name: "Gamified Premium",
    tagline: "Neon lime · violet · flame on deep black",
    swatch: "linear-gradient(135deg,#c6ff2e 0%,#ffc93c 45%,#ff4d2e 72%,#8b5cf6 100%)",
    ring: "#c6ff2e",
  },
  {
    id: "pastel",
    name: "Pastel Studio",
    tagline: "Soft peach · sky · lilac on deep plum",
    swatch: "linear-gradient(135deg,#f7c8d0 0%,#c7b3e8 45%,#9bd8df 75%,#f6d98a 100%)",
    ring: "#c7b3e8",
  },
];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[9px] font-bold tracking-[0.18em] text-white/40">{label}</p>
      {children}
    </div>
  );
}

function Swatch({ hex, active, onClick, title }: { hex: string; active: boolean; onClick: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-xl border-2 transition",
        active ? "scale-110 border-white" : "border-white/15 hover:scale-105 hover:border-white/40"
      )}
      style={{ background: hex }}
    >
      {active && <Check size={14} strokeWidth={3.5} className="text-black drop-shadow" />}
    </button>
  );
}

export default function ColorThemePanel() {
  const open = usePushupStore((s) => s.colorPanelOpen);
  const setOpen = usePushupStore((s) => s.setColorPanelOpen);
  const uiTheme = usePushupStore((s) => s.uiTheme);
  const setUiTheme = usePushupStore((s) => s.setUiTheme);

  const skinTone = usePushupStore((s) => s.skinTone);
  const setSkinTone = usePushupStore((s) => s.setSkinTone);
  const shirtColor = usePushupStore((s) => s.shirtColor);
  const setShirtColor = usePushupStore((s) => s.setShirtColor);
  const shortsColor = usePushupStore((s) => s.shortsColor);
  const setShortsColor = usePushupStore((s) => s.setShortsColor);

  const nightMode = useSceneStore((s) => s.nightMode);
  const setNightMode = useSceneStore((s) => s.setNightMode);
  const styleId = useSceneStore((s) => s.styleId);
  const setStyleId = useSceneStore((s) => s.setStyleId);
  const accentLightId = useSceneStore((s) => s.accentLightId);
  const accentLightsOn = useSceneStore((s) => s.accentLightsOn);
  const setAccentLight = useSceneStore((s) => s.setAccentLight);
  const setAccentLightsOn = useSceneStore((s) => s.setAccentLightsOn);

  if (!open) return null;
  const accent = accentLightColorById(accentLightId);

  return (
    <div
      className="pointer-events-auto fixed inset-0 z-[70] flex justify-end bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <aside
        onClick={(e) => e.stopPropagation()}
        className="studio-font flex h-full w-full max-w-sm flex-col border-l border-white/12 bg-[#0c0c12]/97 shadow-[-24px_0_70px_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        {/* header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-5 py-4">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-300 via-yellow-300 to-violet-500 text-black">
            <Palette size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[15px] font-bold leading-tight text-white">Color Studio</h2>
            <p className="text-[10.5px] text-white/45">Theme, room lights &amp; athlete outfit</p>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-xl border border-white/15 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-5 py-5">
          {/* ---------- UI THEME ---------- */}
          <section>
            <Row label="INTERFACE THEME">
              <div className="space-y-2">
                {THEMES.map((t) => {
                  const active = uiTheme === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setUiTheme(t.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition",
                        active ? "bg-white/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/30"
                      )}
                      style={active ? { borderColor: t.ring, boxShadow: `0 0 20px ${t.ring}33` } : undefined}
                    >
                      <span
                        className="h-11 w-16 shrink-0 rounded-lg border border-white/15"
                        style={{ background: t.swatch }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12.5px] font-bold text-white">{t.name}</span>
                        <span className="block text-[9.5px] leading-snug text-white/40">{t.tagline}</span>
                      </span>
                      {active && (
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-black"
                          style={{ background: t.ring }}
                        >
                          <Check size={11} strokeWidth={4} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Row>
          </section>

          {/* ---------- STUDIO STYLE ---------- */}
          <section>
            <Row label="3D STUDIO STYLE">
              <div className="space-y-2">
                {SCENE_STYLES.map((s) => {
                  const active = styleId === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStyleId(s.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition",
                        active ? "bg-white/[0.07]" : "border-white/10 bg-white/[0.02] hover:border-white/30"
                      )}
                      style={active ? { borderColor: "var(--ml-lime)", boxShadow: "0 0 18px var(--ml-lime-glow)" } : undefined}
                    >
                      <span
                        className="h-10 w-12 shrink-0 rounded-lg border border-white/15"
                        style={{ background: s.swatch }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[12px] font-bold text-white">
                          {s.emoji} {s.name}
                        </span>
                        <span className="block text-[9.5px] leading-snug text-white/40">{s.tagline}</span>
                      </span>
                      {active && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-lime-300 text-black">
                          <Check size={11} strokeWidth={4} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-[9.5px] leading-snug text-white/30">
                Restyles the whole 3D room — shading, materials, lighting balance and atmosphere. Your wallpaper, furniture and pets are kept.
              </p>
            </Row>
          </section>

          {/* ---------- ROOM LIGHTS ---------- */}
          <section className="space-y-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-white/70">
                {nightMode ? <Moon size={14} /> : <Sun size={14} />}
              </span>
              <p className="flex-1 text-[12px] font-bold text-white">Room ambience</p>
              <button
                onClick={() => setNightMode(!nightMode)}
                className={cn("relative h-5 w-9 rounded-full transition-colors", nightMode ? "bg-violet-400" : "bg-white/15")}
              >
                <span className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: nightMode ? 18 : 2 }} />
              </button>
            </div>
            <p className="text-[10px] leading-snug text-white/40">
              {nightMode ? "Night is on — the room lights are lit." : "Day mode. Toggle to dim the world and switch the lights on."}
            </p>

            <div className="flex items-center gap-2 border-t border-white/10 pt-3">
              <Sparkles size={14} style={{ color: accentLightsOn ? accent.hex : "rgba(255,255,255,0.35)" }} />
              <p className="flex-1 text-[12px] font-bold text-white">Accent lights</p>
              <button
                onClick={() => setAccentLightsOn(!accentLightsOn)}
                className={cn("relative h-5 w-9 rounded-full transition-colors", accentLightsOn ? "bg-lime-300" : "bg-white/15")}
              >
                <span className="absolute top-[2px] h-4 w-4 rounded-full bg-white shadow transition-all" style={{ left: accentLightsOn ? 18 : 2 }} />
              </button>
            </div>

            {accentLightsOn && (
              <>
                <div className="grid grid-cols-8 gap-1.5">
                  {ACCENT_LIGHT_COLORS.map((c) => {
                    const active = accentLightId === c.id;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setAccentLight(c.id)}
                        title={c.name}
                        className={cn(
                          "flex h-8 items-center justify-center rounded-lg border transition",
                          active ? "border-white/80" : "border-white/10 hover:border-white/40"
                        )}
                        style={{ background: `${c.hex}2e`, boxShadow: active ? `0 0 14px ${c.hex}80` : "none" }}
                      >
                        <span className="h-4 w-4 rounded-full" style={{ background: c.hex, boxShadow: `0 0 8px ${c.hex}` }} />
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-[9.5px] font-semibold" style={{ color: accent.hex }}>
                  {accent.name}
                </p>
              </>
            )}
          </section>

          {/* ---------- ATHLETE OUTFIT ---------- */}
          <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2">
              <Shirt size={15} className="text-white/60" />
              <p className="text-[12px] font-bold text-white">Athlete outfit</p>
            </div>

            <Row label="SHIRT">
              <div className="flex flex-wrap gap-2">
                {SHIRT_COLORS.map((c) => (
                  <Swatch key={c} hex={c} active={shirtColor === c} onClick={() => setShirtColor(c)} />
                ))}
              </div>
            </Row>

            <Row label="SHORTS">
              <div className="flex flex-wrap gap-2">
                {SHORTS_COLORS.map((c) => (
                  <Swatch key={c} hex={c} active={shortsColor === c} onClick={() => setShortsColor(c)} />
                ))}
              </div>
            </Row>

            <Row label="SKIN TONE">
              <div className="flex flex-wrap gap-2">
                {SKIN_TONES.map((c) => (
                  <Swatch key={c} hex={c} active={skinTone === c} onClick={() => setSkinTone(c)} />
                ))}
              </div>
            </Row>

            <p className="flex items-center gap-1.5 text-[9.5px] text-white/30">
              <User size={11} /> Applies to the 3D athlete instantly.
            </p>
          </section>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-black/40 p-4">
          <button
            onClick={() => setOpen(false)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 py-3 text-[11.5px] font-bold tracking-wide text-black transition hover:bg-lime-200"
          >
            <Check size={15} strokeWidth={3} /> Apply &amp; Close
          </button>
          <p className="mt-2 text-center text-[9.5px] text-white/30">Changes apply live and are saved automatically.</p>
        </div>
      </aside>
    </div>
  );
}



