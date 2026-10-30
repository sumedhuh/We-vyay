"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Glasses,
  Shirt,
  Ribbon,
  HardHat,
  Ban,
  Lock,
  Check,
  Sparkles,
  UploadCloud,
  XCircle,
  Plus,
  Trash2,
  PawPrint,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import {
  PET_COLORS,
  type PetAccessory,
  type PetColor,
  type Personality,
  usePetStore,
} from "@/stores/pet-store";
import { useStudioStore, type MotionPreset } from "@/stores/studio-store";
import { useProStore } from "@/stores/pro-store";
import { useUiStore } from "@/stores/ui-store";
import { Sheet } from "@/components/ui/sheet";
import { ColorSpectrum } from "@/components/ui/color-spectrum";
import { PetBuilder } from "./pet-builder";
import { usePetsQuery, useDeletePet } from "@/lib/queries/pets";
import type { CustomPet } from "@/db/schema";
import { AnimationUploader } from "./animation-uploader";
import { AnimationPlayer } from "@/components/media/animation-player";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/* ------------------------------------------------- Animation presets ---- */

const PRESETS: { key: MotionPreset; label: string; hint: string }[] = [
  { key: "pulse", label: "Pulse", hint: "heartbeat rep counter" },
  { key: "wave", label: "Wave", hint: "flow stances, yoga" },
  { key: "orbit", label: "Orbit", hint: "mobility circles" },
  { key: "pop", label: "Pop", hint: "explosive plyo" },
];

