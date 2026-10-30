import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { DioramaTheme } from "../scene/diorama";
import type { SceneStyle } from "../scene/style";

/* ------------------------------------------------------------------
   Drifting clouds — the subtle movement that keeps the sky alive
   ------------------------------------------------------------------ */
function DriftingClouds({ theme, cloudOverride }: { theme: DioramaTheme; cloudOverride?: DioramaTheme["cloud"] }) {
  const ref = useRef<THREE.Group>(null!);
  const cfg = cloudOverride ?? theme.cloud;
  const puffs = useMemo(
    () =>
      Array.from({ length: theme.cloud.count }, (_, i) => ({
        angle: (i / theme.cloud.count) * Math.PI * 2 + i * 0.7,
        y: 24 + (i % 3) * 6,
        r: 58 + (i % 4) * 8,
        s: 4.2 + (i % 3) * 1.8,
      })),
    [theme.cloud.count]
  );

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * theme.cloud.speed;
  });

  return (
    <group ref={ref} userData={{ noStyle: true }}>
      {puffs.map((p, i) => (
        <group key={i} position={[Math.cos(p.angle) * p.r, p.y, Math.sin(p.angle) * p.r]} scale={p.s}>
          {[-1.15, 0, 1.05].map((x, j) => (
            <mesh key={j} position={[x, j === 1 ? 0.4 : 0, j === 1 ? 0.2 : -0.1]} userData={{ noStyle: true }}>
              <sphereGeometry args={[1, 12, 9]} />
              <meshBasicMaterial
                color={cfg.color}
                transparent
                opacity={cfg.opacity}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------
   Animated skybox — fully separate from the diorama stage
   ------------------------------------------------------------------ */
export default function AnimatedSky({ theme, night, style }: { theme: DioramaTheme; night?: boolean; style?: SceneStyle }) {
  const matRef = useRef<THREE.ShaderMaterial>(null!);
  const starRef = useRef<THREE.Points>(null!);
  const sunRef = useRef<THREE.Group>(null!);

  const sky = night ? theme.night.sky : theme.sky;
  const cloud = night ? { ...theme.cloud, ...theme.night.cloud } : theme.cloud;
  const keyColor = night ? theme.night.keyColor : theme.keyColor;
  const keyIntensity = (night ? theme.night.keyIntensity : theme.keyIntensity) * (style?.keyMul ?? 1);
  const ambientColor = night ? theme.night.ambientColor : theme.ambientColor;
  const hemiStrength = (night ? 0.34 : theme.indoor ? 0.55 : 0.95) * (style?.hemiMul ?? 1);
  const sunPos = sky.sunPos;

  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color(sky.top) },
      uHorizon: { value: new THREE.Color(sky.horizon) },
      uBottom: { value: new THREE.Color(sky.bottom) },
      uSunColor: { value: new THREE.Color(sky.sun) },
      uSunDir: { value: new THREE.Vector3(...sunPos).normalize() },
      uTime: { value: 0 },
    }),
    [sky.top, sky.horizon, sky.bottom, sky.sun, sunPos]
  );

  const starPositions = useMemo(() => {
    const n = 340;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const u = Math.random() * Math.PI * 2;
      const v = Math.random() * 0.86 + 0.06;
      const r = 92;
      arr[i * 3] = Math.cos(u) * Math.sqrt(1 - v * v) * r;
      arr[i * 3 + 1] = v * r;
      arr[i * 3 + 2] = Math.sin(u) * Math.sqrt(1 - v * v) * r;
    }
    return arr;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (matRef.current) matRef.current.uniforms.uTime.value = t;
    if (starRef.current) starRef.current.rotation.y = t * 0.008;
    if (sunRef.current) sunRef.current.rotation.y = t * 0.0035;
  });

  return (
    <group>
      {/* gradient dome with a slowly breathing sun bloom */}
      <mesh scale={95} userData={{ noStyle: true }}>
        <sphereGeometry args={[1, 48, 32]} />
        <shaderMaterial
          ref={matRef}
          side={THREE.BackSide}
          depthWrite={false}
          uniforms={uniforms}
          vertexShader={`
            varying vec3 vDir;
            void main() {
              vDir = position;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
          `}
          fragmentShader={`
            uniform vec3 uTop;
            uniform vec3 uHorizon;
            uniform vec3 uBottom;
            uniform vec3 uSunColor;
            uniform vec3 uSunDir;
            uniform float uTime;
            varying vec3 vDir;
            void main() {
              vec3 dir = normalize(vDir);
              float h = dir.y;
              vec3 col = h > 0.0
                ? mix(uHorizon, uTop, smoothstep(0.0, 0.72, h))
                : mix(uHorizon, uBottom, smoothstep(0.0, -0.45, h));

              // sun / moon bloom
              float d = max(dot(dir, normalize(uSunDir)), 0.0);
              col += uSunColor * pow(d, 48.0) * 0.9;
              col += uSunColor * pow(d, 7.0) * 0.12;

              // slow breathing so the sky is never frozen
              col *= 1.0 + sin(uTime * 0.06) * 0.02;
              gl_FragColor = vec4(col, 1.0);
            }
          `}
        />
      </mesh>

      {/* drifting sun / moon (visual only — the light stays fixed for stable shadows) */}
      <group ref={sunRef}>
        <mesh position={sunPos}>
          <sphereGeometry args={[night || theme.sky.stars ? 2.6 : 3.1, 24, 16]} />
          <meshBasicMaterial color={sky.sun} toneMapped={false} />
        </mesh>
      </group>

      {(night || theme.sky.stars) && (
        <points ref={starRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#eef4fa" size={0.5} transparent opacity={night ? 0.95 : 0.85} sizeAttenuation />
        </points>
      )}

      <DriftingClouds theme={theme} cloudOverride={cloud} />

      {/* Sky fill only — SunlightRig owns the key light and all shadows,
          so this stays shadowless to keep one consistent light direction. */}
      <directionalLight
        position={sunPos}
        color={keyColor}
        intensity={keyIntensity * 0.28}
      />
      <hemisphereLight
        color={ambientColor}
        groundColor={night ? theme.night.floor : theme.floor}
        intensity={hemiStrength}
      />
      <ambientLight intensity={0.34 * (style?.ambientMul ?? 1) * (night ? 0.75 : 1)} />
    </group>
  );
}

