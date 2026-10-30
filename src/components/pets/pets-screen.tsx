"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, Dumbbell, HandHeart, BadgeCheck, Rotate3d } from "lucide-react";
import { usePetStore, xpForLevel } from "@/stores/pet-store";
import { useUiStore } from "@/stores/ui-store";
import { Pet3D } from "./pet-3d";
import { CustomPetStage } from "./custom-pet-stage";
import { XpRing } from "./xp-ring";
import { haptic } from "@/lib/haptics";

type Floater = { id: number; amount: number; x: number };

const PERSONALITY_TAGS: Record<string, string> = {
  playful: "zoomies at 7am",
  zen: "inner peace pending",
  fierce: "PRs fear them",
  goofy: "cardio? never met her",
};

const ACTIONS = [
  { key: "treat", label: "Treat", xp: 10, icon: Cookie },
  { key: "train", label: "Train", xp: 15, icon: Dumbbell },
  { key: "cuddle", label: "Cuddle", xp: 5, icon: HandHeart },
] as const;

let floaterId = 0;

export function PetsScreen() {
  // Narrow selectors — each component subscribing here only re-renders when
  // its slice changes (Zustand equality on primitives).
  const name = usePetStore((s) => s.name);
  const color = usePetStore((s) => s.color);
  const customFur = usePetStore((s) => s.customFur);
  const customPetAssetId = usePetStore((s) => s.customPetAssetId);
  const customPetKind = usePetStore((s) => s.customPetKind);
  const accessory = usePetStore((s) => s.accessory);
  const personality = usePetStore((s) => s.personality);
  const bio = usePetStore((s) => s.bio);
  const xp = usePetStore((s) => s.xp);
  const level = usePetStore((s) => s.level);
  const xpIntoLevel = usePetStore((s) => s.xpIntoLevel);
  const pulses = usePetStore((s) => s.pulses);
  const gainXp = usePetStore((s) => s.gainXp);
  const pushToast = useUiStore((s) => s.pushToast);

  const [hydrated, setHydrated] = useState(false);
  const [spinSignal, setSpinSignal] = useState(0);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const cooldown = useRef(false);
  useEffect(() => setHydrated(true), []);

  const reward = useCallback(
    (amount: number) => {
      if (cooldown.current) return; // throttle taps so spam can't outrun the spring
      cooldown.current = true;
      setTimeout(() => (cooldown.current = false), 700);

      const res = gainXp(amount);
      haptic(res.leveledUp ? "success" : "light");

      const f: Floater = { id: ++floaterId, amount, x: Math.random() * 90 - 45 };
      setFloaters((cur) => [...cur.slice(-5), f]);
      setTimeout(() => setFloaters((cur) => cur.filter((x) => x.id !== f.id)), 1100);

      if (res.leveledUp) {
        pushToast({
          title: `${name} hit level ${res.level}!`,
          message: "new aura unlocked",
          tone: "grape",
        });
      }
    },
    [gainXp, name, pushToast],
  );

  const progress = hydrated ? xpIntoLevel / xpForLevel(level) : 0.08;

  return (
    <div className="flex flex-col gap-4">
      {/* headline */}
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-mint-deep dark:text-amethyst">
          your companion
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-[1.02] text-ink dark:text-snow">
          {hydrated ? name : "Miso"}
          <span className="text-ink/35 dark:text-snow/30">, {PERSONALITY_TAGS[personality]}</span>
        </h1>
      </div>

      {/* stage */}
      <div className="surface relative overflow-hidden rounded-[2rem]">
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-mist/70 via-transparent to-foam/60 dark:from-iris/20 dark:via-transparent dark:to-graphite/60"
        />
        <div aria-hidden className="animate-pulse-soft absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-mint/40 blur-3xl dark:bg-grape/25" />

        <div className="relative flex flex-col items-center px-6 pb-6 pt-7">
          <div className="flex w-full items-center justify-between">
            <span className="surface-solid rounded-full px-3 py-1 text-[11px] font-bold text-ink/70 dark:text-snow/70">
              Lv {hydrated ? level : 1}
            </span>
            <button
              type="button"
              hidden={!!(hydrated && customPetAssetId)}
              onClick={() => setSpinSignal((n) => n + 1)}
              className="surface-solid flex min-h-8 cursor-pointer items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-ink outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:text-snow dark:focus-visible:ring-amethyst/60"
              aria-label="Spin your pet 360 degrees"
            >
              <Rotate3d className="size-3.5 text-mint-deep dark:text-amethyst" aria-hidden />
              Spin 360°
            </button>
          </div>

          <div className="relative mt-2 w-full">
            {hydrated && customPetAssetId && customPetKind ? (
              <CustomPetStage
                assetId={customPetAssetId}
                kind={customPetKind}
                name={name}
                tint={customFur}
                personality={personality}
                onPat={() => reward(3)}
              />
            ) : (
              <Pet3D
                color={color}
                customFur={customFur}
                accessory={accessory}
                personality={personality}
                onPat={() => reward(3)}
                spinSignal={spinSignal}
              />
            )}

            {/* +XP floaters rise on a slight drift-x so stacked taps read as a stream */}
            <div aria-hidden className="pointer-events-none absolute inset-x-0 top-6 flex justify-center">
              <AnimatePresence>
                {floaters.map((f) => (
                  <motion.span
                    key={f.id}
                    initial={{ opacity: 0, y: 8, x: f.x, scale: 0.8 }}
                    animate={{ opacity: 1, y: -46, x: f.x * 1.4, scale: 1.05 }}
                    exit={{ opacity: 0, y: -70 }}
                    transition={{ duration: 0.9, ease: [0.22, 0.9, 0.3, 1] }}
                    className="absolute font-display text-lg italic text-mint-deep dark:text-amethyst"
                  >
                    +{f.amount}
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <p className="mt-1 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/35 dark:text-snow/30">
            {hydrated && customPetAssetId ? "tap to pat" : "drag to rotate · tap to pat"}
          </p>
          <p className="mt-2 text-center text-xs italic text-ink/55 dark:text-snow/50">
            “{hydrated ? bio : "Professional cheerleader. Amateur napper."}”
          </p>
        </div>
      </div>

      {/* progression */}
      <div className="surface-solid shadow-soft rounded-[1.6rem] p-4">
        <XpRing
          level={hydrated ? level : 1}
          progress={progress}
          totalXp={hydrated ? xp : 20}
        />
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { k: "pulses", v: hydrated ? pulses : 1 },
            { k: "level", v: hydrated ? level : 1 },
            { k: "lifetime", v: `${hydrated ? Math.min(999, Math.round((xp / 1000) * 10) / 10) : 0}k` },
          ].map((s) => (
            <div key={s.k} className="rounded-2xl bg-ink/[0.03] px-3 py-2 text-center dark:bg-white/[0.05]">
              <p className="text-[15px] font-bold text-ink dark:text-snow">{s.v}</p>
              <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink/45 dark:text-snow/40">
                {s.k}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* actions */}
      <div className="grid grid-cols-3 gap-2">
        {ACTIONS.map((a) => (
          <motion.button
            key={a.key}
            type="button"
            whileTap={{ scale: 0.92 }}
            onClick={() => reward(a.xp)}
            className="surface-solid flex cursor-pointer flex-col items-center gap-1.5 rounded-[1.4rem] px-2 py-3.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60"
            aria-label={`${a.label}: gain ${a.xp} XP`}
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-mint/60 text-pine dark:bg-grape/25 dark:text-lilac">
              <a.icon className="size-4.5" aria-hidden />
            </span>
            <span className="text-[12px] font-bold text-ink dark:text-snow">{a.label}</span>
            <span className="text-[10px] font-semibold text-ink/45 dark:text-snow/45">+{a.xp} XP</span>
          </motion.button>
        ))}
      </div>

      {/* daily quest teaser */}
      <div className="surface-solid flex items-center gap-3 rounded-[1.6rem] p-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white">
          <BadgeCheck className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-ink dark:text-snow">Finish a routine from the feed</p>
          <p className="text-[11px] text-ink/55 dark:text-snow/50">+40 XP and a very proud {hydrated ? name : "Miso"}</p>
        </div>
      </div>
    </div>
  );
}
