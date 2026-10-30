import { useEffect, useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useSceneStore } from "../scene/store";
import { ADS, clampPlacement, MIN_RADIUS, furnitureDef } from "../scene/data";
import { FurnitureMesh, PetMesh } from "./Props3D";

const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3();
const ray = new THREE.Raycaster();

/** shows the live ghost of whatever is being positioned in the floor planner */
export function PlacementControls() {
  const selectedId = useSceneStore((s) => s.selectedId);
  const plannerKind = useSceneStore((s) => s.plannerKind);
  const px = useSceneStore((s) => s.plannerX);
  const pz = useSceneStore((s) => s.plannerZ);
  const prot = useSceneStore((s) => s.plannerRot);
  const pscale = useSceneStore((s) => s.plannerScale);
  const ptype = useSceneStore((s) => s.plannerType);
  const ghost = useRef<THREE.Group>(null!);

  useFrame((state) => {
    if (ghost.current) {
      const t = state.clock.elapsedTime;
      ghost.current.position.y = 0.05 + Math.sin(t * 2.4) * 0.04;
    }
  });

  return (
    <>
      {/* live 3D ghost mirroring the floor-plan position */}
      {plannerKind && (
        <group position={[px, 0, pz]} rotation={[0, prot, 0]} scale={pscale}>
          <group ref={ghost}>
            {ptype === "pet"
              ? <PetMesh kind={plannerKind} />
              : <FurnitureMesh kind={plannerKind as never} color={furnitureDef(plannerKind as never).color} />}
          </group>
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.42, 0.52, 48]} />
            <meshBasicMaterial color="#d4ff3f" transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.42, 40]} />
            <meshBasicMaterial color="#d4ff3f" transparent opacity={0.14} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}

      {/* keep-out ring while planning */}
      {plannerKind && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <ringGeometry args={[MIN_RADIUS, MIN_RADIUS + 0.03, 64]} />
          <meshBasicMaterial color="#ff4d2e" transparent opacity={0.45} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* selected item gizmo ring */}
      {selectedId && !plannerKind && <SelectionRing />}
    </>
  );
}

function SelectionRing() {
  const selectedId = useSceneStore((s) => s.selectedId);
  const placements = useSceneStore((s) => s.placements);
  const moveSelected = useSceneStore((s) => s.moveSelected);
  const p = placements.find((x) => x.id === selectedId);
  const { camera, gl } = useThree();
  const dragging = useRef(false);

  if (!p) return null;

  const startDrag = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    dragging.current = true;
    const controls = (gl as unknown as { __controls?: { enabled: boolean } }).__controls;
    if (controls) controls.enabled = false;

    const onMove = (ev: PointerEvent) => {
      const rect = gl.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      ray.setFromCamera(ndc, camera);
      if (ray.ray.intersectPlane(plane, hit)) {
        const c = clampPlacement(hit.x, hit.z);
        moveSelected(c.x, c.z);
      }
    };
    const onUp = () => {
      dragging.current = false;
      if (controls) controls.enabled = true;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  return (
    <group position={[p.x, 0.014, p.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={startDrag} onPointerOver={() => (document.body.style.cursor = "grab")} onPointerOut={() => (document.body.style.cursor = "auto")}>
        <ringGeometry args={[0.44, 0.5, 48]} />
        <meshBasicMaterial color="#e9a63d" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** renders every owned placement with selection + rotation handling */
export function Furnishings() {
  const placements = useSceneStore((s) => s.placements);
  const selectedId = useSceneStore((s) => s.selectedId);
  const setSelected = useSceneStore((s) => s.setSelected);

  return (
    <group>
      {placements.map((p) => {
        const active = p.id === selectedId;
        return (
          <group
            key={p.id}
            position={[p.x, 0, p.z]}
            rotation={[0, p.rot, 0]}
            scale={p.scale}
            onPointerDown={(e) => {
              e.stopPropagation();
              setSelected(p.id);
            }}
          >
            <group position={[0, 0, 0]}>
              {p.type === "pet" ? <PetMesh kind={p.kind} /> : <FurnitureMesh kind={p.kind as never} color={furnitureDef(p.kind as never).color} />}
            </group>
            {active && (
              <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.4, 0.48, 44]} />
                <meshBasicMaterial color="#d4ff3f" transparent opacity={0.6} side={THREE.DoubleSide} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** the big background circle → live ad slot */
export function AdCircle() {
  const adIndex = useSceneStore((s) => s.adIndex);
  const nextAd = useSceneStore((s) => s.nextAd);
  const themeRim = useSceneStore((s) => themeByIdSafe(s.activeTheme).matEdge);
  const groupRef = useRef<THREE.Group>(null!);
  const [pulse, setPulse] = useState(0);
  const ad = ADS[adIndex % ADS.length];

  useEffect(() => {
    const t = setInterval(nextAd, 9000);
    return () => clearInterval(t);
  }, [nextAd]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.position.y = 1.55 + Math.sin(state.clock.elapsedTime * 0.8) * 0.02;
    setPulse(Math.sin(state.clock.elapsedTime * 2));
  });

  return (
    <group ref={groupRef} position={[0, 1.55, -4.35]}>
      {/* halo */}
      <mesh>
        <circleGeometry args={[1.62, 64]} />
        <meshBasicMaterial color="#05070c" toneMapped={false} />
      </mesh>
      {/* theme rim */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[1.5, 1.6, 64]} />
        <meshBasicMaterial color={themeRim} toneMapped={false} transparent opacity={0.65} />
      </mesh>
      {/* rotating ad disc */}
      <mesh position={[0, 0, 0.01]}>
        <circleGeometry args={[1.46, 64]} />
        <meshBasicMaterial color={ad.from} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <circleGeometry args={[1.46, 64]} />
        <meshBasicMaterial
          color={ad.to}
          toneMapped={false}
          transparent
          opacity={0.45 + pulse * 0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* ad copy */}
      <Html position={[0, 0.28, 0.06]} center distanceFactor={4.2} transform occlude={false}>
        <div className="w-[240px] select-none text-center" style={{ pointerEvents: "none" }}>
          <p className="text-[9px] font-black tracking-[0.3em]" style={{ color: "rgba(0,0,0,0.55)" }}>{ad.brand}</p>
          <p className="mt-1 text-[19px] font-black leading-tight text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]">{ad.headline}</p>
          <p className="mt-1 text-[11px] font-semibold leading-snug text-white/85">{ad.sub}</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-black/75 px-3 py-1 text-[10px] font-black tracking-widest text-white">
            {ad.cta}
          </div>
        </div>
      </Html>
      {/* AD badge */}
      <Html position={[-1.02, 1.18, 0.06]} center distanceFactor={4.2} transform>
        <span className="rounded border border-white/50 bg-black/60 px-1.5 py-0.5 text-[7px] font-black tracking-widest text-white/80">AD</span>
      </Html>
    </group>
  );
}

// tiny local helper to avoid a circular import at module scope
import { themeById } from "../scene/data";
function themeByIdSafe(id: string) {
  return themeById(id);
}


