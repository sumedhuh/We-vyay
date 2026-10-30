/**
 * Augment React's JSX namespace with @react-three/fiber's Three.js elements
 * (primitive, ambientLight, directionalLight, mesh, etc.) so they are
 * recognized in .tsx files under `jsx: "react-jsx"`.
 *
 * The canonical ThreeElements interface lives in @react-three/fiber and its
 * own type augmentations *should* do this automatically, but the Next.js TS
 * plugin can shadow the resolution. This file makes the augmentation explicit.
 */
import type { ThreeElements } from "@react-three/fiber";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
