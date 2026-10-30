import { Suspense, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { useSceneStore } from "../scene/store";

function Model({ url }: { url: string }) {
  const gltf = useGLTF(url);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  return <primitive object={scene} />;
}

/**
 * Renders a user-uploaded GLB/GLTF.
 * Falls back to a tasteful placeholder crate if loading fails or the asset is missing.
 */
export default function UploadedAssetMesh({ assetId }: { assetId: string }) {
  const asset = useSceneStore((s) => s.uploadedAssets.find((a) => a.id === assetId));
  if (!asset?.dataUrl) return <Placeholder />;
  return (
    <Suspense fallback={<Placeholder />}>
      <group>
        <Model url={asset.dataUrl} />
      </group>
    </Suspense>
  );
}

function Placeholder() {
  return (
    <group>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[0.6, 0.64, 0.6]} />
        <meshStandardMaterial color="#6b7d95" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.62, 0.66, 0.62]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
      </mesh>
      <mesh position={[0, 0.68, 0]}>
        <boxGeometry args={[0.42, 0.1, 0.02]} />
        <meshStandardMaterial color="#d1d9e5" roughness={0.6} />
      </mesh>
    </group>
  );
}

