/// <reference types="@react-three/fiber" />
import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import Athlete from "./Athlete";
import PoseAthlete from "./PoseAthlete";
import SceneWorld from "./scene3d/SceneWorld";
import { useSceneStore } from "./scene/store";
import { usePushupStore } from "./store";
import { dioramaThemeById, STAGE } from "./scene/diorama";
import { styleById, resolveAtmosphere } from "./scene/style";

/* ============================================================
   CAMERA PRESETS — "hero" is the isometric diorama view
   ============================================================ */
const PRESETS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  hero: { pos: [9.2, 7.3, 9.2], target: [0, 0.75, -0.2] },   // wide isometric showing the whole room
  top: { pos: [7.6, 11.4, 7.6], target: [0, 0.45, -0.2] },
  low: { pos: [10.2, 3.2, 10.2], target: [0, 1.1, -0.1] },
  side: { pos: [12.0, 3.0, 0.4], target: [0, 0.7, -0.2] },
  front: { pos: [0.4, 4.0, 11.6], target: [0, 0.7, 0] },
  close: { pos: [4.6, 2.4, 4.6], target: [0, 0.7, 0] },
  back: { pos: [-9.2, 6.2, -9.2], target: [0, 0.7, -0.2] },
};

/**
 * Compute an isometric camera position that frames the whole stage
 * for the current viewport aspect ratio.
 */
function autoFitPosition(camera: THREE.PerspectiveCamera): { pos: THREE.Vector3; target: THREE.Vector3 } {
  const half = STAGE.size / 2;
  // frame the workout zone, not the far corners — keeps the shot intimate
  const radius = half * 1.0 + 0.6;
  const vFov = THREE.MathUtils.degToRad(camera.fov || 40);
  const aspect = Math.max(camera.aspect || 1, 0.1); // Prevent 0 aspect ratio
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect);
  const minFov = Math.max(Math.min(vFov, hFov), 0.01); // Prevent division by zero
  const fitDist = radius / Math.sin(minFov / 2);
  // 45° isometric direction, ~32° downward
  const dir = new THREE.Vector3(1, 0.72, 1).normalize();
  const target = new THREE.Vector3(0, 0.62, -0.2);
  const pos = target.clone().add(dir.multiplyScalar(fitDist * 0.95));
  return { pos, target };
}

