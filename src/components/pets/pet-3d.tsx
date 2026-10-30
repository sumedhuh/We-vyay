"use client";

import { memo, useCallback, useEffect, useMemo, useRef } from "react";
import { useDrag } from "@use-gesture/react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionValueEvent,
  animate,
  type MotionValue,
} from "framer-motion";
import { PET_COLORS, type PetAccessory, type PetColor, type Personality } from "@/stores/pet-store";
import { furFromHex } from "@/lib/color";
import { haptic } from "@/lib/haptics";

/** Idle rig per personality (breath period, tilt, bob). */
const RIG: Record<Personality, { breath: number; tilt: number; bob: number }> = {
  playful: { breath: 2.6, tilt: 2.6, bob: 9 },
  zen: { breath: 5.2, tilt: 0.8, bob: 5 },
  fierce: { breath: 2.1, tilt: 4.2, bob: 6 },
  goofy: { breath: 1.9, tilt: 6.5, bob: 11 },
};

/** Depth slabs: the body is built from N stacked ellipses spread along Z.
 *  Each slab's radius follows a circular profile r(z) = R·√(1−(z/R)²), which
 *  is the cross-section of a sphere — so the stack reads as a solid volume
 *  from any yaw angle instead of a flat cutout. */
const SLABS = 15;
const DEPTH = 74; // total z-extent in px

type Fur = { fill: string; deep: string; belly: string };

const BodySlabs = memo(function BodySlabs({ fur }: { fur: Fur }) {
  const slabs = useMemo(() => {
    const out: { z: number; scale: number; shade: number }[] = [];
    const R = DEPTH / 2;
    for (let i = 0; i < SLABS; i++) {
      const z = -R + (i / (SLABS - 1)) * DEPTH;
      const profile = Math.sqrt(Math.max(0, 1 - (z / R) ** 2));
      out.push({
        z,
        scale: 0.55 + profile * 0.45, // never fully collapse at the poles
        // front slabs lighter, back slabs darker → readable form shading
        shade: 0.18 + (i / (SLABS - 1)) * 0.82,
      });
    }
    return out;
  }, []);

  return (
    <>
      {slabs.map((s, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-[50%]"
          style={{
            width: 168,
            height: 178,
            marginLeft: -84,
            marginTop: -89,
            transform: `translateZ(${s.z}px) scale(${s.scale})`,
            background: `color-mix(in oklab, ${fur.fill} ${40 + s.shade * 60}%, ${fur.deep})`,
            // backface pixels of inner slabs never show, so skip their raster work
            backfaceVisibility: "hidden",
          }}
        />
      ))}
    </>
  );
});

const Face = memo(function Face({
  fur,
  personality,
  z,
}: {
  fur: Fur;
  personality: Personality;
  z: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: 168,
        height: 178,
        marginLeft: -84,
        marginTop: -89,
        transform: `translateZ(${z}px)`,
      }}
    >
      <svg viewBox="0 0 168 178" className="size-full overflow-visible">
        <ellipse cx={84} cy={118} rx={44} ry={34} fill={fur.belly} opacity={0.92} />
        <motion.g
          animate={{ scaleY: [1, 1, 0.08, 1] }}
          transition={{
            duration: 0.36,
            times: [0, 0.72, 0.86, 1],
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
          style={{ transformOrigin: "84px 74px" }}
        >
          <ellipse cx={60} cy={74} rx={9} ry={10} fill="#16151a" />
          <ellipse cx={108} cy={74} rx={9} ry={10} fill="#16151a" />
        </motion.g>
        <circle cx={63} cy={70} r={3} fill="#fff" />
        <circle cx={111} cy={70} r={3} fill="#fff" />
        <ellipse cx={40} cy={96} rx={10} ry={6} fill={fur.deep} opacity={0.3} />
        <ellipse cx={128} cy={96} rx={10} ry={6} fill={fur.deep} opacity={0.3} />
        {personality === "goofy" ? (
          <>
            <path d="M70 98 Q84 110 98 98" fill="none" stroke={fur.deep} strokeWidth={5} strokeLinecap="round" />
            <path d="M77 104 Q84 116 91 104 Q84 108 77 104 Z" fill="#ff8fa3" />
          </>
        ) : personality === "fierce" ? (
          <>
            <path d="M70 100 L98 94" stroke={fur.deep} strokeWidth={5} strokeLinecap="round" />
            <path d="M46 56 L68 63 M122 56 L100 63" stroke={fur.deep} strokeWidth={5} strokeLinecap="round" />
          </>
        ) : (
          <path d="M72 98 Q84 108 96 98" fill="none" stroke={fur.deep} strokeWidth={5} strokeLinecap="round" />
        )}
      </svg>
    </div>
  );
});

