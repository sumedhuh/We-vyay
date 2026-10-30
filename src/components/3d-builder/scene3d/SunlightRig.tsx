import { useMemo } from "react";
import * as THREE from "three";
import { STAGE, stageHalf } from "../scene/diorama";

/* ============================================================
   GOLDEN HOUR SUNLIGHT

   A large window sits just off-camera to the LEFT (-X). Warm light
   streams through it at a low angle, throwing hard-edged geometric
   window patterns across the floor and the back wall, and casting
   crisp shadows from the athlete and every prop.

   A cool rim light sits behind the athlete to separate him from
   the background. No point-light hotspots touch the floor, so the
   surface stays soft and diffuse.
   ============================================================ */

const SUN_COLOR = "#ffd9a0";
const SUN_WARM = "#ffb469";
const RIM_COLOR = "#a8c8ff";

/** A single bright quad representing a pane of light on a surface. */
function LightPatch({
  position,
  rotation,
  size,
  opacity,
  color = SUN_COLOR,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  opacity: number;
  color?: string;
}) {
  return (
    <mesh position={position} rotation={rotation} raycast={() => null} userData={{ noStyle: true }}>
      <planeGeometry args={size} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

export default function SunlightRig({ night }: { night?: boolean }) {
  const half = stageHalf();

  // Sun sits low and to the left, slightly behind — classic golden hour.
  const sunPos = useMemo<[number, number, number]>(() => [-8.5, 5.2, -3.4], []);

  if (night) {
    // At night the window becomes cool moonlight instead of gold.
    return (
      <group>
        <directionalLight
          position={sunPos}
          color="#9fb8e8"
          intensity={0.55}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
          shadow-camera-near={0.5}
          shadow-camera-far={26}
        />
        <directionalLight position={[3.5, 2.4, 4.2]} color={RIM_COLOR} intensity={0.5} />
      </group>
    );
  }

  return (
    <group>
      {/* ---- KEY: the sun itself, hard shadows, warm ---- */}
      <directionalLight
        position={sunPos}
        color={SUN_COLOR}
        intensity={3.1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={0.5}
        shadow-camera-far={26}
      />

      {/* ---- BOUNCE: soft warm fill from the sunlit floor, no shadows ---- */}
      <directionalLight position={[-2.2, 1.1, 2.6]} color={SUN_WARM} intensity={0.34} />

      {/* ---- RIM: cool separation behind the athlete ---- */}
      <directionalLight position={[2.8, 2.2, -4.2]} color={RIM_COLOR} intensity={0.85} />
      <directionalLight position={[4.2, 1.6, 3.6]} color={RIM_COLOR} intensity={0.35} />

      {/* ============ WINDOW PATTERNS ============
          Hard-edged panes of light thrown across the floor and the
          back wall, angled to match the sun direction. */}

      {/* floor panes — a 2x2 window grid, skewed by the low sun angle */}
      <group position={[0, 0.012, 0]} rotation={[0, -0.36, 0]}>
        {[
          { x: -1.15, z: -0.55 },
          { x: 0.42, z: -0.92 },
          { x: -0.78, z: 0.95 },
          { x: 0.82, z: 0.58 },
        ].map((p, i) => (
          <LightPatch
            key={i}
            position={[p.x, 0, p.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            size={[1.28, 1.95]}
            opacity={0.15}
          />
        ))}
        {/* soft overall pool tying the panes together */}
        <LightPatch
          position={[-0.18, -0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          size={[4.1, 4.6]}
          opacity={0.055}
        />
      </group>

      {/* back wall panes — the same window, projected higher up */}
      <group position={[0, 0, -half + 0.03]}>
        {[
          { x: -1.5, y: 1.62 },
          { x: -0.05, y: 1.5 },
        ].map((p, i) => (
          <LightPatch
            key={i}
            position={[p.x, p.y, 0]}
            rotation={[0, 0, 0.13]}
            size={[1.1, 1.45]}
            opacity={0.12}
          />
        ))}
        <LightPatch position={[-0.8, 1.45, 0.002]} rotation={[0, 0, 0.13]} size={[3.4, 2.4]} opacity={0.04} />
      </group>

      {/* right wall catches a sliver of the same light */}
      <LightPatch
        position={[half - 0.03, 1.35, -0.6]}
        rotation={[0, -Math.PI / 2, 0.1]}
        size={[1.5, 1.6]}
        opacity={0.06}
      />

      {/* ---- volumetric shafts: thin angled planes from the window ---- */}
      <group position={[-half + 0.1, STAGE.wallHeight * 0.72, -0.4]} rotation={[0, 0, -0.52]}>
        {[0, 1, 2].map((i) => (
          <mesh
            key={i}
            position={[1.5 + i * 0.28, -1.1 - i * 0.22, -0.9 + i * 0.95]}
            rotation={[0, -0.36, 0]}
            raycast={() => null}
            userData={{ noStyle: true }}
          >
            <planeGeometry args={[0.72, 4.6]} />
            <meshBasicMaterial
              color={SUN_COLOR}
              transparent
              opacity={0.045}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

