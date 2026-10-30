"use client";

import { memo, useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Pipette, X } from "lucide-react";
import { hexToHsl, hslToHex } from "@/lib/color";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/**
 * Full-spectrum color control.
 *  • The bar is a 0–360° hue gradient. Dragging maps pointer.x across the
 *    track width to hue = (x / w) · 360, so a slide sweeps the rainbow.
 *  • Tapping the swatch opens a wheel: a conic hue ring (angle = hue) plus a
 *    saturation/value square, and a hex field for exact codes.
 */
export const ColorSpectrum = memo(function ColorSpectrum({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
}) {
  const { h, s, l } = hexToHsl(value);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(value);
  const dragging = useRef(false);
  const lastHue = useRef(Math.round(h));

  useEffect(() => setHexDraft(value), [value]);

  // hue from a clientX position on the bar
  const hueFromX = useCallback((clientX: number) => {
    const el = barRef.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return clamp01((clientX - r.left) / r.width) * 360;
  }, []);

  const applyHue = useCallback(
    (hue: number) => {
      // keep the user's saturation/lightness, just rotate the hue
      const sat = s < 0.25 ? 0.7 : s;
      const light = l < 0.18 || l > 0.88 ? 0.62 : l;
      onChange(hslToHex({ h: hue, s: sat, l: light }));
      const tick = Math.round(hue / 20);
      if (tick !== lastHue.current) {
        lastHue.current = tick;
        haptic("selection"); // detent every ~20° of travel
      }
    },
    [s, l, onChange],
  );

  const onBarPointer = useCallback(
    (e: React.PointerEvent) => {
      applyHue(hueFromX(e.clientX));
    },
    [applyHue, hueFromX],
  );

  const commitHex = useCallback(
    (raw: string) => {
      const v = raw.startsWith("#") ? raw : `#${raw}`;
      if (HEX_RE.test(v)) {
        onChange(v.toLowerCase());
        haptic("success");
        return true;
      }
      return false;
    },
    [onChange],
  );

  const thumbPct = (h / 360) * 100;

  return (
    <div>
      <div className="flex items-center gap-2.5">
        {/* current color → opens the wheel */}
        <button
          type="button"
          onClick={() => {
            haptic("light");
            setWheelOpen(true);
          }}
          aria-label={`${label} — open color wheel`}
          className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white/70 shadow-inner ring-1 ring-black/10 outline-none focus-visible:ring-2 focus-visible:ring-mint-deep dark:border-white/20"
          style={{ background: value }}
        >
          <Pipette className="size-4 text-white mix-blend-difference" aria-hidden />
        </button>

        {/* hue spectrum bar */}
        <div className="min-w-0 flex-1">
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label={`${label} hue`}
            aria-valuemin={0}
            aria-valuemax={360}
            aria-valuenow={Math.round(h)}
            onPointerDown={(e) => {
              dragging.current = true;
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              haptic("light");
              onBarPointer(e);
            }}
            onPointerMove={(e) => {
              if (dragging.current) onBarPointer(e);
            }}
            onPointerUp={() => (dragging.current = false)}
            onPointerCancel={() => (dragging.current = false)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") applyHue((h - 6 + 360) % 360);
              if (e.key === "ArrowRight") applyHue((h + 6) % 360);
            }}
            className="relative h-9 w-full cursor-pointer touch-none rounded-full outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-mint-deep dark:ring-offset-graphite"
            style={{
              background:
                "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
            }}
          >
            <motion.span
              className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white shadow-md"
              style={{ left: `${thumbPct}%`, background: value }}
              animate={{ left: `${thumbPct}%` }}
              transition={{ type: "spring", stiffness: 520, damping: 40 }}
            />
          </div>
          <p className="mt-1 px-1 text-[9.5px] font-semibold text-ink/40 dark:text-snow/35">
            slide for any color · tap the dot for the wheel &amp; hex
          </p>
        </div>
      </div>

      {/* wheel + hex popover */}
      <AnimatePresence>
        {wheelOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="overflow-hidden"
          >
            <div className="surface-solid mt-2.5 rounded-[1.3rem] p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
                  color wheel
                </p>
                <button
                  type="button"
                  onClick={() => setWheelOpen(false)}
                  aria-label="Close color wheel"
                  className="flex size-7 cursor-pointer items-center justify-center rounded-full bg-ink/5 text-ink/50 outline-none dark:bg-white/10 dark:text-snow/50"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </div>

              <div className="mt-3 flex items-center gap-4">
                <Wheel hue={h} sat={s} light={l} onChange={onChange} />

                <div className="min-w-0 flex-1">
                  {/* lightness ramp for the active hue */}
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink/40 dark:text-snow/35">
                    shade
                  </p>
                  <div className="mt-1 flex gap-1">
                    {[0.28, 0.42, 0.55, 0.68, 0.82].map((ll) => {
                      const hex = hslToHex({ h, s: Math.max(0.35, s), l: ll });
                      return (
                        <button
                          key={ll}
                          type="button"
                          onClick={() => {
                            haptic("selection");
                            onChange(hex);
                          }}
                          aria-label={`Shade ${Math.round(ll * 100)}%`}
                          className="size-7 flex-1 cursor-pointer rounded-lg outline-none ring-offset-1 focus-visible:ring-2 focus-visible:ring-ink/40 dark:ring-offset-graphite"
                          style={{ background: hex }}
                        />
                      );
                    })}
                  </div>

                  {/* hex code entry */}
                  <p className="mt-3 text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink/40 dark:text-snow/35">
                    hex code
                  </p>
                  <div className="mt-1 flex gap-1.5">
                    <input
                      value={hexDraft}
                      onChange={(e) => setHexDraft(e.target.value.slice(0, 7))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitHex(hexDraft);
                      }}
                      onBlur={() => {
                        if (!commitHex(hexDraft)) setHexDraft(value);
                      }}
                      spellCheck={false}
                      aria-label="Hex color code"
                      placeholder="#7fe7bb"
                      className={cn(
                        "min-w-0 flex-1 rounded-xl border bg-transparent px-2.5 py-2 font-mono text-[12px] font-bold uppercase text-ink outline-none transition-colors dark:text-snow",
                        HEX_RE.test(hexDraft)
                          ? "border-ink/10 focus:border-mint-deep/60 dark:border-white/12"
                          : "border-red-400/60",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!commitHex(hexDraft)) setHexDraft(value);
                      }}
                      aria-label="Apply hex code"
                      className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-gradient-to-br from-mint to-mint-strong text-pine outline-none dark:from-grape dark:to-iris dark:text-white"
                    >
                      <Check className="size-4" aria-hidden />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

/**
 * Conic hue ring + inner saturation pad.
 * Ring: angle θ = atan2(dy, dx) → hue. Inner pad: radial distance sets
 * saturation, so the center is washed out and the rim is fully saturated.
 */
const Wheel = memo(function Wheel({
  hue,
  sat,
  light,
  onChange,
}: {
  hue: number;
  sat: number;
  light: number;
  onChange: (hex: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const down = useRef(false);
  const SIZE = 118;
  const R = SIZE / 2;

  const pick = useCallback(
    (clientX: number, clientY: number) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = clientX - (r.left + r.width / 2);
      const dy = clientY - (r.top + r.height / 2);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const h = (angle + 360 + 90) % 360; // 0° at 12 o'clock
      const dist = Math.min(1, Math.hypot(dx, dy) / (r.width / 2));
      onChange(
        hslToHex({
          h,
          s: Math.max(0.2, dist),
          l: light < 0.18 || light > 0.88 ? 0.6 : light,
        }),
      );
      haptic("selection");
    },
    [light, onChange],
  );

  // marker position: r = sat·R along the hue angle
  const rad = ((hue - 90) * Math.PI) / 180;
  const mx = R + Math.cos(rad) * sat * (R - 8);
  const my = R + Math.sin(rad) * sat * (R - 8);

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      aria-label="Color wheel"
      onPointerDown={(e) => {
        down.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        pick(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => down.current && pick(e.clientX, e.clientY)}
      onPointerUp={() => (down.current = false)}
      onPointerCancel={() => (down.current = false)}
      className="relative shrink-0 cursor-crosshair touch-none rounded-full shadow-inner outline-none ring-1 ring-black/10 focus-visible:ring-2 focus-visible:ring-mint-deep dark:ring-white/15"
      style={{
        width: SIZE,
        height: SIZE,
        background: `
          radial-gradient(circle at center, #fff 0%, rgba(255,255,255,0) 70%),
          conic-gradient(from 90deg, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)
        `,
      }}
    >
      <span
        className="pointer-events-none absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
        style={{ left: mx, top: my, background: hslToHex({ h: hue, s: sat, l: light }) }}
      />
    </div>
  );
});