function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null!);
  const preset = usePushupStore((s) => s.cameraPreset);
  const workoutMode = usePushupStore((s) => s.workout.mode);
  const isFaceMode = workoutMode === "face";
  const autoRotate = usePushupStore((s) => s.autoRotate);
  const autoFit = useSceneStore((s) => s.autoFit);
  const { camera, size } = useThree();

  const anim = useRef({
    t: 1,
    fromPos: new THREE.Vector3(),
    fromTg: new THREE.Vector3(),
    toPos: new THREE.Vector3(...PRESETS.hero.pos),
    toTg: new THREE.Vector3(...PRESETS.hero.target),
  });

  const flyTo = (pos: THREE.Vector3, target: THREE.Vector3) => {
    anim.current.fromPos.copy(camera.position);
    anim.current.fromTg.copy(controlsRef.current?.target ?? new THREE.Vector3());
    anim.current.toPos.copy(pos);
    anim.current.toTg.copy(target);
    anim.current.t = 0;
  };

  /* preset changes */
  useEffect(() => {
    if (autoFit && !isFaceMode) return;
    const p = isFaceMode ? { pos: [0, 1.7, 0.9] as [number, number, number], target: [0, 1.6, 0] as [number, number, number] } : PRESETS[preset] ?? PRESETS.hero;
    flyTo(new THREE.Vector3(...p.pos), new THREE.Vector3(...p.target));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset, isFaceMode]);

  /* auto fit: on toggle and whenever the viewport aspect changes */
  useEffect(() => {
    if (!autoFit || isFaceMode) return;
    const cam = camera as THREE.PerspectiveCamera;
    const { pos, target } = autoFitPosition(cam);
    flyTo(pos, target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFit, size.width, size.height, isFaceMode]);

  useFrame((_, delta) => {
    const a = anim.current;
    if (a.t < 1) {
      a.t = Math.min(1, a.t + delta * 1.7);
      const e = 1 - Math.pow(1 - a.t, 3);
      camera.position.lerpVectors(a.fromPos, a.toPos, e);
      if (controlsRef.current) {
        controlsRef.current.target.lerpVectors(a.fromTg, a.toTg, e);
        controlsRef.current.update();
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      minDistance={isFaceMode ? 0.3 : 2.5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2 - 0.04}
      autoRotate={autoRotate}
      autoRotateSpeed={0.9}
      target={PRESETS.hero.target}
    />
  );
}

/* ============================================================
   EXERCISE MAT — sits under the athlete at stage centre.
   The stage top is y = 0, so the mat is a thin slab on top of it.
   ============================================================ */
function ExerciseMat() {
  const theme = useSceneStore((s) => dioramaThemeById(s.activeWorld));
  const matColor = theme.indoor ? "#20242a" : "#20262c";
  const edgeColor = "#4a515c"; // quiet graphite trim — lime is reserved for gameplay
  return (
    <group position={[0, 0, -0.3]}>
      {/* main mat body — matte rubber, never intercepts pointer events */}
      <mesh position={[0, 0.014, 0]} receiveShadow castShadow raycast={() => null}>
        <boxGeometry args={[1.35, 0.028, 2.7]} />
        <meshStandardMaterial color={matColor} roughness={1} metalness={0} />
      </mesh>
      {/* stitched border */}
      <mesh position={[0, 0.03, 0]} raycast={() => null}>
        <boxGeometry args={[1.42, 0.005, 2.77]} />
        <meshStandardMaterial color={edgeColor} roughness={1} metalness={0} />
      </mesh>
      {/* centre alignment line */}
      <mesh position={[0, 0.031, 0]} raycast={() => null}>
        <boxGeometry args={[0.022, 0.002, 2.3]} />
        <meshStandardMaterial color={edgeColor} roughness={1} metalness={0} />
      </mesh>
    </group>
  );
}

/* ============================================================
   SCENE CONTENTS
   ============================================================ */
function SceneContents() {
  const useCustom = usePushupStore((s) => s.useCustom);
  const workoutMode = usePushupStore((s) => s.workout.mode);
  const isFaceMode = workoutMode === "face";
  const editorOpen = useSceneStore((s) => s.editorOpen);
  const night = useSceneStore((s) => s.nightMode);
  const theme = useSceneStore((s) => dioramaThemeById(s.activeWorld));
  const style = useSceneStore((s) => styleById(s.styleId));
  const air = resolveAtmosphere(style, theme, night);

  return (
    <>
      <color attach="background" args={[isFaceMode ? "#ffffff" : air.bg]} />
      {!isFaceMode && <fog attach="fog" args={[air.fogColor, air.fogNear, air.fogFar]} />}

      {!isFaceMode && <SceneWorld />}

      {/* mat is always visible so the placement reference matches the workout */}
      {!isFaceMode && <ExerciseMat />}

      {/* Athlete at natural scale in the larger room */}
      {!editorOpen && (
        <group scale={isFaceMode ? 1 : 1.18} position={[0, 0, -0.15]}>
          {useCustom ? <PoseAthlete /> : <Athlete />}
        </group>
      )}

      {/* grounding contact shadow, tinted to the warm sunlit floor */}
      {!isFaceMode && (
        <ContactShadows
          position={[0, 0.034, -0.3]}
          scale={6}
          blur={2.2}
          opacity={0.42}
          far={2.2}
          resolution={1024}
          color="#2a1638"
          frames={Infinity}
        />
      )}

      <CameraRig />
      <Environment preset="city" environmentIntensity={0.8} />
      <EffectComposer enableNormalPass={false} multisampling={4}>
        <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.5} />
        <Noise opacity={0.035} />
        <Vignette eskil={false} offset={0.1} darkness={1.1} />
      </EffectComposer>
    </>
  );
}

export default function PushupScene() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: PRESETS.hero.pos, fov: 40, near: 0.1, far: 290 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
    >
      <SceneContents />
    </Canvas>
  );
}


