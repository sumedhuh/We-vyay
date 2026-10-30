"use client";

import { memo, useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, PawPrint } from "lucide-react";
import type { AnimationKind, AnimationMeta } from "@/db/schema";
import { Sheet } from "@/components/ui/sheet";
import { ColorSpectrum } from "@/components/ui/color-spectrum";
import { AnimationUploader } from "./animation-uploader";
import { AnimationPlayer } from "@/components/media/animation-player";
import { useCreatePet } from "@/lib/queries/pets";
import { useUiStore } from "@/stores/ui-store";
import type { Personality } from "@/stores/pet-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const PERSONALITIES: { key: Personality; tagline: string }[] = [
  { key: "playful", tagline: "endless zoomies" },
  { key: "zen", tagline: "slow, deep breaths" },
  { key: "fierce", tagline: "competition mode" },
  { key: "goofy", tagline: "chaos, but cute" },
];

/**
 * Bring-your-own-pet. Upload artwork (GIF/PNG/WebP/MP4/Lottie), name it,
 * pick a personality + signature color, and it joins your roster.
 */
export const PetBuilder = memo(function PetBuilder({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const create = useCreatePet();
  const pushToast = useUiStore((s) => s.pushToast);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [personality, setPersonality] = useState<Personality>("playful");
  const [furHex, setFurHex] = useState("#7fe7bb");
  const [asset, setAsset] = useState<{
    id: string;
    name: string;
    kind: AnimationKind;
  } | null>(null);

  const reset = useCallback(() => {
    setName("");
    setBio("");
    setPersonality("playful");
    setFurHex("#7fe7bb");
    setAsset(null);
  }, []);

  const pickAsset = useCallback((a: AnimationMeta) => {
    setAsset({ id: a.id, name: a.name, kind: a.kind });
  }, []);

  const save = useCallback(() => {
    const trimmed = name.trim();
    if (!trimmed || !asset || create.isPending) return;
    haptic("medium");
    create.mutate(
      {
        name: trimmed,
        bio: bio.trim(),
        personality,
        furHex,
        assetId: asset.id,
        assetName: asset.name,
        assetKind: asset.kind,
      },
      {
        onSuccess: (created) => {
          haptic("success");
          pushToast({
            title: `${created.name} joined your roster`,
            message: "pick them in the pet creator",
            tone: "mint",
          });
          reset();
          onClose();
        },
      },
    );
  }, [name, bio, personality, furHex, asset, create, pushToast, reset, onClose]);

  return (
    <Sheet open={open} onClose={onClose} label="Add your own pet" z={82}>
      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-mint-deep dark:text-amethyst">
        your own pet
      </p>
      <h3 className="font-display mt-1 text-2xl italic text-ink dark:text-snow">
        Bring your creature
      </h3>
      <p className="mt-1 text-xs text-ink/55 dark:text-snow/50">
        Upload any art or animation — it becomes a companion you can equip.
      </p>

      {/* preview + name */}
      <div className="mt-4 flex items-center gap-3">
        <span
          className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl ring-2 ring-white/60 dark:ring-white/15"
          style={{ background: `${furHex}33` }}
        >
          {asset ? (
            <AnimationPlayer
              id={asset.id}
              kind={asset.kind}
              name={asset.name}
              className="size-full object-cover"
            />
          ) : (
            <PawPrint className="size-6" style={{ color: furHex }} aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="Pet name"
            aria-label="Pet name"
            className="w-full rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2.5 text-[15px] font-bold text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
          <input
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 80))}
            placeholder="Short description (optional)"
            aria-label="Pet description"
            className="mt-1.5 w-full rounded-2xl border border-ink/10 bg-transparent px-3.5 py-2 text-[12px] text-ink outline-none transition-colors placeholder:text-ink/30 focus:border-mint-deep/60 dark:border-white/12 dark:text-snow dark:placeholder:text-snow/25 dark:focus:border-amethyst/60"
          />
        </div>
      </div>

      {/* signature color */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        signature color
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

      {/* artwork */}
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
        pet artwork
      </p>
      <p className="mb-2 text-[10.5px] text-ink/45 dark:text-snow/40">
        Drag &amp; drop your creature — animated GIFs and Lottie look best.
      </p>
      <AnimationUploader selectedId={asset?.id ?? null} onPick={pickAsset} />

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={save}
        disabled={!name.trim() || !asset || create.isPending}
        className="mt-5 flex min-h-13 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[14px] font-bold text-pine shadow-[0_16px_34px_-14px_rgba(47,191,138,0.8)] outline-none disabled:opacity-40 dark:from-grape dark:to-iris dark:text-white"
      >
        {create.isPending ? (
          <span className="size-4 animate-spin rounded-full border-2 border-pine/30 border-t-pine dark:border-white/30 dark:border-t-white" />
        ) : (
          <Check className="size-4" aria-hidden />
        )}
        Add to my pets
      </motion.button>
      {create.isError && (
        <p role="alert" className="mt-2 text-center text-[11px] font-semibold text-red-500">
          {create.error.message}
        </p>
      )}
      {!asset && (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-ink/35 dark:text-snow/30">
          <Sparkles className="size-3" aria-hidden /> artwork is required
        </p>
      )}
    </Sheet>
  );
});
