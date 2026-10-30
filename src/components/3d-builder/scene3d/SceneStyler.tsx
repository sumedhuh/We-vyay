import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { SceneStyle } from "../scene/style";

/* Stepped gradient used by MeshToonMaterial for cel shading. */
function makeToonGradient(steps: number) {
  const n = Math.max(2, Math.min(6, steps));
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const v = Math.round(((i + 0.55) / n) * 235);
    data[i * 4] = v;
    data[i * 4 + 1] = v;
    data[i * 4 + 2] = v;
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const hsl = { h: 0, s: 0, l: 0 };

/** Should this mesh be restyled? Skips invisible helpers and pure UI hit volumes. */
function isStylable(mesh: THREE.Mesh): boolean {
  if (!mesh.visible) return false;
  if (mesh.userData?.noStyle) return false;
  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  for (const m of mats) {
    if (!m) continue;
    const anyM = m as THREE.Material & { opacity?: number; colorWrite?: boolean };
    if (anyM.colorWrite === false) return false;
    if (anyM.transparent && (anyM.opacity ?? 1) < 0.06) return false;
    if ((m as THREE.MeshBasicMaterial).type === "LineBasicMaterial") return false;
  }
  return mats.length > 0;
}

function buildMaterial(
  orig: THREE.Material,
  style: SceneStyle,
  toonMap: THREE.Texture
): THREE.Material | null {
  const src = orig as THREE.MeshStandardMaterial;
  const base = new THREE.Color(src.color?.getHex() ?? 0xffffff);

  base.getHSL(hsl);
  base.setHSL(
    hsl.h,
    Math.max(0, hsl.s * (1 - style.desaturate)),
    Math.min(1, Math.max(0, hsl.l + style.lighten - style.darken))
  );
  if (style.tint) base.multiply(new THREE.Color(style.tint));

  const map = style.hideTextures ? null : (src.map ?? null);
  const transparent = !!src.transparent;
  const opacity = src.opacity ?? 1;
  const side = src.side ?? THREE.FrontSide;

  switch (style.mode) {
    case "toon": {
      const m = new THREE.MeshToonMaterial({
        map,
        gradientMap: toonMap,
        color: base,
        transparent,
        opacity,
        side,
      });
      return m;
    }
    case "wire": {
      const m = new THREE.MeshBasicMaterial({
        color: base,
        wireframe: true,
        transparent,
        opacity: Math.min(1, opacity * 0.9 + 0.1),
        side,
      });
      return m;
    }
    case "matte": {
      const m = new THREE.MeshStandardMaterial({
        map,
        color: base,
        roughness: 1,
        metalness: 0,
        flatShading: style.flatShading,
        transparent,
        opacity,
        side,
      });
      return m;
    }
    case "emissive": {
      const m = new THREE.MeshStandardMaterial({
        map,
        color: base,
        roughness: Math.min(0.5, style.roughness),
        metalness: Math.min(0.3, style.metalness),
        emissive: base.clone().multiplyScalar(0.55),
        emissiveIntensity: style.emissiveBoost + 0.25,
        flatShading: style.flatShading,
        transparent,
        opacity,
        side,
      });
      m.toneMapped = false;
      return m;
    }
    default: {
      const m = new THREE.MeshStandardMaterial({
        map,
        color: base,
        roughness: src.roughness ?? 0.7,
        metalness: src.metalness ?? 0,
        flatShading: style.flatShading,
        transparent,
        opacity,
        side,
      });
      // preserve any authored emissive accent, nudged by the style
      if (src.emissive && style.emissiveBoost > 0) {
        m.emissive = src.emissive.clone();
        m.emissiveIntensity = (src.emissiveIntensity ?? 0) + style.emissiveBoost;
      }
      return m;
    }
  }
}

/**
 * Walks the scene graph and re-shades every mesh to match the active
 * studio style. Original materials are cached so switching back is exact.
 */
export default function SceneStyler({ style }: { style: SceneStyle }) {
  const { scene } = useThree();
  const originals = useRef(new Map<THREE.Mesh, THREE.Material | THREE.Material[]>());
  const toonMap = useMemo(() => makeToonGradient(style.toonSteps), [style.toonSteps]);

  useEffect(() => {
    return () => {
      toonMap.dispose();
    };
  }, [toonMap]);

  useEffect(() => {
    const restore = () => {
      originals.current.forEach((mat, mesh) => {
        if (!mesh.parent) return;
        mesh.material = mat;
      });
      originals.current.clear();
    };

    const apply = () => {
      restore();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh || !isStylable(mesh)) return;
        if (!originals.current.has(mesh)) originals.current.set(mesh, mesh.material);

        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => buildMaterial(m, style, toonMap) ?? m);
        } else {
          mesh.material = buildMaterial(mesh.material, style, toonMap) ?? mesh.material;
        }
      });
    };

    apply();
    return restore;
  }, [scene, style, toonMap]);

  return null;
}

/** Marks a subtree so the styler leaves it alone (e.g. sky dome, ghost pads). */
export function NoStyle({ children }: { children: React.ReactNode }) {
  return <group userData-no-style>{children}</group>;
}

