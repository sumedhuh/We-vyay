/// <reference types="@react-three/fiber" />
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { ROOM } from "../scene/data";
import { useSceneStore } from "../scene/store";
import { themeById } from "../scene/data";

/**
 * The Virtual Box.
 * Walls use BackSide so you always see INTO the room from the orbiting camera
 * (classic dollhouse trick) — no wall ever blocks the view of the athlete.
 */
export default function Room() {
  const theme = useSceneStore((s) => themeById(s.activeTheme));
  const rimRef = useRef<THREE.Mesh>(null!);



  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: theme.floor, roughness: 0.95, metalness: 0, side: THREE.BackSide }),
    [theme.floor]
  );

  return (
    <group>
      {/* floor slab */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.012, 0]} receiveShadow>
        <planeGeometry args={[ROOM.half * 2, ROOM.half * 2]} />
        <meshStandardMaterial color={theme.floor} roughness={0.96} metalness={0} />
      </mesh>

      {/* interior shell (BackSide → see-through from outside) */}
      <mesh position={[0, ROOM.height / 2, 0]} material={wallMat} receiveShadow>
        <boxGeometry args={[ROOM.half * 2, ROOM.height, ROOM.half * 2]} />
      </mesh>

      {/* matte skirting board — no emission */}
      <group position={[0, 0.06, 0]}>
        {([
          { pos: [0, 0, -ROOM.half + 0.035] as [number, number, number], size: [ROOM.half * 2, 0.11, 0.06] as [number, number, number] },
          { pos: [0, 0, ROOM.half - 0.035] as [number, number, number], size: [ROOM.half * 2, 0.11, 0.06] as [number, number, number] },
          { pos: [-ROOM.half + 0.035, 0, 0] as [number, number, number], size: [0.06, 0.11, ROOM.half * 2] as [number, number, number] },
          { pos: [ROOM.half - 0.035, 0, 0] as [number, number, number], size: [0.06, 0.11, ROOM.half * 2] as [number, number, number] },
        ]).map((b, i) => (
          <mesh key={i} position={b.pos}>
            <boxGeometry args={b.size} />
            <meshStandardMaterial color={theme.gridSection} roughness={0.85} />
          </mesh>
        ))}
      </group>

      {/* corner pillars ground the box */}
      {([[-1, -1], [1, -1], [-1, 1], [1, 1]] as const).map(([sx, sz], i) => (
        <mesh key={i} position={[sx * (ROOM.half - 0.06), ROOM.height / 2, sz * (ROOM.half - 0.06)]}>
          <boxGeometry args={[0.1, ROOM.height, 0.1]} />
          <meshStandardMaterial color={theme.gridSection} roughness={0.85} />
        </mesh>
      ))}

      {/* subtle ceiling panel (matte, no glow) */}
      <mesh ref={rimRef} rotation={[Math.PI / 2, 0, 0]} position={[0, ROOM.height - 0.02, 0]}>
        <planeGeometry args={[ROOM.half * 1.7, ROOM.half * 1.7]} />
        <meshBasicMaterial color="#1b212b" transparent opacity={0.5} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}


