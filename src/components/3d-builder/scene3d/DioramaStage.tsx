import { useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { STAGE, stageHalf, type DioramaTheme } from "../scene/diorama";
import WallCoveringPanels from "./WallCoveringPanels";
import AccentLights from "./AccentLights";
import SunlightRig from "./SunlightRig";
import { FLOOR_COVERINGS } from "../scene/data";
import { useSceneStore } from "../scene/store";

/* ------------------------------------------------------------------
   THE FLOATING STAGE
   - top face is exactly y = 0 so the athlete's floor animation is untouched
   - visible snap grid
   - Cutaway walls: only the two walls away from the isometric camera are built,
     so nothing blocks the view of the athlete.
   ------------------------------------------------------------------ */
export default function DioramaStage({ theme, night }: { theme: DioramaTheme; night?: boolean }) {
  const half = stageHalf();
  const cellCount = Math.round(STAGE.size / STAGE.cell);
  const floor = night ? theme.night.floor : theme.floor;
  const floorAccent = night ? theme.night.floor : theme.floorAccent;
  const wall = night ? theme.night.wall : theme.wall;
  const wallTrim = night ? theme.night.wallTrim : theme.wallTrim;
  const n = theme.night;

  const gridPositions = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i <= cellCount; i++) {
      const p = -half + i * STAGE.cell;
      pts.push(p, 0, -half, p, 0, half);
      pts.push(-half, 0, p, half, 0, p);
    }
    return new Float32Array(pts);
  }, [half, cellCount]);

  const gridColor = useMemo(
    () => new THREE.Color(floor).lerp(new THREE.Color(wallTrim), 0.55),
    [floor, wallTrim]
  );

  const isOutdoors = !theme.indoor;

  return (
    <group>
      {/* ---------- platform slab ----------
          Fully matte: roughness 1 / metalness 0 so no specular hotspot
          can form on the floor under the sunlight. */}
      <mesh position={[0, -STAGE.thickness / 2, 0]} receiveShadow castShadow>
        <boxGeometry args={[STAGE.size, STAGE.thickness, STAGE.size]} />
        <meshStandardMaterial color={floor} roughness={1} metalness={0} />
      </mesh>

      {/* user-selected floor finish */}
      <FloorFinish night={night} />

      {/* inner panel — subtle tonal shift, still fully diffuse */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]} receiveShadow>
        <planeGeometry args={[STAGE.size - 0.8, STAGE.size - 0.8]} />
        <meshStandardMaterial color={floorAccent} roughness={1} metalness={0} />
      </mesh>

      {/* ---------- clean grid pattern ---------- */}
      <lineSegments position={[0, 0.008, 0]} raycast={() => null} userData={{ noStyle: true }}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[gridPositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={gridColor} transparent opacity={0.3} />
      </lineSegments>

      {/* ---------- edge trim: frames the stage against the sky ---------- */}
      {[
        { p: [0, 0.014, -half] as [number, number, number], s: [STAGE.size, 0.06, 0.11] as [number, number, number] },
        { p: [0, 0.014, half] as [number, number, number], s: [STAGE.size, 0.06, 0.11] as [number, number, number] },
        { p: [-half, 0.014, 0] as [number, number, number], s: [0.11, 0.06, STAGE.size] as [number, number, number] },
        { p: [half, 0.014, 0] as [number, number, number], s: [0.11, 0.06, STAGE.size] as [number, number, number] },
      ].map((b, i) => (
        <mesh key={i} position={b.p} raycast={() => null}>
          <boxGeometry args={b.s} />
          <meshStandardMaterial color={wallTrim} roughness={0.85} />
        </mesh>
      ))}

      {/* outdoor stages get a soft grass / soil skirt under the slab */}
      {isOutdoors && (
        <mesh position={[0, -STAGE.thickness - 0.06, 0]} raycast={() => null}>
          <boxGeometry args={[STAGE.size - 0.5, 0.12, STAGE.size - 0.5]} />
          <meshStandardMaterial color={wallTrim} roughness={1} />
        </mesh>
      )}

      {/* ---------- CUTAWAY WALLS (indoor only) ----------
          Only −Z (back) and −X (left) are built; +Z and +X are removed. */}
      {theme.indoor && (
        <group>
          {/* back wall */}
          <mesh position={[0, STAGE.wallHeight / 2, -half - 0.07]} receiveShadow>
            <boxGeometry args={[STAGE.size, STAGE.wallHeight, 0.14]} />
            <meshStandardMaterial color={wall} roughness={0.94} side={THREE.DoubleSide} />
          </mesh>
          {/* left wall */}
          <mesh position={[-half - 0.07, STAGE.wallHeight / 2, 0]} receiveShadow>
            <boxGeometry args={[0.14, STAGE.wallHeight, STAGE.size]} />
            <meshStandardMaterial color={wall} roughness={0.94} side={THREE.DoubleSide} />
          </mesh>

          {/* user-selected covering across both visible wall interiors */}
          <WallCoveringPanels night={night} />

          {/* skirting + capping trim on both cutaway walls */}
          {[
            { p: [0, 0.07, -half] as [number, number, number], s: [STAGE.size, 0.14, 0.1] as [number, number, number] },
            { p: [-half, 0.07, 0] as [number, number, number], s: [0.1, 0.14, STAGE.size] as [number, number, number] },
            { p: [0, STAGE.wallHeight, -half] as [number, number, number], s: [STAGE.size, 0.1, 0.12] as [number, number, number] },
            { p: [-half, STAGE.wallHeight, 0] as [number, number, number], s: [0.12, 0.1, STAGE.size] as [number, number, number] },
          ].map((b, i) => (
            <mesh key={i} position={b.p}>
              <boxGeometry args={b.s} />
              <meshStandardMaterial color={wallTrim} roughness={0.8} />
            </mesh>
          ))}

          {/* corner post grounds the two walls */}
          <mesh position={[-half, STAGE.wallHeight / 2, -half]}>
            <boxGeometry args={[0.22, STAGE.wallHeight, 0.22]} />
            <meshStandardMaterial color={wallTrim} roughness={0.82} />
          </mesh>

          {/* ---------- NIGHT MODE: the room's own lights switch on ---------- */}
          {night && (
            <group>
              {/* ceiling panel lights over the workout zone */}
              {[
                { p: [0, STAGE.wallHeight - 0.14, -2.4] as [number, number, number] },
                { p: [0, STAGE.wallHeight - 0.14, 1.4] as [number, number, number] },
                { p: [-3.2, STAGE.wallHeight - 0.14, -0.6] as [number, number, number] },
                { p: [3.2, STAGE.wallHeight - 0.14, -0.6] as [number, number, number] },
              ].map((l, i) => (
                <group key={i} position={l.p}>
                  {/* recessed housing */}
                  <mesh raycast={() => null}>
                    <cylinderGeometry args={[0.34, 0.34, 0.07, 20]} />
                    <meshStandardMaterial color="#2b3038" roughness={0.55} metalness={0.4} />
                  </mesh>
                  {/* glowing diffuser */}
                  <mesh position={[0, -0.045, 0]} raycast={() => null}>
                    <cylinderGeometry args={[0.28, 0.28, 0.03, 20]} />
                    <meshStandardMaterial
                      color={n.ceilingLightColor}
                      emissive={n.ceilingLightColor}
                      emissiveIntensity={2.4}
                      toneMapped={false}
                    />
                  </mesh>
                  <pointLight
                    position={[0, -0.35, 0]}
                    color={n.ceilingLightColor}
                    intensity={n.ceilingLightIntensity}
                    distance={7.5}
                    decay={2}
                  />
                </group>
              ))}

              {/* wall sconces along the cutaway walls */}
              {[
                { p: [3.4, 1.95, -half + 0.14] as [number, number, number], rot: 0 },
                { p: [-3.4, 1.95, -half + 0.14] as [number, number, number], rot: 0 },
                { p: [-half + 0.14, 1.95, 3.4] as [number, number, number], rot: Math.PI / 2 },
                { p: [-half + 0.14, 1.95, -3.4] as [number, number, number], rot: Math.PI / 2 },
              ].map((s, i) => (
                <group key={`sconce-${i}`} position={s.p} rotation={[0, s.rot, 0]}>
                  {/* shade */}
                  <mesh raycast={() => null}>
                    <cylinderGeometry args={[0.1, 0.16, 0.2, 14, 1, true]} />
                    <meshStandardMaterial
                      color={n.lampColor}
                      emissive={n.lampColor}
                      emissiveIntensity={1.5}
                      side={THREE.DoubleSide}
                      roughness={0.5}
                    />
                  </mesh>
                  {/* bulb */}
                  <mesh position={[0, -0.05, 0.03]} raycast={() => null}>
                    <sphereGeometry args={[0.055, 12, 10]} />
                    <meshStandardMaterial
                      color="#fff6e0"
                      emissive="#fff6e0"
                      emissiveIntensity={2.8}
                      toneMapped={false}
                    />
                  </mesh>
                  <pointLight
                    position={[0, -0.1, 0.35]}
                    color={n.lampColor}
                    intensity={n.lampIntensity}
                    distance={5.5}
                    decay={2}
                  />
                </group>
              ))}

              {/* skirting downlights */}
              {[
                { p: [2.2, 0.1, -half + 0.16] as [number, number, number] },
                { p: [-2.2, 0.1, -half + 0.16] as [number, number, number] },
                { p: [-half + 0.16, 0.1, 2.2] as [number, number, number] },
              ].map((d, i) => (
                <pointLight
                  key={`down-${i}`}
                  position={d.p}
                  intensity={n.lampIntensity * 0.45}
                  distance={4.5}
                  color={n.lampColor}
                  decay={2}
                />
              ))}
            </group>
          )}
        </group>
      )}

      {/* golden hour sunlight */}
      <SunlightRig night={night} />

      {/* optional neon accent rig */}
      <AccentLights indoor={theme.indoor} />
    </group>
  );
}

/* Floor finish — painted material or uploaded artwork, rendered as a soft
   top skin over the stage floor without touching the grid below. */
function FloorFinish({ night }: { night?: boolean }) {
  const floorCoveringId = useSceneStore((s) => s.floorCoveringId);
  const floorTextureUrl = useSceneStore((s) => s.floorTextureUrl);
  const [tex, setTex] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (!floorTextureUrl || floorCoveringId !== "upload") { setTex(null); return; }
    const img = new Image();
    img.onload = () => {
      const t = new THREE.Texture(img);
      t.needsUpdate = true;
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
    };
    img.src = floorTextureUrl;
  }, [floorTextureUrl, floorCoveringId]);

  if (!floorCoveringId || floorCoveringId === "theme") return null;

  const def = FLOOR_COVERINGS.find((c) => c.id === floorCoveringId);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.011, 0]} receiveShadow>
      <planeGeometry args={[STAGE.size, STAGE.size]} />
      {floorCoveringId === "upload" && tex ? (
        <meshStandardMaterial map={tex} roughness={0.92} metalness={0} toneMapped={!night} />
      ) : (
        <meshStandardMaterial color={def?.base ?? "#262a31"} roughness={0.95} metalness={0} />
      )}
    </mesh>
  );
}


