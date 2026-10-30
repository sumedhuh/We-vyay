/// <reference types="@react-three/fiber" />
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { STAGE, stageHalf, accentLightColorById } from "../scene/diorama";
import { useSceneStore } from "../scene/store";
import { analyzeWallLuminance, sampleLuminance } from "../scene/wallTexture";

/* ============================================================
   ADAPTIVE NEON ACCENT LIGHTING

   Strips trace the wall corners, the wall edges and the platform
   rim. Instead of a fixed brightness, every wall strip samples the
   generated wallpaper at its own position: bright wallpaper patches
   glow, dark patches fade the strip down. The platform rim uses the
   wallpaper's overall brightness so the whole rig reads as one
   lighting design.
   ============================================================ */

/** Maps a sampled luminance (0..1) to a light output (0..1). */
function lumaToOutput(v: number) {
  const t = Math.min(1, Math.max(0, (v - 0.14) / 0.5));
  return 0.06 + t * t * (3 - 2 * t) * 0.94; // smoothstep ramp, never fully off
}

function makeStripMaterial(hex: string, output: number, strength: number) {
  return new THREE.MeshStandardMaterial({
    color: hex,
    emissive: new THREE.Color(hex),
    emissiveIntensity: 2.6 * output * strength,
    toneMapped: false,
    roughness: 0.4,
  });
}

/* A single emissive bar with its own brightness. */
function Strip({
  position,
  args,
  rotation,
  hex,
  output,
  strength,
}: {
  position: [number, number, number];
  args: [number, number, number];
  rotation?: [number, number, number];
  hex: string;
  output: number;
  strength: number;
}) {
  const mat = useMemo(() => makeStripMaterial(hex, output, strength), [hex, output, strength]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh position={position} rotation={rotation} material={mat} raycast={() => null} userData={{ noStyle: true }}>
      <boxGeometry args={args} />
    </mesh>
  );
}

/** Soft point light whose reach follows the same output curve. */
function Spill({
  position,
  hex,
  output,
  intensity,
  distance,
}: {
  position: [number, number, number];
  hex: string;
  output: number;
  intensity: number;
  distance: number;
}) {
  return <pointLight position={position} color={hex} intensity={intensity * output} distance={distance} decay={2} />;
}

