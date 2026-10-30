"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Crown,
  Sun,
  MoonStar,
  Monitor,
  RotateCcw,
  ChevronRight,
  Sparkles,
  PawPrint,
  BadgeCheck,
  Users,
  Library,
  Shapes,
} from "lucide-react";
import {
  useSettingsStore,
  LIGHT_PRESETS,
  DARK_PRESETS,
  AVATAR_PRESETS,
} from "@/stores/settings-store";
import { usePetStore, PET_COLORS, type PetColor } from "@/stores/pet-store";
import { useProStore } from "@/stores/pro-store";
import { useUiStore } from "@/stores/ui-store";
import { ColorField } from "./color-field";
import { FollowingSheet } from "@/components/social/following-sheet";
import { CollectionsSheet } from "@/components/collections/collections-sheet";
import { useFollowsQuery, useCollectionsQuery } from "@/lib/queries/social";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const PET_PRESETS = (Object.keys(PET_COLORS) as PetColor[]).map((k) => ({
  name: k,
  hex: PET_COLORS[k].fill,
}));

export function SettingsScreen() {
  const { theme, setTheme } = useTheme();
  const [hydrated, setHydrated] = useState(false);
  const [followingOpen, setFollowingOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  useEffect(() => setHydrated(true), []);

  const { data: follows = [] } = useFollowsQuery();
  const { data: collections = [] } = useCollectionsQuery();
  const savedCount = collections.reduce((acc, c) => acc + c.count, 0);

  const lightAccent = useSettingsStore((s) => s.lightAccent);
  const darkAccent = useSettingsStore((s) => s.darkAccent);
  const avatarColor = useSettingsStore((s) => s.avatarColor);
  const displayName = useSettingsStore((s) => s.displayName);
  const setLightAccent = useSettingsStore((s) => s.setLightAccent);
  const setDarkAccent = useSettingsStore((s) => s.setDarkAccent);
  const setAvatarColor = useSettingsStore((s) => s.setAvatarColor);
  const setDisplayName = useSettingsStore((s) => s.setDisplayName);
  const resetColors = useSettingsStore((s) => s.reset);

  const petColor = usePetStore((s) => s.color);
  const customFur = usePetStore((s) => s.customFur);
  const petName = usePetStore((s) => s.name);
  const customize = usePetStore((s) => s.customize);

  const isPro = useProStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  const pushToast = useUiStore((s) => s.pushToast);

  const currentFur = customFur ?? PET_COLORS[petColor].fill;

  const onPetColor = useCallback(
    (hex: string) => {
      // match a preset if the user landed exactly on one, else store as custom
      const preset = (Object.keys(PET_COLORS) as PetColor[]).find(
        (k) => PET_COLORS[k].fill.toLowerCase() === hex.toLowerCase(),
      );
      customize(preset ? { color: preset, customFur: null } : { customFur: hex });
    },
    [customize],
  );

  const doReset = useCallback(() => {
    haptic("medium");
    resetColors();
    customize({ color: "mint", customFur: null });
    pushToast({ title: "Colors reset", message: "back to house style", tone: "mint" });
  }, [resetColors, customize, pushToast]);

  return (
    <div className="flex flex-col gap-4">
      <div className="pt-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-mint-deep dark:text-amethyst">
          personalize
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-none text-ink dark:text-snow">
          settings
        </h1>
        <p className="mt-2 text-[12px] text-ink/55 dark:text-snow/50">
          Make vyay yours. Every change lands instantly — no reload.
        </p>
      </div>

      {/* studio shortcut */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          haptic("light");
          useUiStore.getState().openStudio();
        }}
        className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[15px] font-black tracking-wide text-pine shadow-[0_12px_28px_-12px_rgba(47,191,138,0.6)] outline-none transition-shadow hover:shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] focus-visible:ring-2 focus-visible:ring-mint-deep/70 dark:from-grape dark:to-iris dark:text-white dark:shadow-[0_12px_28px_-12px_rgba(139,92,246,0.7)] dark:hover:shadow-[0_16px_34px_-14px_rgba(139,92,246,0.9)]"
      >
        <Shapes className="size-5" aria-hidden />
        Open Studio
      </motion.button>

      {/* profile */}
      <div className="surface-solid rounded-[1.4rem] p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          your profile
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <span
            aria-hidden
            className="flex size-12 shrink-0 items-center justify-center rounded-full text-[16px] font-black text-white shadow-inner ring-2 ring-white/60 dark:ring-white/20"
            style={{
              background: `linear-gradient(135deg, ${avatarColor}, color-mix(in oklab, ${avatarColor} 55%, #000))`,
            }}
          >
            {(displayName || "You").slice(0, 1).toUpperCase()}
          </span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            aria-label="Display name"
            className="min-w-0 flex-1 rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2.5 text-[14px] font-bold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
        </div>
      </div>

      {/* body metrics */}
      <div className="surface-solid rounded-[1.4rem] p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          body metrics
        </p>
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {[
            {
              label: "Age",
              value: hydrated ? useSettingsStore.getState().age : null,
              unit: "y.o",
              onChange: (v: string) => useSettingsStore.getState().setAge(v ? parseInt(v) || null : null),
            },
            {
              label: "Height",
              value: hydrated ? useSettingsStore.getState().height : null,
              unit: useSettingsStore.getState().heightUnit,
              onChange: (v: string) => useSettingsStore.getState().setHeight(v ? parseInt(v) || null : null),
            },
            {
              label: "Weight",
              value: hydrated ? useSettingsStore.getState().weight : null,
              unit: useSettingsStore.getState().weightUnit,
              onChange: (v: string) => useSettingsStore.getState().setWeight(v ? parseFloat(v) || null : null),
            },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-ink/[0.03] dark:bg-white/[0.05] p-2.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-ink/40 dark:text-snow/35 mb-1">
                {m.label}
              </p>
              <input
                type="number"
                value={m.value ?? ""}
                onChange={(e) => m.onChange(e.target.value)}
                placeholder="—"
                aria-label={m.label}
                className="w-full bg-transparent text-center text-[18px] font-black text-ink dark:text-snow outline-none placeholder:text-ink/20 dark:placeholder:text-snow/15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <p className="text-[9px] font-semibold text-ink/35 dark:text-snow/30 uppercase mt-0.5">
                {m.unit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* appearance mode */}
      <div className="surface-solid rounded-[1.4rem] p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          appearance
        </p>
        <div className="mt-2 flex rounded-full bg-ink/[0.05] p-1 dark:bg-white/[0.07]">
          {(
            [
              { key: "light", label: "Light", Icon: Sun },
              { key: "dark", label: "Dark", Icon: MoonStar },
              { key: "system", label: "Auto", Icon: Monitor },
            ] as const
          ).map((m) => {
            const active = hydrated && theme === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  haptic("selection");
                  setTheme(m.key);
                }}
                aria-pressed={active}
                className="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold outline-none"
              >
                {active && (
                  <motion.span
                    layoutId="theme-seg"
                    transition={{ type: "spring", stiffness: 520, damping: 38 }}
                    className="surface-solid absolute inset-0 rounded-full shadow-sm"
                  />
                )}
                <span
                  className={cn(
                    "relative flex items-center gap-1.5",
                    active ? "text-ink dark:text-snow" : "text-ink/45 dark:text-snow/40",
                  )}
                >
                  <m.Icon className="size-3.5" aria-hidden />
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* colors */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          app colors
        </p>
        <div className="flex flex-col gap-2">
          <ColorField
            label="Light mode accent"
            hint="gradients, buttons, charts"
            value={lightAccent}
            presets={LIGHT_PRESETS}
            onChange={setLightAccent}
          />
          <ColorField
            label="Dark mode accent"
            hint="glow, highlights, rings"
            value={darkAccent}
            presets={DARK_PRESETS}
            onChange={setDarkAccent}
          />
          <ColorField
            label="Your avatar"
            hint="posts, reviews, profile"
            value={avatarColor}
            presets={AVATAR_PRESETS.map((hex) => ({ name: hex, hex }))}
            onChange={setAvatarColor}
          />
          <ColorField
            label={`${petName}'s fur`}
            hint="any color you like"
            value={currentFur}
            presets={PET_PRESETS}
            onChange={onPetColor}
          />
        </div>
      </div>

      {/* social + saved */}
      <div>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          your library
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setFollowingOpen(true);
            }}
            className="surface-solid flex cursor-pointer items-center gap-3 rounded-[1.4rem] p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint/40 text-pine dark:bg-grape/25 dark:text-lilac">
              <Users className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-ink dark:text-snow">Following</p>
              <p className="text-[10.5px] text-ink/45 dark:text-snow/40">
                {follows.length > 0
                  ? `${follows.length} ${follows.length === 1 ? "profile" : "profiles"} you follow`
                  : "profiles you follow appear here"}
              </p>
            </div>
            {follows.length > 0 && (
              <span className="flex -space-x-2">
                {follows.slice(0, 3).map((f) => (
                  <span
                    key={f.handle}
                    aria-hidden
                    className="flex size-7 items-center justify-center rounded-full text-[10px] font-black text-white ring-2 ring-[var(--surface-solid)]"
                    style={{
                      background: `linear-gradient(135deg, hsl(${f.avatarHue} 80% 62%), hsl(${f.avatarHue + 40} 75% 45%))`,
                    }}
                  >
                    {f.author.slice(0, 1).toUpperCase()}
                  </span>
                ))}
              </span>
            )}
            <ChevronRight className="size-4 shrink-0 text-ink/30 dark:text-snow/30" aria-hidden />
          </button>

          <button
            type="button"
            onClick={() => {
              haptic("light");
              setCollectionsOpen(true);
            }}
            className="surface-solid flex cursor-pointer items-center gap-3 rounded-[1.4rem] p-3.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint/40 text-pine dark:bg-grape/25 dark:text-lilac">
              <Library className="size-4.5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-bold text-ink dark:text-snow">Collections</p>
              <p className="text-[10.5px] text-ink/45 dark:text-snow/40">
                {collections.length > 0
                  ? `${savedCount} saved across ${collections.length} ${collections.length === 1 ? "list" : "lists"}`
                  : "save workouts to your own lists"}
              </p>
            </div>
            {collections.length > 0 && (
              <span className="flex gap-0.5 text-[15px]">
                {collections.slice(0, 3).map((c) => (
                  <span key={c.id}>{c.emoji}</span>
                ))}
              </span>
            )}
            <ChevronRight className="size-4 shrink-0 text-ink/30 dark:text-snow/30" aria-hidden />
          </button>
        </div>
      </div>



      {/* pro row */}
      <button
        type="button"
        onClick={() => {
          haptic("light");
          openPro();
        }}
        className={cn(
          "relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-[1.4rem] p-3.5 text-left outline-none",
          hydrated && isPro
            ? "surface-solid"
            : "bg-gradient-to-br from-[#2b1246] via-[#4c1d95] to-[#7c3aed] text-white shadow-[0_18px_38px_-18px_rgba(124,58,237,0.7)]",
        )}
      >
        {!(hydrated && isPro) && (
          <span aria-hidden className="shimmer absolute inset-0 opacity-60" />
        )}
        <span
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center rounded-full",
            hydrated && isPro
              ? "bg-gradient-to-br from-grape to-iris text-white"
              : "bg-white/15 text-[#ffdf8e] ring-1 ring-white/25",
          )}
        >
          {hydrated && isPro ? (
            <BadgeCheck className="size-5" aria-hidden />
          ) : (
            <Crown className="size-5" aria-hidden />
          )}
        </span>
        <div className="relative min-w-0 flex-1">
          <p
            className={cn(
              "text-[13px] font-bold",
              hydrated && isPro ? "text-ink dark:text-snow" : "text-white",
            )}
          >
            {hydrated && isPro ? "vyay Pro · active" : "Unlock vyay Pro"}
          </p>
          <p
            className={cn(
              "text-[10.5px]",
              hydrated && isPro ? "text-ink/45 dark:text-snow/40" : "text-white/70",
            )}
          >
            {hydrated && isPro
              ? "manage plan & restore purchases"
              : "wardrobe, elite routines, evolutions"}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "relative size-4",
            hydrated && isPro ? "text-ink/30 dark:text-snow/30" : "text-white/70",
          )}
          aria-hidden
        />
      </button>

      {/* reset */}
      <button
        type="button"
        onClick={doReset}
        className="surface-solid flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full text-[12.5px] font-bold text-ink/70 outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:text-snow/70 dark:focus-visible:ring-amethyst/60"
      >
        <RotateCcw className="size-4" aria-hidden /> Reset colors to default
      </button>

      <p className="flex items-center justify-center gap-1.5 pb-1 text-[10px] text-ink/35 dark:text-snow/30">
        <Sparkles className="size-3" aria-hidden /> vyay club · built for zero lag
      </p>

      <FollowingSheet open={followingOpen} onClose={() => setFollowingOpen(false)} />
      <CollectionsSheet open={collectionsOpen} onClose={() => setCollectionsOpen(false)} />
    </div>
  );
}
