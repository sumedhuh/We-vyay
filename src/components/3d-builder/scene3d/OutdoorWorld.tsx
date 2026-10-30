import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { worldById } from "../scene/data";
import { useSceneStore } from "../scene/store";

type ScenicPoint = { x: number; z: number; s: number; r: number; tone: number };

function rng(seed: number) {
  let n = seed >>> 0;
  return () => {
    n = (n * 1664525 + 1013904223) >>> 0;
    return n / 4294967296;
  };
}

function scatter(seed: number, count: number, minR: number, maxR: number): ScenicPoint[] {
  const random = rng(seed);
  return Array.from({ length: count }, () => {
    const a = random() * Math.PI * 2;
    const d = minR + Math.pow(random(), 0.72) * (maxR - minR);
    return { x: Math.cos(a) * d, z: Math.sin(a) * d, s: 0.7 + random() * 1.2, r: random() * Math.PI * 2, tone: random() };
  });
}

function Sky() {
  const id = useSceneStore((s) => s.activeWorld);
  const world = worldById(id);
  const uniforms = useMemo(() => ({
    topColor: { value: new THREE.Color(world.skyTop) },
    bottomColor: { value: new THREE.Color(world.skyHorizon) },
  }), [world.skyTop, world.skyHorizon]);
  return (
    <mesh scale={65}>
      <sphereGeometry args={[1, 48, 24]} />
      <shaderMaterial side={THREE.BackSide} depthWrite={false} uniforms={uniforms}
        vertexShader={`varying vec3 vPos; void main(){ vPos=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`}
        fragmentShader={`uniform vec3 topColor; uniform vec3 bottomColor; varying vec3 vPos; void main(){ float h=clamp(normalize(vPos).y*.72+.35,0.,1.); h=smoothstep(0.,1.,h); gl_FragColor=vec4(mix(bottomColor,topColor,h),1.); }`} />
    </mesh>
  );
}

function CelestialBody() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const [x, y, z] = world.sunPosition;
  return (
    <group position={[x, y, z]}>
      <mesh>
        <sphereGeometry args={[world.night ? 1.55 : 2.15, 32, 20]} />
        <meshBasicMaterial color={world.sun} toneMapped={false} />
      </mesh>
      <pointLight color={world.sun} intensity={world.night ? 2 : 9} distance={70} decay={1.2} />
    </group>
  );
}

function Stars() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const positions = useMemo(() => {
    const random = rng(44);
    const a = new Float32Array(230 * 3);
    for (let i = 0; i < 230; i++) {
      const angle = random() * Math.PI * 2;
      const y = 10 + random() * 34;
      const rad = 52;
      a[i * 3] = Math.cos(angle) * rad;
      a[i * 3 + 1] = y;
      a[i * 3 + 2] = Math.sin(angle) * rad;
    }
    return a;
  }, []);
  if (!world.night) return null;
  return (
    <points>
      <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
      <pointsMaterial color="#eaf1f5" size={0.13} transparent opacity={0.8} sizeAttenuation />
    </points>
  );
}

