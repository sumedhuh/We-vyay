import { useMemo, useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { petDef, type FurnishingKind } from "../scene/data";
import { useSceneStore } from "../scene/store";
import { usePushupStore } from "../store";

/* ================= FURNITURE ================= */
export function FurnitureMesh({ kind, color }: { kind: FurnishingKind; color: string }) {
  const wood = "#8a5a3b";
  const metal = "#94a3b8";

  switch (kind) {
    case "plant":
      return (
        <group>
          <mesh castShadow position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.19, 0.14, 0.32, 18]} />
            <meshStandardMaterial color="#7c4a32" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.33, 0]}>
            <cylinderGeometry args={[0.2, 0.2, 0.04, 18]} />
            <meshStandardMaterial color="#3f2a1c" roughness={0.95} />
          </mesh>
          {[[0, 0.62, 0], [0.14, 0.5, 0.08], [-0.14, 0.55, -0.06], [0.05, 0.78, -0.1], [-0.06, 0.42, 0.14]].map((p, i) => (
            <mesh key={i} castShadow position={p as [number, number, number]} rotation={[0.4 * i, i * 1.1, 0.3 * i]} scale={[1, 0.28, 1]}>
              <sphereGeometry args={[0.17, 14, 10]} />
              <meshStandardMaterial color={color} roughness={0.6} />
            </mesh>
          ))}
        </group>
      );
    case "rug":
      return (
        <group>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} receiveShadow>
            <circleGeometry args={[0.85, 40]} />
            <meshStandardMaterial color={color} roughness={0.95} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
            <ringGeometry args={[0.66, 0.74, 40]} />
            <meshStandardMaterial color="#c6ff2e" transparent opacity={0.4} roughness={0.8} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
            <ringGeometry args={[0.3, 0.36, 32]} />
            <meshStandardMaterial color="#c6ff2e" transparent opacity={0.3} roughness={0.8} />
          </mesh>
        </group>
      );
    case "bench":
      return (
        <group>
          <mesh castShadow position={[0, 0.44, 0]}>
            <boxGeometry args={[1.15, 0.09, 0.34]} />
            <meshStandardMaterial color={color} roughness={0.5} />
          </mesh>
          {[-0.46, 0.46].map((x) => (
            <group key={x}>
              <mesh castShadow position={[x, 0.2, 0]}>
                <boxGeometry args={[0.07, 0.4, 0.3]} />
                <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.4} />
              </mesh>
              <mesh position={[x, 0.02, 0]}>
                <boxGeometry args={[0.22, 0.04, 0.34]} />
                <meshStandardMaterial color={metal} metalness={0.7} roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "rack":
      return (
        <group>
          <mesh castShadow position={[0, 0.36, 0]}>
            <boxGeometry args={[0.72, 0.06, 0.34]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
          </mesh>
          <mesh castShadow position={[0, 0.72, 0]}>
            <boxGeometry args={[0.72, 0.06, 0.34]} />
            <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
          </mesh>
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} castShadow position={[x, 0.36, 0]}>
              <boxGeometry args={[0.07, 0.72, 0.3]} />
              <meshStandardMaterial color="#1e293b" metalness={0.6} roughness={0.35} />
            </mesh>
          ))}
          {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
            <group key={x}>
              <mesh position={[x, 0.44, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.062, 0.062, 0.13, 14]} />
                <meshStandardMaterial color={["#f97316", "#22d3ee", "#a3e635", "#fbbf24"][i]} roughness={0.5} />
              </mesh>
              <mesh position={[x, 0.79, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.052, 0.052, 0.11, 14]} />
                <meshStandardMaterial color={["#8b5cf6", "#ef4444", "#38bdf8", "#f472b6"][i]} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "lamp":
      return <FloorLamp color={color} metal={metal} />;
    case "tv":
      return <FloorStandScreen />;
    case "dumbbells":
      return <HexDumbbellsMesh />;
    case "locker":
      return (
        <group>
          <mesh castShadow position={[0, 0.85, 0]}>
            <boxGeometry args={[0.62, 1.7, 0.46]} />
            <meshStandardMaterial color={color} metalness={0.35} roughness={0.55} />
          </mesh>
          {[-0.155, 0.155].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.85, 0.235]}>
                <boxGeometry args={[0.28, 1.6, 0.02]} />
                <meshStandardMaterial color="#334155" metalness={0.45} roughness={0.5} />
              </mesh>
              <mesh position={[x + (x < 0 ? 0.1 : -0.1), 0.85, 0.26]}>
                <boxGeometry args={[0.03, 0.16, 0.03]} />
                <meshStandardMaterial color="#d4ff3f" metalness={0.5} roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "cooler":
      return (
        <group>
          <mesh castShadow position={[0, 0.5, 0]}>
            <boxGeometry args={[0.36, 1, 0.34]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
          </mesh>
          <mesh position={[0, 1.12, 0]}>
            <cylinderGeometry args={[0.15, 0.15, 0.32, 18]} />
            <meshStandardMaterial color={color} transparent opacity={0.7} roughness={0.25} metalness={0.1} />
          </mesh>
          <mesh position={[0, 0.82, 0.18]}>
            <boxGeometry args={[0.1, 0.06, 0.06]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
        </group>
      );
    case "speaker":
      return <SpeakerTowerMesh />;
    case "mirror":
      return (
        <group>
          <mesh castShadow position={[0, 1, 0]}>
            <boxGeometry args={[0.9, 2, 0.05]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[0, 1, 0.032]}>
            <planeGeometry args={[0.8, 1.88]} />
            <meshStandardMaterial color={color} metalness={0.95} roughness={0.06} />
          </mesh>
        </group>
      );
    case "fan":
      return (
        <group>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.19, 0.21, 0.05, 18]} />
            <meshStandardMaterial color="#1e293b" roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.026, 0.026, 1.2, 10]} />
            <meshStandardMaterial color={metal} metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.26, 0.018, 8, 26]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 1.3, 0]}>
            <sphereGeometry args={[0.07, 12, 10]} />
            <meshStandardMaterial color="#64748b" metalness={0.5} roughness={0.4} />
          </mesh>
          {[0, 1, 2, 4].map((i) => (
            <mesh key={i} position={[0, 1.3, 0]} rotation={[0, 0, (i * Math.PI) / 2.6]}>
              <boxGeometry args={[0.05, 0.44, 0.012]} />
              <meshStandardMaterial color={color} roughness={0.4} transparent opacity={0.85} />
            </mesh>
          ))}
        </group>
      );
    case "ballrack":
      return (
        <group>
          <mesh castShadow position={[0, 0.24, 0]}>
            <boxGeometry args={[0.8, 0.06, 0.44]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh castShadow position={[0, 0.62, 0]} rotation={[0.35, 0, 0]}>
            <boxGeometry args={[0.8, 0.05, 0.44]} />
            <meshStandardMaterial color="#334155" metalness={0.4} roughness={0.5} />
          </mesh>
          {[-0.26, 0, 0.26].map((x, i) => (
            <group key={x}>
              <mesh castShadow position={[x, 0.38, 0]}>
                <sphereGeometry args={[0.12, 16, 12]} />
                <meshStandardMaterial color={["#f97316", "#22d3ee", "#a3e635"][i]} roughness={0.5} />
              </mesh>
              <mesh castShadow position={[x, 0.76, 0.06]}>
                <sphereGeometry args={[0.1, 16, 12]} />
                <meshStandardMaterial color={["#8b5cf6", "#ef4444", "#fbbf24"][i]} roughness={0.5} />
              </mesh>
            </group>
          ))}
        </group>
      );
    case "sofa":
      return (
        <group>
          <mesh castShadow position={[0, 0.26, 0]}>
            <boxGeometry args={[1.3, 0.28, 0.6]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          <mesh castShadow position={[0, 0.56, -0.24]}>
            <boxGeometry args={[1.3, 0.6, 0.16]} />
            <meshStandardMaterial color={color} roughness={0.85} />
          </mesh>
          {[-0.5, 0.5].map((x) => (
            <mesh key={x} castShadow position={[x, 0.48, -0.12]}>
              <boxGeometry args={[0.24, 0.34, 0.5]} />
              <meshStandardMaterial color={color} roughness={0.85} />
            </mesh>
          ))}
          {[-0.28, 0.28].map((x) => (
            <mesh key={x} position={[x, 0.46, -0.16]} rotation={[0, 0, 0.4]}>
              <boxGeometry args={[0.3, 0.3, 0.08]} />
              <meshStandardMaterial color="#59b8aa" roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    case "pinetree":
      return (
        <group>
          {/* trunk */}
          <mesh castShadow position={[0, 0.35, 0]}>
            <cylinderGeometry args={[0.07, 0.11, 0.7, 10]} />
            <meshStandardMaterial color="#6b4a2e" roughness={0.95} />
          </mesh>
          {/* soil mound */}
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <cylinderGeometry args={[0.34, 0.4, 0.07, 16]} />
            <meshStandardMaterial color="#4a3826" roughness={1} />
          </mesh>
          {/* layered evergreen foliage */}
          {[
            { y: 0.95, r: 0.52, h: 0.62 },
            { y: 1.32, r: 0.4, h: 0.55 },
            { y: 1.64, r: 0.27, h: 0.48 },
          ].map((c, i) => (
            <mesh key={i} castShadow position={[0, c.y, 0]}>
              <coneGeometry args={[c.r, c.h, 12]} />
              <meshStandardMaterial color={i % 2 ? "#357a4e" : color} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      );
    case "leafytree":
      return (
        <group>
          {/* trunk with a slight lean */}
          <mesh castShadow position={[0, 0.45, 0]} rotation={[0, 0, 0.06]}>
            <cylinderGeometry args={[0.09, 0.14, 0.95, 10]} />
            <meshStandardMaterial color="#6b4a2e" roughness={0.95} />
          </mesh>
          <mesh position={[0, 0.03, 0]} receiveShadow>
            <cylinderGeometry args={[0.36, 0.44, 0.07, 16]} />
            <meshStandardMaterial color="#4a3826" roughness={1} />
          </mesh>
          {/* broad leafy canopy */}
          {[
            { p: [0, 1.25, 0] as const, s: 0.5 },
            { p: [-0.34, 1.05, 0.1] as const, s: 0.34 },
            { p: [0.34, 1.08, -0.08] as const, s: 0.36 },
            { p: [0.05, 1.52, -0.05] as const, s: 0.32 },
          ].map((b, i) => (
            <mesh key={i} castShadow position={[b.p[0], b.p[1], b.p[2]]}>
              <sphereGeometry args={[b.s, 14, 12]} />
              <meshStandardMaterial color={i % 2 ? "#4c9a58" : color} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      );
    case "shrub":
      return (
        <group>
          <mesh position={[0, 0.025, 0]} receiveShadow>
            <cylinderGeometry args={[0.4, 0.46, 0.06, 16]} />
            <meshStandardMaterial color="#4a3826" roughness={1} />
          </mesh>
          {/* clustered bushy blobs */}
          {[
            { p: [0, 0.32, 0], s: 0.3 },
            { p: [-0.26, 0.24, 0.08], s: 0.22 },
            { p: [0.26, 0.26, -0.06], s: 0.23 },
            { p: [0.02, 0.5, 0.02], s: 0.2 },
          ].map((b, i) => (
            <mesh key={i} castShadow position={[b.p[0], b.p[1], b.p[2]]}>
              <sphereGeometry args={[b.s, 12, 10]} />
              <meshStandardMaterial color={i % 2 ? "#5cb46a" : color} roughness={0.95} flatShading />
            </mesh>
          ))}
        </group>
      );
    case "table":
    default:
      return (
        <group>
          <mesh castShadow position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.26, 0.26, 0.05, 22]} />
            <meshStandardMaterial color={wood} roughness={0.6} />
          </mesh>
          <mesh castShadow position={[0, 0.21, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.42, 12]} />
            <meshStandardMaterial color={metal} metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.12, 14]} />
            <meshStandardMaterial color={color} roughness={0.4} />
          </mesh>
        </group>
      );
  }
}

/* ================= FLOOR LAMP (switches on at night) ================= */
function FloorLamp({ color, metal }: { color: string; metal: string }) {
  const night = useSceneStore((s) => s.nightMode);
  return (
    <group>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.2, 0.22, 0.06, 20]} />
        <meshStandardMaterial color="#1e293b" roughness={0.6} />
      </mesh>
      <mesh castShadow position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 1.7, 10]} />
        <meshStandardMaterial color={metal} metalness={0.75} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.78, 0]}>
        <coneGeometry args={[0.24, 0.3, 20, 1, true]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={night ? 2.6 : 1.4}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* warm bulb glow — much stronger once night mode is on */}
      <pointLight
        position={[0, 1.62, 0]}
        color={night ? "#ffd8a3" : color}
        intensity={night ? 26 : 9}
        distance={night ? 7.5 : 5.5}
        decay={2}
      />
    </group>
  );
}

