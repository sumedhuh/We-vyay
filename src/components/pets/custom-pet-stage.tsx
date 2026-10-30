"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import type { AnimationKind } from "@/db/schema";
import { AnimationPlayer } from "@/components/media/animation-player";
import type { Personality } from "@/stores/pet-store";

/** Idle rig mirrors the 3D companion so personality still reads through. */
const RIG: Record<Personality, { breath: number; tilt: number; bob: number }> = {
  playful: { breath: 2.6, tilt: 2.6, bob: 9 },
  zen: { breath: 5.2, tilt: 0.8, bob: 5 },
  fierce: { breath: 2.1, tilt: 4.2, bob: 6 },
  goofy: { breath: 1.9, tilt: 6.5, bob: 11 },
};

/** Stage for a user-uploaded pet: floats, breathes, and takes pats for XP. */
export const CustomPetStage = memo(function CustomPetStage({
  assetId,
  kind,
  name,
  tint,
  personality,
  onPat,
}: {
  assetId: string;
  kind: AnimationKind;
  name: string;
  tint: string | null;
  personality: Personality;
  onPat: () => void;
}) {
  const rig = RIG[personality];

  return (
    <motion.button
      type="button"
      onClick={onPat}
      aria-label={`Pat ${name} for XP`}
      whileTap={{ scale: 0.94 }}
      className="relative flex h-[300px] w-full cursor-pointer items-center justify-center rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60"
    >
      {/* signature-color aura */}
      {tint && (
        <span
          aria-hidden
          className="animate-pulse-soft absolute size-52 rounded-full blur-3xl"
          style={{ background: `${tint}55` }}
        />
      )}

      {/* contact shadow compresses as the pet rises (inverse phase) */}
      <motion.span
        aria-hidden
        className="absolute bottom-8 h-4 w-36 rounded-[50%] bg-pine/20 blur-md dark:bg-black/60"
        animate={{ scaleX: [1, 0.86, 1], opacity: [0.9, 0.55, 0.9] }}
        transition={{ duration: rig.breath * 1.6, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative"
        animate={{
          y: [0, -rig.bob, 0],
          rotate: [-rig.tilt / 2, rig.tilt / 2, -rig.tilt / 2],
        }}
        transition={{ duration: rig.breath * 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        <AnimationPlayer
          id={assetId}
          kind={kind}
          name={name}
          className="size-[280px] scale-110 rounded-3xl object-contain drop-shadow-xl"
        />
      </motion.div>
    </motion.button>
  );
});