function MountainRing() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const points = useMemo(() => scatter(91, 34, 28, 48), []);
  return (
    <group>
      {points.map((p, i) => {
        const near = i % 3 === 0;
        const height = (near ? 9 : 6.5) * p.s;
        const radius = (near ? 7 : 6) * p.s;
        return (
          <group key={i} position={[p.x, height / 2 - 1.2, p.z]} rotation={[0, p.r, 0]}>
            <mesh>
              <coneGeometry args={[radius, height, 5]} />
              <meshStandardMaterial color={near ? world.mountainNear : world.mountainFar} roughness={1} flatShading />
            </mesh>
            {(world.id === "alpine" || world.id === "moon") && height > 8 && (
              <mesh position={[0, height * 0.31, 0]}>
                <coneGeometry args={[radius * 0.34, height * 0.32, 5]} />
                <meshStandardMaterial color={world.night ? "#7f8e98" : "#d9dde0"} roughness={0.95} flatShading />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

function Tree({ p, sparse }: { p: ScenicPoint; sparse: boolean }) {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const h = (sparse ? 2.5 : 3.7) * p.s;
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, p.r, 0]} scale={p.s}>
      <mesh castShadow position={[0, h * 0.3, 0]}>
        <cylinderGeometry args={[0.13, 0.19, h * 0.6, 7]} />
        <meshStandardMaterial color={world.trunk} roughness={1} />
      </mesh>
      <mesh castShadow position={[0, h * 0.68, 0]}>
        <coneGeometry args={[0.95, h * 0.82, 8]} />
        <meshStandardMaterial color={p.tone > 0.5 ? world.tree : new THREE.Color(world.tree).multiplyScalar(0.78)} roughness={0.98} flatShading />
      </mesh>
      <mesh castShadow position={[0, h * 0.94, 0]}>
        <coneGeometry args={[0.68, h * 0.65, 8]} />
        <meshStandardMaterial color={world.tree} roughness={0.98} flatShading />
      </mesh>
    </group>
  );
}

function Forest() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const count = world.id === "forest" ? 74 : world.id === "river" ? 30 : world.id === "alpine" ? 24 : world.id === "moon" ? 30 : 18;
  const points = useMemo(() => scatter(237, count, 9, 28), [count]);
  return <group>{points.map((p, i) => <Tree key={i} p={p} sparse={world.id !== "forest"} />)}</group>;
}

function River() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const mat = useRef<THREE.ShaderMaterial>(null!);
  useFrame((state) => { if (mat.current) mat.current.uniforms.time.value = state.clock.elapsedTime; });
  if (!world.water) return null;
  return (
    <group position={[-10.5, 0.03, -1.5]} rotation={[0, -0.18, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 80, 32, 128]} />
        <shaderMaterial ref={mat} transparent opacity={0.86} uniforms={{ time: { value: 0 }, base: { value: new THREE.Color(world.water) } }}
          vertexShader={`varying vec2 vUv; uniform float time; void main(){ vUv=uv; vec3 p=position; p.z += sin(p.y*.7+time*.8)*.09 + sin(p.y*1.7-time*.4)*.035; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.); }`}
          fragmentShader={`varying vec2 vUv; uniform float time; uniform vec3 base; void main(){ float ripple=.5+.5*sin(vUv.y*78.-time*2.2+sin(vUv.x*13.)*.6); vec3 c=mix(base,vec3(.58,.76,.79),ripple*.2); gl_FragColor=vec4(c,.88); }`} />
      </mesh>
      <mesh position={[-4.6, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.6, 80]} /><meshStandardMaterial color="#8b8467" roughness={1} /></mesh>
      <mesh position={[4.6, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[1.6, 80]} /><meshStandardMaterial color="#8b8467" roughness={1} /></mesh>
    </group>
  );
}

function Clouds() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  const ref = useRef<THREE.Group>(null!);
  useFrame((_, d) => { if (ref.current) ref.current.rotation.y += d * 0.004; });
  if (world.night || world.id === "forest") return null;
  return (
    <group ref={ref}>
      {[0.4, 2.3, 4.2, 5.5].map((a, i) => (
        <group key={i} position={[Math.cos(a) * 28, 14 + (i % 2) * 3, Math.sin(a) * 28]} scale={2 + i * 0.24}>
          {[-0.8, 0, 0.75].map((x, j) => <mesh key={j} position={[x, j === 1 ? 0.2 : 0, 0]}><sphereGeometry args={[0.8, 12, 8]} /><meshBasicMaterial color="#eef1ed" transparent opacity={0.33} depthWrite={false} /></mesh>)}
        </group>
      ))}
    </group>
  );
}

export default function OutdoorWorld() {
  const world = useSceneStore((s) => worldById(s.activeWorld));
  return (
    <group>
      <Sky />
      <Stars />
      <CelestialBody />
      {/* The editable block is finite; this huge ground + fog creates the infinite illusion. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.055, 0]} receiveShadow>
        <circleGeometry args={[58, 96]} />
        <meshStandardMaterial color={world.groundFar} roughness={1} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.025, 0]} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial color={world.ground} roughness={0.98} />
      </mesh>
      <River />
      <MountainRing />
      <Forest />
      <Clouds />
      <hemisphereLight color={world.skyHorizon} groundColor={world.groundFar} intensity={world.night ? 0.55 : 1.25} />
      <directionalLight position={world.sunPosition} color={world.sun} intensity={world.night ? 0.65 : 2.2} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} />
    </group>
  );
}