/* ================= PRO WORKOUT DISPLAY SCREEN ================= */
function FloorStandScreen() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const texRef = useRef<THREE.CanvasTexture | null>(null);
  const frameCount = useRef(0);

  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 640;
    canvasRef.current = c;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    texRef.current = t;
    return t;
  }, []);

  const lastDraw = useRef(0);
  useFrame((state) => {
    // Repaint the dashboard at ~7fps instead of every frame.
    // A 1024x640 canvas re-upload is expensive; this keeps the
    // whole scene smooth while dragging furniture around.
    const t = state.clock.elapsedTime;
    if (t - lastDraw.current < 0.14) return;
    lastDraw.current = t;
    frameCount.current++;
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const time = t;
    const CYAN = "#47e4ff";
    const WHITE = "#ffffff";

    /* Charcoal panel — deliberately plain so the glowing type stays
       legible from the isometric camera distance. */
    ctx.fillStyle = "#16181c";
    ctx.fillRect(0, 0, 1024, 640);

    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 96); ctx.lineTo(1024, 96); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 436); ctx.lineTo(1024, 436); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(624, 96); ctx.lineTo(624, 436); ctx.stroke();

    /* ---------- header ---------- */
    ctx.fillStyle = CYAN;
    ctx.beginPath();
    ctx.arc(46, 54, 11, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = "800 34px system-ui, sans-serif";
    ctx.fillStyle = WHITE;
    ctx.fillText("WORKOUT", 72, 66);

    ctx.textAlign = "right";
    ctx.font = "800 30px system-ui, sans-serif";
    ctx.fillStyle = CYAN;
    ctx.fillText("● LIVE", 986, 66);
    ctx.textAlign = "left";

    /* ---------- hero timer ---------- */
    const totalSec = Math.floor(time * 1.5) % 3600;
    const mins = String(Math.floor(totalSec / 60)).padStart(2, "0");
    const secs = String(totalSec % 60).padStart(2, "0");

    ctx.font = "800 40px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("TIME", 48, 170);

    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 42;
    ctx.font = "800 172px ui-monospace, monospace";
    ctx.fillStyle = WHITE;
    ctx.fillText(`${mins}:${secs}`, 42, 336);
    ctx.restore();

    /* ---------- right column stats ---------- */
    const hr = Math.round(140 + Math.sin(time * 0.9) * 8);
    const kcal = Math.round(290 + time * 2.5) % 999;

    ctx.font = "800 34px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("HEART", 664, 170);

    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 30;
    ctx.font = "800 96px ui-monospace, monospace";
    ctx.fillStyle = CYAN;
    ctx.fillText(`${hr}`, 664, 258);
    ctx.restore();
    ctx.font = "700 30px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("BPM", 664, 298);

    ctx.font = "800 34px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText("BURN", 664, 356);

    ctx.save();
    ctx.shadowColor = CYAN;
    ctx.shadowBlur = 26;
    ctx.font = "800 76px ui-monospace, monospace";
    ctx.fillStyle = WHITE;
    ctx.fillText(`${kcal}`, 664, 424);
    ctx.restore();

    /* ---------- intensity graph across the bottom ---------- */
    ctx.font = "700 28px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.fillText("INTENSITY", 48, 486);

    const bars = 16;
    const bw = 44;
    const gap = 14;
    const originX = 48;
    const baseY = 600;
    for (let i = 0; i < bars; i++) {
      const bh = 22 + Math.abs(Math.sin(time * 1.5 + i * 0.55)) * 90;
      const isLead = i === bars - 1;
      ctx.save();
      if (isLead) { ctx.shadowColor = CYAN; ctx.shadowBlur = 26; }
      ctx.fillStyle = isLead ? CYAN : "rgba(71,228,255,0.32)";
      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(originX + i * (bw + gap), baseY - bh, bw, bh, 5);
      } else {
        ctx.rect(originX + i * (bw + gap), baseY - bh, bw, bh);
      }
      ctx.fill();
      ctx.restore();
    }

    if (texRef.current) {
      texRef.current.needsUpdate = true;
    }
  });

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  return (
    <group>
      {/* Heavy base stand with rubber feet */}
      <mesh position={[0, 0.02, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.92, 0.04, 0.52]} />
        <meshStandardMaterial color="#141923" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Dual upright pillars */}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.65, -0.05]} castShadow>
          <boxGeometry args={[0.06, 1.25, 0.06]} />
          <meshStandardMaterial color="#222b3a" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {/* VESA mount bracket behind screen */}
      <mesh position={[0, 1.15, -0.04]} castShadow>
        <boxGeometry args={[0.5, 0.4, 0.05]} />
        <meshStandardMaterial color="#141923" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Screen Frame / Housing with subtle tilt towards athlete */}
      <group position={[0, 1.2, 0]} rotation={[-0.04, 0, 0]}>
        {/* Rear casing */}
        <mesh castShadow>
          <boxGeometry args={[1.74, 1.05, 0.055]} />
          <meshStandardMaterial color="#0e131d" metalness={0.5} roughness={0.35} />
        </mesh>
        {/* Ultra-thin bezel border */}
        <mesh position={[0, 0, 0.028]}>
          <boxGeometry args={[1.7, 1.01, 0.01]} />
          <meshStandardMaterial color="#1a2230" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Active Display Surface */}
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.65, 0.96]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* Ambient backlight — spills onto the wall behind it, brighter at night */}
        <mesh position={[0, 0, -0.03]}>
          <planeGeometry args={[1.68, 0.98]} />
          <meshBasicMaterial
            color="#c6ff2e"
            transparent
            opacity={useSceneStore.getState().nightMode ? 0.26 : 0.08}
            toneMapped={false}
          />
        </mesh>
        {/* Power / Status indicator light */}
        <mesh position={[0.76, -0.48, 0.038]}>
          <sphereGeometry args={[0.012, 10, 10]} />
          <meshBasicMaterial color="#c6ff2e" toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* ================= PRO HEX DUMBBELLS ================= */