export const PresetPreview = memo(function PresetPreview({
  preset,
}: {
  preset: MotionPreset;
}) {
  if (preset === "pulse")
    return (
      <motion.span
        className="block size-3.5 rounded-full bg-mint-deep dark:bg-amethyst"
        animate={{ scale: [1, 1.45, 1], opacity: [1, 0.7, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  if (preset === "wave")
    return (
      <span className="flex items-end gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="block size-1.5 rounded-full bg-mint-deep dark:bg-amethyst"
            animate={{ y: [0, -7, 0] }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.16,
              ease: "easeInOut",
            }}
          />
        ))}
      </span>
    );
  if (preset === "orbit")
    return (
      <span className="relative block size-4">
        <span className="absolute inset-0 rounded-full border border-dashed border-ink/20 dark:border-white/25" />
        <motion.span
          className="absolute left-1/2 top-1/2 block size-1.5 rounded-full bg-mint-deep dark:bg-amethyst"
          animate={{ rotate: 360 }}
          // satellite math: dot sits on a 9px arm rotating around the ring center
          style={{ x: -3, y: -3, transformOrigin: "3px 3px", translateX: 9 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
      </span>
    );
  return (
    <motion.span
      className="block size-3.5 rounded-[4px] bg-mint-deep dark:bg-amethyst"
      animate={{ scale: [1, 1.5, 1], rotate: [0, 12, 0] }}
      transition={{
        duration: 0.7,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    />
  );
});

/* ------------------------------------------------- Animation picker ----- */

type PickerTab = "presets" | "uploads";

export const AnimationPickerModal = memo(function AnimationPickerModal({
  uid,
  onClose,
}: {
  uid: string | null;
  onClose: () => void;
}) {
  const setAnimation = useStudioStore((s) => s.setAnimation);
  const setCustomAnimation = useStudioStore((s) => s.setCustomAnimation);
  const items = useStudioStore((s) => s.items);
  const pushToast = useUiStore((s) => s.pushToast);
  const [tab, setTab] = useState<PickerTab>("uploads");

  const target = items.find((i) => i.uid === uid) ?? null;

  const pickPreset = useCallback(
    (preset: MotionPreset) => {
      if (!uid || !target) return;
      setAnimation(uid, preset);
      haptic("success");
      pushToast({
        title: `${target.name} now ${preset}s`,
        message: "preset linked",
        tone: "mint",
      });
      onClose();
    },
    [uid, target, setAnimation, pushToast, onClose],
  );

  const pickCustom = useCallback(
    (
      a: { id: string; name: string; kind: "image" | "video" | "lottie" | "3d" },
      fromUpload: boolean,
    ) => {
      if (!uid) return;
      setCustomAnimation(uid, a);
      pushToast({
        title: fromUpload ? `"${a.name}" uploaded` : `"${a.name}" attached`,
        message: target ? `on ${target.name}` : undefined,
        tone: "mint",
      });
      if (!fromUpload) onClose(); // fresh uploads keep the sheet open
    },
    [uid, setCustomAnimation, pushToast, target, onClose],
  );

  const clearCustom = useCallback(() => {
    if (!uid) return;
    setCustomAnimation(uid, null);
    haptic("medium");
  }, [uid, setCustomAnimation]);

  return (
    <Sheet open={!!uid} onClose={onClose} label="Add workout animation">
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
        workout animation
      </p>
      <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
        Give {target ? target.name : "it"} a motion
      </h3>
      <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
        Upload your own clip or pick a built-in preset. It plays inside the routine
        when anyone opens it from the feed.
      </p>

      {/* currently attached */}
      {target?.animationId && target.animationKind && (
        <div className="surface-solid mt-3 flex items-center gap-3 rounded-2xl p-2.5">
          <AnimationPlayer
            id={target.animationId}
            kind={target.animationKind}
            name={target.animationName ?? "animation"}
            className="size-12 shrink-0 rounded-xl bg-ink/[0.04] object-cover dark:bg-white/[0.06]"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-bold text-ink dark:text-snow">
              {target.animationName}
            </p>
            <p className="text-[10px] font-semibold text-ink/45 dark:text-snow/40">
              attached · your upload
            </p>
          </div>
          <button
            type="button"
            onClick={clearCustom}
            aria-label="Remove attached animation"
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink/40 outline-none transition-colors hover:bg-red-500/10 hover:text-red-500 dark:text-snow/40"
          >
            <XCircle className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {/* segmented control */}
      <div className="mt-4 flex rounded-full bg-ink/[0.05] p-1 dark:bg-white/[0.07]">
        {(
          [
            { key: "uploads", label: "Your uploads", Icon: UploadCloud },
            { key: "presets", label: "Presets", Icon: Sparkles },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              haptic("selection");
              setTab(t.key);
            }}
            aria-pressed={tab === t.key}
            className="relative flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold outline-none"
          >
            {tab === t.key && (
              <motion.span
                layoutId="picker-tab"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
                className="surface-solid absolute inset-0 rounded-full shadow-sm"
              />
            )}
            <span
              className={cn(
                "relative flex items-center gap-1.5",
                tab === t.key
                  ? "text-ink dark:text-snow"
                  : "text-ink/45 dark:text-snow/40",
              )}
            >
              <t.Icon className="size-3.5" aria-hidden />
              {t.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3">
        {tab === "uploads" ? (
          <AnimationUploader
            selectedId={target?.animationId ?? null}
            onPick={pickCustom}
          />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p) => (
              <motion.button
                key={p.key}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => pickPreset(p.key)}
                className={cn(
                  "flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.3rem] border text-center outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
                  target?.animation === p.key
                    ? "border-mint-deep/60 bg-mint/30 dark:border-amethyst/60 dark:bg-grape/20"
                    : "surface-solid",
                )}
                aria-pressed={target?.animation === p.key}
              >
                <span className="flex h-6 items-center justify-center">
                  <PresetPreview preset={p.key} />
                </span>
                <span className="text-[12px] font-bold text-ink dark:text-snow">
                  {p.label}
                  {target?.animation === p.key && (
                    <Check className="ml-1 inline size-3" aria-hidden />
                  )}
                </span>
                <span className="-mt-1.5 text-[9.5px] text-ink/45 dark:text-snow/40">
                  {p.hint}
                </span>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </Sheet>
  );
});

/* ------------------------------------------------------- Pet creator ---- */

const PERSONALITIES: { key: Personality; tagline: string }[] = [
  { key: "playful", tagline: "endless zoomies" },
  { key: "zen", tagline: "slow, deep breaths" },
  { key: "fierce", tagline: "competition mode" },
  { key: "goofy", tagline: "chaos, but cute" },
];

export const ACCESSORIES: {
  key: PetAccessory;
  label: string;
  Icon: LucideIcon;
  proOnly: boolean;
}[] = [
  { key: "none", label: "Bare", Icon: Ban, proOnly: false },
  { key: "bow", label: "Bow", Icon: Ribbon, proOnly: false },
  { key: "cap", label: "Cap", Icon: HardHat, proOnly: false },
  { key: "glasses", label: "Specs", Icon: Glasses, proOnly: false },
  { key: "crown", label: "Crown", Icon: Crown, proOnly: true },
  { key: "scarf", label: "Scarf", Icon: Shirt, proOnly: true },
];
export const PetCreatorModal = memo(function PetCreatorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pet = usePetStore();
  const isPro = useProStore((s) => s.isPro);
  const openPro = useUiStore((s) => s.openPro);
  const pushToast = useUiStore((s) => s.pushToast);

  const { data: myPets = [], isPending: petsLoading } = usePetsQuery();
  const deletePet = useDeletePet();

  const [builderOpen, setBuilderOpen] = useState(false);

  // local draft — only persisted on explicit Save
  const [name, setName] = useState(pet.name);
  const [bio, setBio] = useState(pet.bio);
  const [furHex, setFurHex] = useState(pet.customFur ?? PET_COLORS[pet.color].fill);
  const [personality, setPersonality] = useState<Personality>(pet.personality);
  const [accessory, setAccessory] = useState<PetAccessory>(pet.accessory);
  const [customPetId, setCustomPetId] = useState<string | null>(pet.customPetId);

  useEffect(() => {
    if (open) {
      setName(pet.name);
      setBio(pet.bio);
      setFurHex(pet.customFur ?? PET_COLORS[pet.color].fill);
      setPersonality(pet.personality);
      setAccessory(pet.accessory);
      setCustomPetId(pet.customPetId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const selected = myPets.find((p) => p.id === customPetId) ?? null;

  /** Equipping an uploaded pet adopts its name/bio/color/personality. */
  const equip = useCallback(
    (p: CustomPet) => {
      haptic("selection");
      setCustomPetId(p.id);
      setName(p.name);
      if (p.bio) setBio(p.bio);
      setFurHex(p.furHex);
      setPersonality(p.personality as Personality);
    },
    [],
  );

  const useBuiltIn = useCallback(() => {
    haptic("selection");
    setCustomPetId(null);
  }, []);

  const save = useCallback(() => {
    const chosen = myPets.find((p) => p.id === customPetId) ?? null;
    pet.customize({
      name: name.trim() || "Miso",
      bio: bio.trim(),
      customFur: furHex, // spectrum always yields an explicit hex
      personality,
      accessory,
      customPetId: chosen?.id ?? null,
      customPetAssetId: chosen?.assetId ?? null,
      customPetKind: chosen?.assetKind ?? null,
    });
    haptic("success");
    pushToast({ title: `${name.trim() || "Miso"} looks fresh`, tone: "mint" });
    onClose();
  }, [
    myPets, customPetId, pet, name, bio, furHex, personality, accessory,
    pushToast, onClose,
  ]);

  const pickAccessory = useCallback(
    (key: PetAccessory, proOnly: boolean) => {
      if (proOnly && !isPro) {
        haptic("light");
        pushToast({
          title: "Pro wardrobe",
          message: "unlock crown & scarf",
          tone: "grape",
        });
        onClose();
        openPro();
        return;
      }
      haptic("selection");
      setAccessory(key);
    },
    [isPro, pushToast, openPro, onClose],
  );

  return (
    <>
      <Sheet open={open} onClose={onClose} label="Pet creator">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
          pet creator
        </p>
        <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
          Design your mover
        </h3>

        {/* ── your pets roster ── */}
        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            your pets
          </p>
          {petsLoading && (
            <Loader2 className="size-3.5 animate-spin text-ink/30 dark:text-snow/30" />
          )}
        </div>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {/* add your own pet */}
          <button
            type="button"
            onClick={() => {
              haptic("light");
              setBuilderOpen(true);
            }}
            className="flex w-[78px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-[1.1rem] border-2 border-dashed border-mint-deep/40 bg-mint/15 px-2 py-2.5 outline-none transition-colors hover:border-mint-deep/70 hover:bg-mint/25 focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:border-amethyst/40 dark:bg-grape/15 dark:hover:border-amethyst/70"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-mint to-mint-strong text-pine dark:from-grape dark:to-iris dark:text-white">
              <Plus className="size-4.5" aria-hidden />
            </span>
            <span className="text-center text-[10px] font-bold leading-tight text-ink dark:text-snow">
              New pet
            </span>
          </button>

          {/* built-in companion */}
          <button
            type="button"
            onClick={useBuiltIn}
            aria-pressed={customPetId === null}
            className={cn(
              "flex w-[78px] shrink-0 cursor-pointer flex-col items-center gap-1 rounded-[1.1rem] border px-2 py-2.5 outline-none transition-colors",
              customPetId === null
                ? "border-mint-deep/60 bg-mint/25 dark:border-amethyst/60 dark:bg-grape/20"
                : "surface-solid",
            )}
          >
            <span
              className="flex size-9 items-center justify-center rounded-full"
              style={{ background: `${furHex}44` }}
            >
              <PawPrint className="size-4.5" style={{ color: furHex }} aria-hidden />
            </span>
            <span className="text-center text-[10px] font-bold leading-tight text-ink dark:text-snow">
              Built-in 3D
            </span>
          </button>

          {myPets.map((p) => (
            <div key={p.id} className="relative shrink-0">
              <button
                type="button"
                onClick={() => equip(p)}
                aria-pressed={customPetId === p.id}
                className={cn(
                  "flex w-[78px] cursor-pointer flex-col items-center gap-1 rounded-[1.1rem] border px-2 py-2.5 outline-none transition-colors",
                  customPetId === p.id
                    ? "border-mint-deep/60 bg-mint/25 dark:border-amethyst/60 dark:bg-grape/20"
                    : "surface-solid",
                )}
              >
                {p.assetId && p.assetKind ? (
                  <AnimationPlayer
                    id={p.assetId}
                    kind={p.assetKind}
                    name={p.name}
                    className="size-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full bg-ink/[0.06] dark:bg-white/10">
                    <PawPrint className="size-4" aria-hidden />
                  </span>
                )}
                <span className="line-clamp-1 text-center text-[10px] font-bold leading-tight text-ink dark:text-snow">
                  {p.name}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  haptic("medium");
                  if (customPetId === p.id) setCustomPetId(null);
                  deletePet.mutate(p.id);
                }}
                aria-label={`Delete ${p.name}`}
                className="absolute -right-1 -top-1 flex size-5 cursor-pointer items-center justify-center rounded-full bg-ink/60 text-white outline-none backdrop-blur transition-colors hover:bg-red-500 dark:bg-white/30"
              >
                <Trash2 className="size-2.5" aria-hidden />
              </button>
            </div>
          ))}
        </div>

        {selected && (
          <p className="mt-1 text-[10.5px] font-semibold text-mint-deep dark:text-amethyst">
            {selected.name} equipped — your own artwork shows on the Pets tab.
          </p>
        )}

        {/* name + description */}
        <label className="mt-4 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 16))}
            placeholder="Miso"
            className="mt-1 w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-2.5 text-[15px] font-bold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
        </label>
        <label className="mt-3 block">
          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
            description
          </span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 80))}
            rows={2}
            placeholder="Professional cheerleader. Amateur napper."
            className="mt-1 w-full resize-none rounded-2xl border border-ink/10 bg-transparent px-4 py-2.5 text-[13px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
        </label>

        {/* ── color spectrum (replaces fur swatches) ── */}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          color
        </p>
        <div className="mt-2">
          <ColorSpectrum value={furHex} onChange={setFurHex} label="Pet color" />
        </div>

        {/* personality */}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          personality
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {PERSONALITIES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                haptic("selection");
                setPersonality(p.key);
              }}
              aria-pressed={personality === p.key}
              className={cn(
                "cursor-pointer rounded-2xl border px-3 py-2.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
                personality === p.key
                  ? "border-mint-deep/60 bg-mint/30 dark:border-amethyst/60 dark:bg-grape/20"
                  : "surface-solid",
              )}
            >
              <p className="text-[13px] font-bold capitalize text-ink dark:text-snow">
                {p.key}
              </p>
              <p className="text-[10px] text-ink/50 dark:text-snow/45">{p.tagline}</p>
            </button>
          ))}
        </div>

        {/* wardrobe */}
        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          wardrobe
        </p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {ACCESSORIES.map((a) => {
            const locked = a.proOnly && !isPro;
            const isSelected = accessory === a.key;
            return (
              <button
                key={a.key}
                type="button"
                onClick={() => pickAccessory(a.key, a.proOnly)}
                aria-pressed={isSelected}
                aria-label={`${a.label}${locked ? " (pro only)" : ""}`}
                className={cn(
                  "relative flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
                  isSelected
                    ? "border-mint-deep/60 bg-mint/30 dark:border-amethyst/60 dark:bg-grape/20"
                    : "surface-solid",
                )}
              >
                <a.Icon className="size-4.5 text-ink/70 dark:text-snow/70" aria-hidden />
                <span className="text-[10.5px] font-bold text-ink dark:text-snow">
                  {a.label}
                </span>
                {locked && (
                  <span className="absolute right-1.5 top-1.5 flex size-4.5 items-center justify-center rounded-full bg-gradient-to-br from-grape to-iris text-white">
                    <Lock className="size-2.5" aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {selected && (
          <p className="mt-2 text-[10px] text-ink/40 dark:text-snow/35">
            Wardrobe &amp; 3D spin apply to the built-in companion.
          </p>
        )}

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={save}
          className="mt-5 flex min-h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_14px_30px_-12px_rgba(47,191,138,0.7)] outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/70 dark:from-grape dark:to-iris dark:text-white dark:focus-visible:ring-amethyst/70"
        >
          Save {name.trim() || "Miso"}
        </motion.button>
      </Sheet>

      <PetBuilder open={builderOpen} onClose={() => setBuilderOpen(false)} />
    </>
  );
});