export default function AccentLights({ indoor }: { indoor: boolean }) {
  const on = useSceneStore((s) => s.accentLightsOn);
  const colorId = useSceneStore((s) => s.accentLightId);
  const strength = useSceneStore((s) => s.accentLightIntensity);
  const coveringId = useSceneStore((s) => s.wallCoveringId);

  const hex = accentLightColorById(colorId).hex;
  const half = stageHalf();

  // Brightness map of whatever wallpaper is currently on the walls.
  const lum = useMemo(() => (on ? analyzeWallLuminance(coveringId) : null), [on, coveringId]);

  const haloMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: hex,
        transparent: true,
        opacity: 0.15 * strength,
        toneMapped: false,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    [hex, strength]
  );
  useEffect(() => () => haloMat.dispose(), [haloMat]);

  if (!on) return null;

  const T = 0.055;
  const wallTop = STAGE.wallHeight - 0.08;
  const inset = half - 0.02;

  /** sample the wallpaper under a world position on either cutaway wall */
  const at = (_wall: "back" | "left", along: number, y: number) => {
    if (!lum) return 0.5;
    const u = (along + half) / (2 * half);
    const v = y / STAGE.wallHeight;
    return sampleLuminance(lum, u, v);
  };
  const outputAt = (wall: "back" | "left", along: number, y: number) =>
    lumaToOutput(at(wall, along, y));

  // Whole-wall average drives the platform rim + corner beacons.
  const avg = lum ? lumaToOutput(lum.avg) : 0.5;
  const rimOut = 0.35 + avg * 0.65;

  const spill = 9 * strength;

  return (
    <group>
      {/* ---------------- PLATFORM RIM ---------------- */}
      {[
        { p: [0, 0.045, -half] as [number, number, number], s: [STAGE.size, T, T] as [number, number, number] },
        { p: [0, 0.045, half] as [number, number, number], s: [STAGE.size, T, T] as [number, number, number] },
        { p: [-half, 0.045, 0] as [number, number, number], s: [T, T, STAGE.size] as [number, number, number] },
        { p: [half, 0.045, 0] as [number, number, number], s: [T, T, STAGE.size] as [number, number, number] },
      ].map((bar, i) => (
        <Strip key={`rim-${i}`} position={bar.p} args={bar.s} hex={hex} output={rimOut} strength={strength} />
      ))}

      {/* inward glow wash */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} material={haloMat} raycast={() => null} userData={{ noStyle: true }}>
        <ringGeometry args={[half - 0.85, half - 0.02, 4]} />
      </mesh>

      {/* corner beacons */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <group key={`beacon-${i}`} position={[sx * (half - 0.04), 0.12, sz * (half - 0.04)]}>
          <mesh material={makeStripMaterial(hex, rimOut, strength)} raycast={() => null} userData={{ noStyle: true }}>
            <boxGeometry args={[0.13, 0.2, 0.13]} />
          </mesh>
          <Spill position={[0, 0, 0]} hex={hex} output={rimOut} intensity={spill * 0.5} distance={5} />
        </group>
      ))}

      {/* ---------------- WALL STRIPS ---------------- */}
      {indoor && (
        <group>
          {/* vertical corner strips — inner corner + each open end */}
          {([
            { wall: "back" as const, along: -inset },
            { wall: "back" as const, along: inset },
            { wall: "left" as const, along: inset },
          ]).map((c, i) => {
            // brightness sampled at mid height of the corner
            const o = outputAt(c.wall, c.along, STAGE.wallHeight * 0.5);
            const pos: [number, number, number] =
              c.wall === "back" ? [c.along, STAGE.wallHeight / 2, -inset] : [-inset, STAGE.wallHeight / 2, c.along];
            return (
              <group key={`corner-${i}`} position={pos}>
                <Strip position={[0, 0, 0]} args={[T * 1.4, STAGE.wallHeight - 0.16, T * 1.4]} hex={hex} output={o} strength={strength} />
                <Spill position={[0, 0.6, 0]} hex={hex} output={o} intensity={spill} distance={7} />
                <Spill position={[0, -0.9, 0]} hex={hex} output={o} intensity={spill * 0.7} distance={6} />
              </group>
            );
          })}

          {/* BACK WALL — top + bottom rails, each split into segments so the
              brightness can follow the wallpaper along the wall */}
          <WallRail wall="back" y={wallTop} outputAt={outputAt} hex={hex} strength={strength} inset={inset} T={T} />
          <WallRail wall="back" y={0.16} outputAt={outputAt} hex={hex} strength={strength} inset={inset} T={T} />

          {/* LEFT WALL — top + bottom rails */}
          <WallRail wall="left" y={wallTop} outputAt={outputAt} hex={hex} strength={strength} inset={inset} T={T} />
          <WallRail wall="left" y={0.16} outputAt={outputAt} hex={hex} strength={strength} inset={inset} T={T} />

          {/* wall-wash spills behind the rails */}
          <Spill position={[0, wallTop - 0.3, -half + 0.6]} hex={hex} output={avg} intensity={spill * 1.2} distance={9} />
          <Spill position={[0, 0.5, -half + 0.6]} hex={hex} output={avg} intensity={spill * 0.8} distance={8} />
          <Spill position={[-half + 0.6, wallTop - 0.3, 0]} hex={hex} output={avg} intensity={spill * 1.2} distance={9} />
          <Spill position={[-half + 0.6, 0.5, 0]} hex={hex} output={avg} intensity={spill * 0.8} distance={8} />

          {/* faint bloom hugging each wall */}
          <mesh position={[0, STAGE.wallHeight / 2, -half + 0.05]} material={haloMat} raycast={() => null} userData={{ noStyle: true }}>
            <planeGeometry args={[STAGE.size, STAGE.wallHeight]} />
          </mesh>
          <mesh
            position={[-half + 0.05, STAGE.wallHeight / 2, 0]}
            rotation={[0, Math.PI / 2, 0]}
            material={haloMat}
            raycast={() => null}
            userData={{ noStyle: true }}
          >
            <planeGeometry args={[STAGE.size, STAGE.wallHeight]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/**
 * A horizontal rail broken into segments, so brightness tracks the
 * wallpaper underneath instead of being uniform along the wall.
 */
function WallRail({
  wall,
  y,
  outputAt,
  hex,
  strength,
  inset,
  T,
}: {
  wall: "back" | "left";
  y: number;
  outputAt: (w: "back" | "left", along: number, y: number) => number;
  hex: string;
  strength: number;
  inset: number;
  T: number;
}) {
  const SEGMENTS = 8;
  const span = STAGE.size - 0.1;
  const step = span / SEGMENTS;
  const ref = useRef<THREE.Group>(null!);

  return (
    <group ref={ref}>
      {Array.from({ length: SEGMENTS }, (_, i) => {
        const along = -span / 2 + step * (i + 0.5);
        const o = outputAt(wall, along, y);
        const pos: [number, number, number] =
          wall === "back" ? [along, y, -inset] : [-inset, y, along];
        return <Strip key={i} position={pos} args={[step, T, T]} hex={hex} output={o} strength={strength} />;
      })}
    </group>
  );
}