const Back = memo(function Back({ fur, z }: { fur: Fur; z: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: 168,
        height: 178,
        marginLeft: -84,
        marginTop: -89,
        // rotateY(180°) so the artwork faces outward when we spin behind
        transform: `translateZ(${z}px) rotateY(180deg)`,
      }}
    >
      <svg viewBox="0 0 168 178" className="size-full overflow-visible">
        <path
          d="M84 40 Q96 70 84 100 Q72 70 84 40 Z"
          fill={fur.deep}
          opacity={0.28}
        />
        <ellipse cx={84} cy={126} rx={26} ry={20} fill={fur.deep} opacity={0.18} />
        <path
          d="M120 120 Q150 128 146 156 Q132 150 124 136"
          fill={fur.fill}
          stroke={fur.deep}
          strokeWidth={4}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});

function Accessory({
  kind,
  fur,
  z,
}: {
  kind: PetAccessory;
  fur: Fur;
  z: number;
}) {
  if (kind === "none") return null;
  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{
        width: 168,
        height: 178,
        marginLeft: -84,
        marginTop: -89,
        transform: `translateZ(${z}px)`,
      }}
    >
      <svg viewBox="0 0 168 178" className="size-full overflow-visible">
        {kind === "bow" && (
          <g transform="translate(126 12)">
            <path d="M0 0 L-24 -10 Q-28 3 -22 12 Z" fill={fur.deep} />
            <path d="M0 0 L22 -12 Q28 1 22 12 Z" fill={fur.deep} />
            <circle r={6} fill="#fff" opacity={0.92} />
          </g>
        )}
        {kind === "cap" && (
          <g>
            <path d="M40 18 Q84 -26 128 18 Q84 2 40 18 Z" fill={fur.deep} />
            <path d="M110 14 Q148 10 158 22 Q140 24 112 22 Z" fill={fur.deep} opacity={0.85} />
          </g>
        )}
        {kind === "glasses" && (
          <g stroke={fur.deep} strokeWidth={5} fill="rgba(255,255,255,0.16)">
            <circle cx={60} cy={74} r={18} />
            <circle cx={108} cy={74} r={18} />
            <path d="M78 74 Q84 67 90 74" fill="none" />
          </g>
        )}
        {kind === "crown" && (
          <g transform="translate(84 -4)">
            <path d="M-26 16 L-26 -6 L-11 5 L0 -13 L11 5 L26 -6 L26 16 Z" fill="#f7c948" stroke="#d69e2e" strokeWidth={2} />
          </g>
        )}
        {kind === "scarf" && (
          <path d="M24 140 Q84 164 144 138 Q142 158 128 166 Q84 182 40 164 Q28 156 24 140 Z" fill={fur.deep} />
        )}
      </svg>
    </div>
  );
}

/** Ear / arm limbs positioned in true 3D so they parallax while spinning. */
function Limb({
  fur,
  x,
  y,
  z,
  w,
  h,
  rot,
}: {
  fur: Fur;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  rot: number;
}) {
  return (
    <div
      className="absolute left-1/2 top-1/2 rounded-[50%]"
      style={{
        width: w,
        height: h,
        marginLeft: -w / 2,
        marginTop: -h / 2,
        transform: `translate3d(${x}px, ${y}px, ${z}px) rotate(${rot}deg)`,
        background: `linear-gradient(150deg, ${fur.fill}, ${fur.deep})`,
      }}
    />
  );
}

