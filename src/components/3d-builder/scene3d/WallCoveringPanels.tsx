import { useMemo } from "react";
import * as THREE from "three";
import { STAGE, stageHalf } from "../scene/diorama";
import { useSceneStore } from "../scene/store";
import { buildWallpaperTexture } from "../scene/wallTexture";

export default function WallCoveringPanels({ night }: { night?: boolean }) {
  const id = useSceneStore((state) => state.wallCoveringId);
  const texture = useMemo(() => buildWallpaperTexture(id), [id]);
  const half = stageHalf();

  const tint = night ? "#b8b8c4" : "#ffffff";

  return (
    <group>
      {/* Back wall interior, facing +Z. */}
      <mesh
        position={[0, STAGE.wallHeight / 2, -half + 0.006]}
        raycast={() => null}
        receiveShadow
      >
        <planeGeometry args={[STAGE.size, STAGE.wallHeight]} />
        <meshStandardMaterial map={texture} color={tint} roughness={0.88} metalness={0} />
      </mesh>

      {/* Left wall interior, rotated to face +X. */}
      <mesh
        position={[-half + 0.006, STAGE.wallHeight / 2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        raycast={() => null}
        receiveShadow
      >
        <planeGeometry args={[STAGE.size, STAGE.wallHeight]} />
        <meshStandardMaterial map={texture} color={tint} roughness={0.88} metalness={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}


