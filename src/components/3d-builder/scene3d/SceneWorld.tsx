import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useSceneStore } from "../scene/store";
import { isWallKind, wallItemDef } from "../scene/data";
import {
  dioramaThemeById, pickStage, resolveFloorPlacement, stageHalf, CENTER_KEEP_OUT,
} from "../scene/diorama";
import AnimatedSky from "./AnimatedSky";
import DioramaStage from "./DioramaStage";
import DraggableItem from "./DraggableItem";
import SceneStyler from "./SceneStyler";
import { styleById } from "../scene/style";

/* ============================================================
   Live snap preview shown while dragging from the inventory
   ============================================================ */
function DragGhost() {
  const kind = useSceneStore((s) => s.dragKind);
  const type = useSceneStore((s) => s.dragType);
  const x = useSceneStore((s) => s.dragX);
  const y = useSceneStore((s) => s.dragY);
  const z = useSceneStore((s) => s.dragZ);
  const rot = useSceneStore((s) => s.dragRot);
  const ref = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (ref.current) ref.current.position.y = y + Math.sin(state.clock.elapsedTime * 3) * 0.03;
  });

  if (!kind) return null;

  return (
    <group position={[x, y, z]} rotation={[0, rot, 0]}>
      <group ref={ref}>
        {type === "screen" ? (
          <mesh>
            <boxGeometry args={[(wallItemDef(kind)?.width ?? 1.6) + 0.09, (wallItemDef(kind)?.height ?? 0.95) + 0.09, 0.075]} />
            <meshStandardMaterial color="#c6ff2e" transparent opacity={0.42} depthWrite={false} />
          </mesh>
        ) : (
          <mesh position={[0, 0.42, 0]}>
            <boxGeometry args={[0.7, 0.84, 0.7]} />
            <meshStandardMaterial color="#c6ff2e" transparent opacity={0.3} depthWrite={false} />
          </mesh>
        )}
      </group>
      {/* snap landing pad */}
      <mesh position={[0, 0.022, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.44, 0.5, 4]} />
        <meshBasicMaterial color="#c6ff2e" transparent opacity={0.9} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.017, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.44, 4]} />
        <meshBasicMaterial color="#c6ff2e" transparent opacity={0.14} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ============================================================
   DropBridge — HTML5 drag events → snapped world coordinates.
   Every drop is resolved through resolveFloorPlacement(), which
   snaps to the grid, dodges the athlete and clamps to the stage.
   ============================================================ */
function DropBridge() {
  const { camera, gl } = useThree();
  const raycaster = useMemo(() => new THREE.Raycaster(), []);

  useEffect(() => {
    const el = gl.domElement;

    const cast = (clientX: number, clientY: number, preferWall: boolean) => {
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - r.left) / r.width) * 2 - 1,
        -((clientY - r.top) / r.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      return pickStage(o.x, o.y, o.z, d.x, d.y, d.z, preferWall);
    };

    const apply = (e: DragEvent) => {
      const st = useSceneStore.getState();
      if (!st.dragKind) return;
      const preferWall = isWallKind(st.dragKind);
      const hit = cast(e.clientX, e.clientY, preferWall);
      if (!hit) return;
      st.setDrag({
        dragX: hit.x,
        dragY: preferWall ? hit.y : 0,
        dragZ: hit.z,
        dragRot: preferWall ? hit.rot : 0,
        dragSurface: preferWall ? hit.surface : "floor",
        dragWall: preferWall ? (hit.wall as never) : undefined,
      });
    };

    const onDragOver = (e: DragEvent) => {
      if (!e.dataTransfer?.types?.includes("text/plain")) return;
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      apply(e);
    };

    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      apply(e);
      useSceneStore.getState().commitDrag();
    };

    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget && el.contains(e.relatedTarget as Node)) return;
      useSceneStore.getState().clearDrag();
    };

    el.addEventListener("dragover", onDragOver);
    el.addEventListener("drop", onDrop);
    el.addEventListener("dragleave", onDragLeave);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("drop", onDrop);
      el.removeEventListener("dragleave", onDragLeave);
    };
  }, [camera, gl, raycaster]);

  return null;
}

/* ============================================================
   Workout zone reference — marks exactly where the athlete trains
   so users never block him. Only visible while editing.
   ============================================================ */
function WorkoutReference({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <group position={[0, 0.02, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <ringGeometry args={[CENTER_KEEP_OUT - 0.03, CENTER_KEEP_OUT, 56]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
        <circleGeometry args={[CENTER_KEEP_OUT - 0.06, 48]} />
        <meshBasicMaterial color="#8b5cf6" transparent opacity={0.07} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** boundary guide so users can see the draggable edge */
function StageBounds({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const half = stageHalf();
  return (
    <lineSegments position={[0, 0.03, 0]} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[
            new Float32Array([
              -half, 0, -half, half, 0, -half,
              half, 0, -half, half, 0, half,
              half, 0, half, -half, 0, half,
              -half, 0, half, -half, 0, -half,
            ]),
            3,
          ]}
        />
      </bufferGeometry>
      <lineBasicMaterial color="#c6ff2e" transparent opacity={0.4} />
    </lineSegments>
  );
}

/* ============================================================
   SceneWorld — the diorama composer.
   Rendered by BOTH the scene editor and the normal workout viewer,
   so the two can never drift out of sync. The athlete is rendered
   by the app, not here.
   ============================================================ */
export default function SceneWorld({ editable = false }: { editable?: boolean }) {
  const placements = useSceneStore((s) => s.placements);
  const editorOpen = useSceneStore((s) => s.editorOpen);
  const themeId = useSceneStore((s) => s.activeWorld);
  const night = useSceneStore((s) => s.nightMode);
  const theme = dioramaThemeById(themeId);
  const style = styleById(useSceneStore((s) => s.styleId));
  const active = editable || editorOpen;

  /* wall items only exist when the theme actually has walls */
  const visible = placements.filter((p) => (p.surface === "wall" ? theme.indoor : true));

  return (
    <group>
      <AnimatedSky theme={theme} night={night} style={style} />
      <DioramaStage theme={theme} night={night} />
      <WorkoutReference visible={active} />
      <StageBounds visible={active} />
      {visible.map((p) => (
        <DraggableItem key={p.id} item={p} editable={active} />
      ))}
      <DropBridge />
      {active && <DragGhost />}

      {/* art direction: re-shades the whole diorama */}
      <SceneStyler style={style} />
    </group>
  );
}

/** read-only variant used by the workout viewer */
export function ViewerScene() {
  return <SceneWorld editable={false} />;
}

export { resolveFloorPlacement };


