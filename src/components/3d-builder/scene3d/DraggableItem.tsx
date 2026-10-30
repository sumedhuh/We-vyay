import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import { TransformControls, Html } from "@react-three/drei";
import * as THREE from "three";
import type { Object3D } from "three";
import { useSceneStore } from "../scene/store";
import { furnitureDef, wallItemDef, type Placement } from "../scene/data";
import {
  pickStage, resolveFloorPlacement, clampWallHeight, stageHalf,
} from "../scene/diorama";
import { FurnitureMesh, PetMesh } from "./Props3D";
import ScreenMesh from "./ScreenMesh";
import UploadedAssetMesh from "./UploadedAssetMesh";

/* generous minimum grab volume so small props are easy to hit */
const MIN_HIT_W = 0.95;
const MIN_HIT_H = 1.05;
const HIT_PAD = 1.35;

/**
 * A placed scene object.
 *
 *  MOVE   → grab the object anywhere and it follows the cursor 1:1.
 *           Snapping is applied on release, so the drag feels smooth.
 *  ROTATE → drag the Y ring, or use the rotation slider in the panel.
 *
 * Performance: nothing here sets React state during a drag. The mesh is
 * mutated directly and the store is written once on pointer-up.
 */
export default function DraggableItem({ item, editable }: { item: Placement; editable: boolean }) {
  const groupRef = useRef<THREE.Group>(null!);
  const bodyRef = useRef<THREE.Group>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);

  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const [gizmoReady, setGizmoReady] = useState(false);
  const [hit, setHit] = useState({ w: MIN_HIT_W, h: MIN_HIT_H, d: MIN_HIT_W, cy: MIN_HIT_H / 2 });

  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const selectedId = useSceneStore((s) => s.selectedId);
  const gizmoMode = useSceneStore((s) => s.gizmoMode);
  const setSelected = useSceneStore((s) => s.setSelected);
  const updatePlacement = useSceneStore((s) => s.updatePlacement);
  const { camera, gl, controls, invalidate } = useThree();

  const isSelected = editable && selectedId === item.id;
  const isWall = item.surface === "wall";

  /* ---- measure the real bounds once so the hitbox always wraps the art ---- */
  useEffect(() => {
    setGizmoReady(true);
    const id = window.setTimeout(() => {
      const b = bodyRef.current;
      if (!b) return;
      const box = new THREE.Box3().setFromObject(b);
      if (!isFinite(box.min.x) || box.isEmpty()) return;
      const size = box.getSize(new THREE.Vector3());
      const centre = box.getCenter(new THREE.Vector3());
      setHit({
        w: Math.max(MIN_HIT_W, size.x * HIT_PAD),
        h: Math.max(MIN_HIT_H, size.y * HIT_PAD),
        d: Math.max(MIN_HIT_W, size.z * HIT_PAD),
        cy: Math.max(size.y / 2, centre.y),
      });
    }, 120);
    return () => window.clearTimeout(id);
  }, [item.kind, item.type]);

  /* ---- keep the object in sync with the store while not dragging ---- */
  useEffect(() => {
    const g = groupRef.current;
    if (!g || draggingRef.current) return;
    g.position.set(item.x, item.y, item.z);
    g.rotation.set(0, item.rot, 0);
    g.scale.setScalar(item.scale);
    invalidate();
  }, [item.x, item.y, item.z, item.rot, item.scale, invalidate]);

  const setOrbit = useCallback((enabled: boolean) => {
    const o = controls as unknown as { enabled?: boolean } | null;
    if (o && typeof o.enabled === "boolean") o.enabled = enabled;
  }, [controls]);

  const commit = useCallback(() => {
    const g = groupRef.current;
    if (!g) return;
    let px = g.position.x;
    let py = g.position.y;
    let pz = g.position.z;

    if (isWall) {
      const half = stageHalf();
      py = clampWallHeight(py);
      px = Math.max(-half, Math.min(half, px));
      pz = Math.max(-half, Math.min(half, pz));
    } else {
      const s = resolveFloorPlacement(px, pz); // snap happens here, on release
      px = s.x;
      pz = s.z;
      py = 0;
    }

    g.position.set(px, py, pz);
    updatePlacement(item.id, {
      x: +px.toFixed(3),
      y: +py.toFixed(3),
      z: +pz.toFixed(3),
      rot: +g.rotation.y.toFixed(3),
    });
  }, [isWall, item.id, updatePlacement]);

  /* ---- grab & follow ---- */
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    if (!editable) return;
    e.stopPropagation();
    setSelected(item.id);

    draggingRef.current = true;
    movedRef.current = false;
    setOrbit(false);

    const el = gl.domElement;
    const pointerId = e.pointerId;
    el.style.cursor = "grabbing";
    try { el.setPointerCapture(pointerId); } catch { /* noop */ }

    const ndc = new THREE.Vector2();

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const g = groupRef.current;
      if (!g) return;

      const r = el.getBoundingClientRect();
      ndc.set(
        ((ev.clientX - r.left) / r.width) * 2 - 1,
        -((ev.clientY - r.top) / r.height) * 2 + 1
      );
      raycaster.setFromCamera(ndc, camera);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;

      // snap = false → smooth 1:1 cursor tracking
      const p = pickStage(o.x, o.y, o.z, d.x, d.y, d.z, isWall, false);
      if (!p) return;

      movedRef.current = true;
      if (isWall) {
        g.position.set(p.x, p.y, p.z);
        g.rotation.y = p.rot;
      } else {
        g.position.set(p.x, 0, p.z);
      }
      // live ghost of where it will land after snapping
      if (ringRef.current && !isWall) {
        const s = resolveFloorPlacement(p.x, p.z);
        ringRef.current.position.set(s.x - p.x, 0.016, s.z - p.z);
      }
      invalidate();
    };

    const finish = (ev?: PointerEvent) => {
      if (ev && ev.pointerId !== pointerId) return;
      draggingRef.current = false;
      setOrbit(true);
      el.style.cursor = "auto";
      try { el.releasePointerCapture(pointerId); } catch { /* noop */ }
      if (ringRef.current) ringRef.current.position.set(0, 0.016, 0);
      commit();
      invalidate();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
  };

  const label =
    item.type === "screen" ? wallItemDef(item.kind)?.name
      : item.type === "pet" ? "Pet"
        : item.type === "asset" ? "Custom Object"
          : furnitureDef(item.kind as never)?.name;

  return (
    <>
      <group ref={groupRef}>
        {/* ---- visual art (never receives pointer events) ---- */}
        <group ref={bodyRef} raycast={() => null}>
          {item.type === "screen" ? (
            <ScreenMesh kind={item.kind} config={item.screen} />
          ) : item.type === "pet" ? (
            <PetMesh kind={item.kind} />
          ) : item.type === "asset" ? (
            <UploadedAssetMesh assetId={item.kind} />
          ) : (
            <FurnitureMesh kind={item.kind as never} color={furnitureDef(item.kind as never)?.color ?? "#64748b"} />
          )}
        </group>

        {/* ---- invisible OVERSIZED grab volume ----
            Bigger than the art so small props are easy to click and drag. */}
        {editable && (
          <mesh
            position={[0, hit.cy, 0]}
            onPointerDown={onPointerDown}
            onPointerOver={() => { gl.domElement.style.cursor = "grab"; }}
            onPointerOut={() => { if (!draggingRef.current) gl.domElement.style.cursor = "auto"; }}
          >
            <boxGeometry args={[hit.w, hit.h, hit.d]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} colorWrite={false} />
          </mesh>
        )}

        {/* selection footprint + live snap preview */}
        {isSelected && !isWall && (
          <>
            <mesh position={[0, 0.014, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <ringGeometry args={[Math.max(0.46, hit.w * 0.5), Math.max(0.52, hit.w * 0.5 + 0.06), 48]} />
              <meshBasicMaterial color="#c6ff2e" transparent opacity={0.8} side={THREE.DoubleSide} />
            </mesh>
            <mesh ref={ringRef} position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
              <ringGeometry args={[0.16, 0.2, 4]} />
              <meshBasicMaterial color="#8b5cf6" transparent opacity={0.95} side={THREE.DoubleSide} />
            </mesh>
          </>
        )}

        {/* label lives inside the group so it tracks the item while dragging */}
        {isSelected && (
          <Html position={[0, hit.h + 0.14, 0]} center distanceFactor={8} style={{ pointerEvents: "none" }}>
            <div className="rounded-md border border-white/15 bg-[#161f33]/95 px-2 py-1 text-[9px] font-semibold tracking-wide whitespace-nowrap text-white/75">
              {label ?? "Item"} — {gizmoMode === "rotate" ? "drag ring to rotate" : "drag to move"}
            </div>
          </Html>
        )}
      </group>

      {/* rotation ring */}
      {isSelected && gizmoReady && gizmoMode === "rotate" && groupRef.current && (
        <TransformControls
          object={groupRef.current as Object3D}
          mode="rotate"
          showX={false}
          showZ={false}
          showY
          rotationSnap={Math.PI / 24}
          size={0.9}
          space="world"
          onMouseDown={() => setOrbit(false)}
          onMouseUp={() => { setOrbit(true); commit(); }}
        />
      )}

    </>
  );
}