export const Pet3D = memo(function Pet3D({
  color,
  customFur,
  accessory,
  personality,
  onPat,
  spinSignal,
}: {
  color: PetColor;
  customFur: string | null;
  accessory: PetAccessory;
  personality: Personality;
  onPat?: () => void;
  /** increment to trigger a scripted full 360° spin */
  spinSignal?: number;
}) {
  const fur: Fur = useMemo(
    () => (customFur ? furFromHex(customFur) : PET_COLORS[color]),
    [customFur, color],
  );
  const rig = RIG[personality];

  // yaw in degrees; unbounded so repeated flicks keep winding the model
  const yaw = useMotionValue(-14);
  const pitch = useMotionValue(6);
  const smoothYaw = useSpring(yaw, { stiffness: 260, damping: 32, mass: 0.9 });
  const smoothPitch = useSpring(pitch, { stiffness: 220, damping: 28 });
  const dragging = useRef(false);
  const lastTick = useRef(0);

  // haptic detent every 90° so the spin feels mechanical
  useMotionValueEvent(smoothYaw, "change", (v) => {
    const q = Math.round(v / 90);
    if (q !== lastTick.current) {
      lastTick.current = q;
      if (dragging.current) haptic("selection");
    }
  });

  const bind = useDrag(
    ({ active, delta: [dx, dy], velocity: [vx], direction: [dirX], first, last }) => {
      if (first) {
        dragging.current = true;
        haptic("light");
      }
      if (active) {
        // 0.6°/px horizontally; vertical tilt clamped to ±22° to avoid gimbal-looking flips
        yaw.set(yaw.get() + dx * 0.6);
        pitch.set(Math.max(-22, Math.min(22, pitch.get() - dy * 0.35)));
      }
      if (last) {
        dragging.current = false;
        // momentum: fling distance ∝ velocity, decaying to rest
        const throwDeg = vx * dirX * 240;
        animate(yaw, yaw.get() + throwDeg, {
          type: "inertia",
          velocity: vx * dirX * 600,
          power: 0.5,
          timeConstant: 420,
          restDelta: 0.4,
        });
        // pitch always eases back toward the neutral 3/4 view
        animate(pitch, 6, { type: "spring", stiffness: 180, damping: 24 });
      }
    },
    { filterTaps: true, pointer: { touch: true } },
  );

  // scripted 360 from the Spin button
  useEffect(() => {
    if (!spinSignal) return;
    haptic("success");
    animate(yaw, yaw.get() + 360, {
      duration: 1.15,
      ease: [0.22, 0.9, 0.28, 1],
    });
  }, [spinSignal, yaw]);

  const rotate = useTransform(
    [smoothYaw, smoothPitch],
    ([y, p]: number[]) => `rotateX(${p}deg) rotateY(${y}deg)`,
  );

  // face fades out as it turns away; back fades in — the crossfade hides the
  // silhouette swap at the ±90° profile angles
  const faceOpacity = useTransform(smoothYaw, (v) => {
    const a = ((((v + 90) % 360) + 360) % 360) - 90; // wrap into [-90, 270)
    return Math.abs(a) < 90 ? 1 : 0;
  });
  const backOpacity = useTransform(faceOpacity, (v) => 1 - v);
  const shadowScale = useTransform(smoothPitch, [-22, 22], [1.1, 0.86]);

  const handleTap = useCallback(() => {
    if (!onPat) return;
    onPat();
  }, [onPat]);

  return (
    <div
      {...bind()}
      onClick={handleTap}
      role="button"
      tabIndex={0}
      aria-label="Your pet in 3D — drag to spin, tap to pat"
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") animate(yaw, yaw.get() - 45, { duration: 0.3 });
        if (e.key === "ArrowRight") animate(yaw, yaw.get() + 45, { duration: 0.3 });
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleTap();
        }
      }}
      className="relative flex h-[300px] w-full cursor-grab touch-none select-none items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 active:cursor-grabbing dark:focus-visible:ring-amethyst/60"
      style={{ perspective: 900 }}
    >
      {/* contact shadow */}
      <motion.div
        aria-hidden
        className="absolute bottom-9 h-4 w-40 rounded-[50%] bg-pine/20 blur-md dark:bg-black/60"
        style={{ scaleX: shadowScale }}
      />

      <motion.div
        className="relative"
        style={{
          width: 168,
          height: 178,
          transformStyle: "preserve-3d",
          transform: rotate,
        }}
        // idle bob + breathing, layered on top of the user's yaw
        animate={{ y: [0, -rig.bob, 0] }}
        transition={{ duration: rig.breath * 1.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* ears */}
        <Limb fur={fur} x={-52} y={-78} z={6} w={44} h={54} rot={-18} />
        <Limb fur={fur} x={52} y={-78} z={6} w={44} h={54} rot={18} />
        {/* arms */}
        <Limb fur={fur} x={-78} y={26} z={12} w={34} h={44} rot={-12} />
        <Limb fur={fur} x={78} y={26} z={12} w={34} h={44} rot={12} />
        {/* feet */}
        <Limb fur={fur} x={-32} y={84} z={16} w={44} h={30} rot={-6} />
        <Limb fur={fur} x={32} y={84} z={16} w={44} h={30} rot={6} />

        <BodySlabs fur={fur} />

        <motion.div style={{ opacity: faceOpacity, transformStyle: "preserve-3d" }}>
          <Face fur={fur} personality={personality} z={DEPTH / 2 + 1} />
          <Accessory kind={accessory} fur={fur} z={DEPTH / 2 + 3} />
        </motion.div>

        <motion.div style={{ opacity: backOpacity, transformStyle: "preserve-3d" }}>
          <Back fur={fur} z={-DEPTH / 2 - 1} />
        </motion.div>
      </motion.div>
    </div>
  );
});