function HexDumbbellsMesh() {
  return (
    <group>
      {/* Heavy-duty beveled rubber gym mat */}
      <mesh position={[0, 0.015, 0]} receiveShadow>
        <boxGeometry args={[0.96, 0.03, 0.56]} />
        <meshStandardMaterial color="#101620" roughness={0.92} />
      </mesh>
      {/* Mat border trim */}
      <mesh position={[0, 0.018, 0]}>
        <boxGeometry args={[1.0, 0.01, 0.6]} />
        <meshStandardMaterial color="#263142" roughness={0.8} />
      </mesh>
      {/* Dumbbell pair 1: Heavy 25kg hex pair */}
      {[-0.14, 0.14].map((zOffset, i) => (
        <group key={`d1-${i}`} position={[-0.24, 0.12, zOffset]} rotation={[0, 0.03, 0]}>
          {/* Knurled chrome handle */}
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.024, 0.024, 0.34, 16]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.2} />
          </mesh>
          {/* Hexagonal weight bells — polished cast iron */}
          {[-0.14, 0.14].map((hx) => (
            <mesh key={hx} position={[hx, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.095, 0.095, 0.085, 6]} />
              <meshStandardMaterial color="#2c313c" roughness={0.3} metalness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Dumbbell pair 2: 15kg hex pair */}
      {[-0.13, 0.13].map((zOffset, i) => (
        <group key={`d2-${i}`} position={[0.24, 0.11, zOffset]} rotation={[0, -0.04, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.022, 0.022, 0.32, 16]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.92} roughness={0.22} />
          </mesh>
          {[-0.13, 0.13].map((hx) => (
            <mesh key={hx} position={[hx, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.082, 0.082, 0.075, 6]} />
              <meshStandardMaterial color="#343a47" roughness={0.28} metalness={0.88} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ================= STUDIO MONITOR SPEAKER TOWER ================= */
function SpeakerTowerMesh() {
  return (
    <group>
      {/* Weighted acoustic base with isolation cone spikes */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <boxGeometry args={[0.38, 0.04, 0.34]} />
        <meshStandardMaterial color="#0d121c" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Cabinet tower */}
      <mesh position={[0, 0.65, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.34, 1.22, 0.3]} />
        <meshStandardMaterial color="#18202c" roughness={0.65} metalness={0.2} />
      </mesh>
      {/* Front acoustic baffle plate */}
      <mesh position={[0, 0.65, 0.152]}>
        <planeGeometry args={[0.32, 1.18]} />
        <meshStandardMaterial color="#0f1622" roughness={0.5} />
      </mesh>

      {/* Perforated grille mesh — fine horizontal weave across the baffle */}
      {Array.from({ length: 34 }, (_, i) => (
        <mesh key={`grille-${i}`} position={[0, 0.09 + i * 0.033, 0.1545]} raycast={() => null}>
          <boxGeometry args={[0.3, 0.008, 0.004]} />
          <meshStandardMaterial color="#232c3a" roughness={0.55} metalness={0.5} />
        </mesh>
      ))}
      {/* vertical weave threads */}
      {[-0.12, -0.06, 0, 0.06, 0.12].map((gx) => (
        <mesh key={`weave-${gx}`} position={[gx, 0.65, 0.1552]} raycast={() => null}>
          <boxGeometry args={[0.005, 1.14, 0.004]} />
          <meshStandardMaterial color="#1b2330" roughness={0.6} metalness={0.45} />
        </mesh>
      ))}
      {/* Silk dome tweeter in waveguide */}
      <group position={[0, 1.08, 0.155]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.012, 12, 28]} />
          <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.024, 16, 12]} />
          <meshStandardMaterial color="#090d16" roughness={0.3} />
        </mesh>
      </group>
      {/* Midrange driver with copper phase plug */}
      <group position={[0, 0.88, 0.155]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.072, 0.016, 12, 28]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0, 0.005]} rotation={[-Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.02, 0.04, 16]} />
          <meshStandardMaterial color="#e08b73" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>
      {/* High-excursion bass woofer */}
      <group position={[0, 0.54, 0.155]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.105, 0.022, 14, 32]} />
          <meshStandardMaterial color="#334155" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <sphereGeometry args={[0.065, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          <meshStandardMaterial color="#1b2432" roughness={0.7} />
        </mesh>
      </group>
      {/* Front bass reflex port */}
      <mesh position={[0, 0.22, 0.154]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.038, 0.01, 10, 24]} />
        <meshStandardMaterial color="#0b0f19" metalness={0.4} roughness={0.8} />
      </mesh>
      {/* Power / Audio active LED */}
      <mesh position={[0, 0.1, 0.156]}>
        <sphereGeometry args={[0.008, 8, 8]} />
        <meshBasicMaterial color="#59b8aa" toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ================= PET ================= */
export function PetMesh({ kind }: { kind: string }) {
  const def = petDef(kind as never);
  const bodyRef = useRef<THREE.Group>(null!);
  const tailRef = useRef<THREE.Mesh>(null!);
  const earL = useRef<THREE.Mesh>(null!);
  const earR = useRef<THREE.Mesh>(null!);
  const [bubble, setBubble] = useState<string | null>(null);
  const reps = usePushupStore((s) => s.reps);

  const cheers = useMemo(() => def?.cheers ?? ["Let's go!"], [def]);

  // react to every completed rep with a cheer
  useEffect(() => {
    if (reps === 0) return;
    setBubble(cheers[Math.floor(Math.random() * cheers.length)]);
    const t = setTimeout(() => setBubble(null), 1900);
    return () => clearTimeout(t);
  }, [reps, cheers]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (bodyRef.current) {
      // excited bounce, faster when the rep timer is running
      const bounce = Math.abs(Math.sin(t * 3.4)) * 0.1;
      bodyRef.current.position.y = bounce;
      bodyRef.current.rotation.z = Math.sin(t * 2.1) * 0.07;
    }
    if (tailRef.current) tailRef.current.rotation.y = Math.sin(t * 9) * 0.55;
    if (earL.current) earL.current.rotation.z = 0.2 + Math.sin(t * 4.2) * 0.18;
    if (earR.current) earR.current.rotation.z = -0.2 - Math.sin(t * 4.2 + 1) * 0.18;
  });

  const c = def?.color ?? "#d9a066";
  const acc = def?.accent ?? "#d4ff3f";
  const isRobot = def?.kind === "robot";
  const isBird = def?.kind === "bird";
  const isDragon = def?.kind === "dragon";

  return (
    <group>
      <group ref={bodyRef}>
        {/* body */}
        <mesh castShadow position={[0, 0.26, 0]} scale={[1, isBird ? 1.1 : 0.92, 1.15]}>
          <sphereGeometry args={[0.17, 22, 18]} />
          <meshStandardMaterial color={c} roughness={isRobot ? 0.35 : 0.75} metalness={isRobot ? 0.55 : 0} />
        </mesh>
        {/* head */}
        <mesh castShadow position={[0, 0.47, 0.06]} scale={isBird ? [1, 1, 1.05] : [1, 0.96, 1]}>
          <sphereGeometry args={[0.13, 22, 18]} />
          <meshStandardMaterial color={c} roughness={isRobot ? 0.35 : 0.75} metalness={isRobot ? 0.55 : 0} />
        </mesh>
        {/* eyes */}
        {[-0.05, 0.05].map((x) => (
          <mesh key={x} position={[x, 0.49, 0.175]}>
            <sphereGeometry args={[0.024, 12, 10]} />
            <meshStandardMaterial color="#0b0e14" roughness={0.2} />
          </mesh>
        ))}
        {[-0.05, 0.05].map((x) => (
          <mesh key={`s${x}`} position={[x + 0.008, 0.5, 0.192]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        ))}
        {/* snout / beak / visor */}
        {isBird ? (
          <mesh position={[0, 0.44, 0.19]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.09, 10]} />
            <meshStandardMaterial color={acc} roughness={0.5} />
          </mesh>
        ) : isRobot ? (
          <mesh position={[0, 0.47, 0.16]}>
            <boxGeometry args={[0.17, 0.05, 0.02]} />
            <meshStandardMaterial color={acc} emissive={acc} emissiveIntensity={1.6} toneMapped={false} />
          </mesh>
        ) : (
          <mesh position={[0, 0.43, 0.175]} scale={[1.5, 0.7, 0.8]}>
            <sphereGeometry args={[0.03, 12, 10]} />
            <meshStandardMaterial color="#2b1a12" roughness={0.6} />
          </mesh>
        )}
        {/* ears / antennae */}
        {isRobot ? (
          <>
            <mesh ref={earL} position={[-0.06, 0.61, 0]}>
              <cylinderGeometry args={[0.006, 0.006, 0.09, 6]} />
              <meshStandardMaterial color="#64748b" metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[-0.06, 0.67, 0]}>
              <sphereGeometry args={[0.022, 10, 8]} />
              <meshStandardMaterial color={acc} emissive={acc} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          </>
        ) : isBird ? (
          <>
            <mesh ref={earL} position={[-0.05, 0.62, 0.02]} rotation={[0, 0, 0.2]}>
              <coneGeometry args={[0.03, 0.1, 8]} />
              <meshStandardMaterial color={acc} roughness={0.6} />
            </mesh>
            <mesh ref={earR} position={[0.05, 0.62, 0.02]} rotation={[0, 0, -0.2]}>
              <coneGeometry args={[0.03, 0.1, 8]} />
              <meshStandardMaterial color={acc} roughness={0.6} />
            </mesh>
          </>
        ) : isDragon ? (
          <>
            {[-0.06, 0.06].map((x, i) => (
              <mesh key={x} ref={i === 0 ? earL : earR} position={[x, 0.6, 0]} rotation={[0, 0, x < 0 ? 0.25 : -0.25]}>
                <coneGeometry args={[0.028, 0.11, 8]} />
                <meshStandardMaterial color={acc} roughness={0.55} />
              </mesh>
            ))}
            {/* tiny wings */}
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.16, 0.34, -0.06]} rotation={[0.2, 0, s * 0.7]} scale={[1, 0.5, 0.15]}>
                <sphereGeometry args={[0.1, 12, 10]} />
                <meshStandardMaterial color={acc} transparent opacity={0.7} roughness={0.6} />
              </mesh>
            ))}
          </>
        ) : (
          <>
            <mesh ref={earL} position={[-0.085, 0.58, 0.02]} rotation={[0, 0, 0.3]} scale={[1, 1.1, 0.6]}>
              <sphereGeometry args={[0.055, 14, 12]} />
              <meshStandardMaterial color={c} roughness={0.75} />
            </mesh>
            <mesh ref={earR} position={[0.085, 0.58, 0.02]} rotation={[0, 0, -0.3]} scale={[1, 1.1, 0.6]}>
              <sphereGeometry args={[0.055, 14, 12]} />
              <meshStandardMaterial color={c} roughness={0.75} />
            </mesh>
          </>
        )}
        {/* tail */}
        {isBird ? (
          <mesh position={[0, 0.24, -0.2]} rotation={[-0.7, 0, 0]} scale={[0.5, 1, 0.2]}>
            <coneGeometry args={[0.1, 0.22, 8]} />
            <meshStandardMaterial color={acc} roughness={0.6} />
          </mesh>
        ) : (
          <mesh ref={tailRef} position={[0, 0.3, -0.19]} rotation={[0.5, 0, 0.3]}>
            <capsuleGeometry args={[0.022, 0.14, 6, 10]} />
            <meshStandardMaterial color={c} roughness={0.75} />
          </mesh>
        )}
        {/* paws / feet */}
        {isBird ? (
          ([-0.06, 0.06] as const).map((x) => (
            <mesh key={x} position={[x, 0.09, 0.04]}>
              <sphereGeometry args={[0.032, 10, 8]} />
              <meshStandardMaterial color={acc} roughness={0.6} />
            </mesh>
          ))
        ) : (
          [[-0.08, 0.06], [0.08, 0.06], [-0.08, -0.08], [0.08, -0.08]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.09, z]}>
              <sphereGeometry args={[0.045, 12, 10]} />
              <meshStandardMaterial color={c} roughness={0.7} />
            </mesh>
          ))
        )}
        {/* collar / chest badge */}
        <mesh position={[0, 0.36, 0.1]} rotation={[1.2, 0, 0]}>
          <torusGeometry args={[0.1, 0.016, 8, 20]} />
          <meshStandardMaterial color={acc} roughness={0.45} />
        </mesh>
      </group>

      {/* motivational bubble */}
      {bubble && (
        <Html center position={[0, 0.86, 0]} distanceFactor={3.2} style={{ pointerEvents: "none" }}>
          <div className="relative whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-black backdrop-blur-md"
            style={{ borderColor: `${acc}99`, background: "rgba(8,10,14,0.82)", color: acc }}>
            {bubble}
            <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b"
              style={{ borderColor: `${acc}99`, background: "rgba(8,10,14,0.82)" }} />
          </div>
        </Html>
      )}
    </group>
  );
}




