"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { EquipmentType } from "./gymExercises";

/* ================================================================== */
/*  Commercial Gym PBR Material Definitions                           */
/* ================================================================== */

const MAT_STEEL_DARK = {
  color: "#181a1d",
  metalness: 0.35,
  roughness: 0.45,
  clearcoat: 0.15,
  clearcoatRoughness: 0.2,
}; // Commercial powder-coat frame (Rogue/Eleiko matte charcoal)

const MAT_CHROME = {
  color: "#f1f5f9",
  metalness: 0.96,
  roughness: 0.18,
  clearcoat: 0.4,
  clearcoatRoughness: 0.1,
}; // Polished Olympic bar sleeves, guide rods & hardware

const MAT_KNURL_STEEL = {
  color: "#33383f",
  metalness: 0.88,
  roughness: 0.52,
}; // Diamond knurled shaft section (satin metallic grip)

const MAT_BLACK_ZINC = {
  color: "#22252a",
  metalness: 0.82,
  roughness: 0.38,
}; // Black zinc center barbell shaft

const MAT_BRONZE = {
  color: "#d97706",
  metalness: 0.85,
  roughness: 0.3,
}; // Bushing / bronze bearing rings

const MAT_RUBBER_TIRE = {
  color: "#18191c",
  metalness: 0.05,
  roughness: 0.82,
}; // Heavy vulcanized bumper rubber

const MAT_RUBBER_FEET = {
  color: "#0f1012",
  metalness: 0.02,
  roughness: 0.92,
}; // High-traction floor feet & bumpers

const MAT_COLLAR_RED = {
  color: "#dc2626",
  metalness: 0.65,
  roughness: 0.28,
}; // Anodized aluminum quick-release barbell collars

const MAT_PLATE_BLUE = {
  color: "#1d4ed8",
  metalness: 0.15,
  roughness: 0.5,
}; // Olympic 20kg / 45lb competition blue

const MAT_PLATE_GREEN = {
  color: "#15803d",
  metalness: 0.15,
  roughness: 0.5,
}; // Olympic 10kg / 25lb competition green

const MAT_LEATHER_PAD = {
  color: "#1a1c20",
  metalness: 0.08,
  roughness: 0.52,
  clearcoat: 0.35,
  clearcoatRoughness: 0.4,
}; // Premium grippy synthetic bench leather

const MAT_STITCHING_CYAN = {
  color: "#06b6d4",
  metalness: 0.2,
  roughness: 0.45,
}; // Contrast cyan stitching / piping trim

const MAT_HARDWARE = {
  color: "#94a3b8",
  metalness: 0.9,
  roughness: 0.25,
}; // Stainless hex bolts & washers

/* ================================================================== */
/*  Helper Subcomponents for Hardware & Accents                        */
/* ================================================================== */

function HexBolt({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <cylinderGeometry args={[0.009, 0.009, 0.007, 6]} />
        <meshPhysicalMaterial {...MAT_HARDWARE} />
      </mesh>
      <mesh position={[0, -0.004, 0]}>
        <cylinderGeometry args={[0.013, 0.013, 0.002, 12]} />
        <meshPhysicalMaterial {...MAT_HARDWARE} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/*  Static Gym Equipment Manager                                      */
/* ================================================================== */

export function GymEquipment({
  equipment,
  equipmentList,
}: {
  equipment?: EquipmentType;
  equipmentList?: EquipmentType[];
}) {
  const activeList = useMemo(() => {
    if (equipmentList && equipmentList.length > 0) return equipmentList;
    if (equipment && equipment !== "none") return [equipment];
    return [];
  }, [equipment, equipmentList]);

  if (activeList.length === 0) return null;

  return (
    <group>
      {activeList.includes("pullup_bar") && <PullUpBar />}
      {activeList.includes("bench") && <FlatBench />}
      {activeList.includes("box") && <PlyoBox />}
      {activeList.includes("cable") && <CableMachine />}
    </group>
  );
}

/* ================================================================== */
/*  1. Commercial Power Rack / Pull-Up Rig                            */
/* ================================================================== */

export function PullUpBar() {
  // Pre-generate peg hole positions along uprights
  const pegHoles = useMemo(() => {
    const list = [];
    for (let y = 0.4; y <= 1.95; y += 0.08) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, -0.3]}>
      {/* Floor Stabilizer Base Feet (Left & Right) */}
      {([-0.62, 0.62] as const).map((x, idx) => (
        <group key={`base-foot-${idx}`} position={[x, 0.025, 0]}>
          {/* Main heavy base channel running front-to-back */}
          <mesh castShadow receiveShadow position={[0, 0, -0.15]}>
            <boxGeometry args={[0.08, 0.05, 0.88]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>
          {/* Front rubber foot cap */}
          <mesh position={[0, 0, 0.29]}>
            <boxGeometry args={[0.09, 0.055, 0.08]} />
            <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
          </mesh>
          {/* Rear rubber foot cap */}
          <mesh position={[0, 0, -0.59]}>
            <boxGeometry args={[0.09, 0.055, 0.08]} />
            <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
          </mesh>
          {/* Floor anchor bracket tabs with bolt */}
          <mesh position={[0, -0.015, -0.15]}>
            <boxGeometry args={[0.13, 0.01, 0.16]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>
          <HexBolt position={[0.05, -0.005, -0.15]} />
          <HexBolt position={[-0.05, -0.005, -0.15]} />

          {/* Lower triangular corner gusset plate */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[0.082, 0.16, 0.16]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>
          <HexBolt position={[0.044, 0.08, 0.05]} rotation={[0, 0, Math.PI / 2]} />
          <HexBolt position={[0.044, 0.14, -0.05]} rotation={[0, 0, Math.PI / 2]} />
        </group>
      ))}

      {/* Main Structural Uprights (75mm x 75mm box steel) */}
      {([-0.62, 0.62] as const).map((x, idx) => (
        <group key={`upright-${idx}`} position={[x, 1.14, 0]}>
          {/* Upright column */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.075, 2.24, 0.075]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>

          {/* Laser-cut numbered peg holes on front face */}
          {pegHoles.map((yPos, pIdx) => (
            <mesh key={`hole-${pIdx}`} position={[0, yPos - 1.14, 0.038]}>
              <cylinderGeometry args={[0.007, 0.007, 0.002, 12]} />
              <meshBasicMaterial color="#0c0d0f" />
            </mesh>
          ))}

          {/* Top structural corner gusset plate with hardware */}
          <mesh position={[0, 0.95, 0]}>
            <boxGeometry args={[0.082, 0.18, 0.14]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>
          <HexBolt position={[0.044, 0.98, 0.04]} rotation={[0, 0, Math.PI / 2]} />
          <HexBolt position={[0.044, 0.92, -0.04]} rotation={[0, 0, Math.PI / 2]} />
        </group>
      ))}

      {/* Top Header Branding Truss / Crossmember */}
      <group position={[0, 2.22, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.28, 0.08, 0.06]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        {/* Contrasting center branding badge */}
        <mesh position={[0, 0, 0.032]}>
          <boxGeometry args={[0.28, 0.04, 0.004]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.22, 0.015, 0.002]} />
          <meshBasicMaterial color="#38bdf8" />
        </mesh>
      </group>

      {/* Multi-Grip Pull-Up Bar Assembly (Bar at y = 2.05) */}
      <group position={[0, 2.05, 0]}>
        {/* Main wide straight bar */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.016, 0.016, 1.28, 24]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>

        {/* Textured diamond knurling grip zones (where hands grip at ±0.30m) */}
        {[-0.3, 0.3].map((gx, i) => (
          <mesh key={`knurl-${i}`} position={[gx, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.0168, 0.0168, 0.18, 24]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        ))}

        {/* Angled Wide-Grip Drop Horns (outer ergonomic wide grips) */}
        {/* Left angled drop handle */}
        <group position={[-0.46, 0, 0]}>
          <mesh position={[-0.1, -0.035, 0]} rotation={[0, 0, 0.35]} castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.22, 20]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        </group>
        {/* Right angled drop handle */}
        <group position={[0.46, 0, 0]}>
          <mesh position={[0.1, -0.035, 0]} rotation={[0, 0, -0.35]} castShadow>
            <cylinderGeometry args={[0.016, 0.016, 0.22, 20]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        </group>

        {/* Dual Close-Grip Neutral Handles (extending forward) */}
        {[-0.15, 0.15].map((nx, i) => (
          <group key={`neutral-${i}`} position={[nx, 0, 0.1]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.2, 20]} />
              <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
            </mesh>
            {/* End caps */}
            <mesh position={[0, 0, 0.1]}>
              <sphereGeometry args={[0.017, 12, 12]} />
              <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ================================================================== */
/*  2. Commercial Competition Flat Bench (IPF Height y = 0.435)        */
/* ================================================================== */

export function FlatBench() {
  return (
    <group position={[0, 0, -0.2]}>
      {/* ---------------- Base Frame Assembly ---------------- */}
      {/* Rear Transverse Base Tube with Rubber End Caps */}
      <group position={[0, 0.025, -0.58]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.48, 0.05, 0.08]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        {/* Left & Right heavy rubber feet */}
        <mesh position={[-0.22, 0, 0]}>
          <boxGeometry args={[0.06, 0.055, 0.09]} />
          <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
        </mesh>
        <mesh position={[0.22, 0, 0]}>
          <boxGeometry args={[0.06, 0.055, 0.09]} />
          <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
        </mesh>

        {/* Rear Transport Wheels (polyurethane with red hubs) */}
        {[-0.16, 0.16].map((wx, i) => (
          <group key={`wheel-${i}`} position={[wx, 0.015, -0.055]}>
            {/* Mounting bracket tab */}
            <mesh position={[0, 0.01, 0.01]}>
              <boxGeometry args={[0.024, 0.035, 0.02]} />
              <meshPhysicalMaterial {...MAT_STEEL_DARK} />
            </mesh>
            {/* Wheel roller */}
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.034, 0.034, 0.018, 16]} />
              <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
            </mesh>
            {/* Anodized red wheel hub & axle bolt */}
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.016, 0.016, 0.02, 16]} />
              <meshPhysicalMaterial {...MAT_COLLAR_RED} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Front Tripod Stabilizer Foot (Low profile, non-intrusive) */}
      <group position={[0, 0.025, 0.48]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.045, 0.075]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        <mesh position={[-0.13, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.085]} />
          <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
        </mesh>
        <mesh position={[0.13, 0, 0]}>
          <boxGeometry args={[0.05, 0.05, 0.085]} />
          <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
        </mesh>

        {/* Front Ergonomic Tilt-and-Roll Handle */}
        <group position={[0, 0.08, 0.06]}>
          <mesh rotation={[Math.PI / 4, 0, 0]} castShadow>
            <cylinderGeometry args={[0.014, 0.014, 0.12, 16]} />
            <meshPhysicalMaterial {...MAT_CHROME} />
          </mesh>
          <mesh position={[0, 0.045, 0.045]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.015, 0.015, 0.14, 16]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        </group>
      </group>

      {/* Heavy-Gauge Central Structural Spine (75mm x 75mm) */}
      <mesh position={[0, 0.2, -0.05]} castShadow receiveShadow>
        <boxGeometry args={[0.075, 0.075, 1.05]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Front Vertical Column */}
      <mesh position={[0, 0.11, 0.48]} castShadow>
        <boxGeometry args={[0.075, 0.14, 0.075]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Rear Vertical Column */}
      <mesh position={[0, 0.11, -0.58]} castShadow>
        <boxGeometry args={[0.075, 0.14, 0.075]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Sub-Plate Steel Pad Mount with Gussets */}
      <group position={[0, 0.35, -0.05]}>
        {/* Steel mounting backing plate */}
        <mesh castShadow>
          <boxGeometry args={[0.26, 0.012, 1.16]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        {/* Front & rear vertical support risers */}
        <mesh position={[0, -0.07, 0.4]} castShadow>
          <boxGeometry args={[0.075, 0.14, 0.075]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        <mesh position={[0, -0.07, -0.4]} castShadow>
          <boxGeometry args={[0.075, 0.14, 0.075]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        {/* Hardware mounting bolts */}
        {[-0.35, 0, 0.35].map((bz, i) => (
          <group key={`bolt-pair-${i}`}>
            <HexBolt position={[0.1, -0.01, bz]} rotation={[Math.PI, 0, 0]} />
            <HexBolt position={[-0.1, -0.01, bz]} rotation={[Math.PI, 0, 0]} />
          </group>
        ))}
      </group>

      {/* ---------------- Competition Bench Cushion Pad ---------------- */}
      {/* Top surface at IPF height: y = 0.435m */}
      <group position={[0, 0.4, -0.05]}>
        {/* Main high-density foam cushion with premium grippy vinyl upholstery */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.07, 1.22]} />
          <meshPhysicalMaterial {...MAT_LEATHER_PAD} />
        </mesh>

        {/* Beveled edge contour detail */}
        <mesh position={[0, -0.002, 0]}>
          <boxGeometry args={[0.306, 0.064, 1.226]} />
          <meshPhysicalMaterial {...MAT_LEATHER_PAD} />
        </mesh>

        {/* Contrast Electric Cyan Perimeter Stitching / Piping */}
        <mesh position={[0, 0.034, 0]}>
          <boxGeometry args={[0.304, 0.004, 1.224]} />
          <meshPhysicalMaterial {...MAT_STITCHING_CYAN} />
        </mesh>

        {/* Center athletic alignment stripe */}
        <mesh position={[0, 0.036, 0]}>
          <boxGeometry args={[0.012, 0.002, 1.15]} />
          <meshPhysicalMaterial {...MAT_STITCHING_CYAN} />
        </mesh>

        {/* Subtle head-end tapered bevel plate */}
        <mesh position={[0, 0.02, -0.58]}>
          <boxGeometry args={[0.26, 0.028, 0.05]} />
          <meshPhysicalMaterial {...MAT_LEATHER_PAD} />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================== */
/*  3. Dynamic Barbell (Wrist-Tracking Olympic Barbell)                */
/* ================================================================== */

export function DynamicBarbell({
  wristL,
  wristR,
}: {
  wristL: THREE.Vector3;
  wristR: THREE.Vector3;
}) {
  const barbellRef = useRef<THREE.Group>(null!);
  const _mid = useRef(new THREE.Vector3()).current;
  const _dir = useRef(new THREE.Vector3()).current;
  const _upV = useRef(new THREE.Vector3(0, 1, 0)).current;
  const _q   = useRef(new THREE.Quaternion()).current;

  useFrame(() => {
    if (!barbellRef.current) return;
    _mid.addVectors(wristL, wristR).multiplyScalar(0.5);
    barbellRef.current.position.copy(_mid);
    _dir.subVectors(wristR, wristL);
    if (_dir.lengthSq() > 1e-6) {
      _dir.normalize();
      _q.setFromUnitVectors(_upV.set(0, 1, 0), _dir);
      barbellRef.current.quaternion.copy(_q);
    }
  });

  return (
    <group ref={barbellRef}>
      {/* ---------------- Center Shaft (28mm Diameter) ---------------- */}
      {/* Main black zinc / cerakote shaft */}
      <mesh castShadow>
        <cylinderGeometry args={[0.014, 0.014, 1.16, 24]} />
        <meshPhysicalMaterial {...MAT_BLACK_ZINC} />
      </mesh>

      {/* Center knurling band (120mm center knurl) */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.0145, 0.0145, 0.12, 24]} />
        <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
      </mesh>

      {/* Dual Outer Knurling Bands (from y = 0.20 to 0.56 on each side) */}
      {[-0.38, 0.38].map((ky, i) => (
        <group key={`outer-knurl-${i}`} position={[0, ky, 0]}>
          <mesh>
            <cylinderGeometry args={[0.0145, 0.0145, 0.36, 24]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        </group>
      ))}

      {/* Precision Chrome Knurl Ring Marks (IPF 810mm mark at ±0.405) */}
      {[-0.405, 0.405].map((my, i) => (
        <mesh key={`mark-${i}`} position={[0, my, 0]}>
          <cylinderGeometry args={[0.0148, 0.0148, 0.005, 24]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>
      ))}

      {/* ---------------- Rotating Sleeves & Plate Stacks ---------------- */}
      {([-1, 1] as const).map((dir) => {
        const sleeveCenter = dir * 0.83;
        const collarStopY = dir * 0.58;
        const bushingY = dir * 0.595;
        const plate20kgY = dir * 0.635;
        const plate10kgY = dir * 0.695;
        const lockCollarY = dir * 0.745;
        const endCapY = dir * 1.075;

        return (
          <group key={`sleeve-side-${dir}`}>
            {/* Inner Collar Shoulder Flange (thick 30mm steel stop) */}
            <mesh position={[0, collarStopY, 0]} castShadow>
              <cylinderGeometry args={[0.038, 0.038, 0.03, 24]} />
              <meshPhysicalMaterial {...MAT_CHROME} />
            </mesh>

            {/* Bronze Bushing / Needle Bearing Ring */}
            <mesh position={[0, bushingY, 0]}>
              <cylinderGeometry args={[0.028, 0.028, 0.006, 24]} />
              <meshPhysicalMaterial {...MAT_BRONZE} />
            </mesh>

            {/* Main 50mm Olympic Sleeve with Micro-Grooves */}
            <mesh position={[0, sleeveCenter, 0]} castShadow>
              <cylinderGeometry args={[0.025, 0.025, 0.48, 24]} />
              <meshPhysicalMaterial {...MAT_CHROME} />
            </mesh>

            {/* Sleeve Micro-Groove Ribs */}
            {[-0.14, 0, 0.14].map((oy, ri) => (
              <mesh key={`rib-${ri}`} position={[0, sleeveCenter + oy, 0]}>
                <cylinderGeometry args={[0.0254, 0.0254, 0.004, 24]} />
                <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
              </mesh>
            ))}

            {/* Outer End-Cap with Snap Ring & Medallion */}
            <mesh position={[0, endCapY, 0]}>
              <cylinderGeometry args={[0.0245, 0.0245, 0.01, 24]} />
              <meshPhysicalMaterial {...MAT_CHROME} />
            </mesh>
            <mesh position={[0, endCapY + dir * 0.0055, 0]}>
              <cylinderGeometry args={[0.02, 0.02, 0.002, 24]} />
              <meshPhysicalMaterial {...MAT_PLATE_BLUE} />
            </mesh>

            {/* ---------------- 20kg (45 lb) Olympic Bumper Plate ---------------- */}
            <group position={[0, plate20kgY, 0]}>
              {/* Outer vulcanized rubber tire (450mm diameter) */}
              <mesh castShadow>
                <cylinderGeometry args={[0.225, 0.225, 0.045, 32]} />
                <meshPhysicalMaterial {...MAT_RUBBER_TIRE} />
              </mesh>
              {/* Raised outer rim lip with Olympic Blue competition accent */}
              <mesh position={[0, 0, 0]}>
                <torusGeometry args={[0.22, 0.007, 8, 32]} />
                <meshPhysicalMaterial {...MAT_PLATE_BLUE} />
              </mesh>
              {/* Precision stainless steel inner hub collar (50.4mm bore) */}
              <mesh>
                <cylinderGeometry args={[0.065, 0.065, 0.047, 24]} />
                <meshPhysicalMaterial {...MAT_CHROME} />
              </mesh>
              {/* Molded face ring accent */}
              <mesh position={[0, dir * 0.023, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.13, 0.17, 32]} />
                <meshBasicMaterial color="#1d4ed8" transparent opacity={0.8} />
              </mesh>
            </group>

            {/* ---------------- 10kg (25 lb) Olympic Bumper Plate ---------------- */}
            <group position={[0, plate10kgY, 0]}>
              {/* Outer vulcanized rubber tire */}
              <mesh castShadow>
                <cylinderGeometry args={[0.19, 0.19, 0.035, 32]} />
                <meshPhysicalMaterial {...MAT_RUBBER_TIRE} />
              </mesh>
              {/* Raised outer rim lip with Olympic Green competition accent */}
              <mesh position={[0, 0, 0]}>
                <torusGeometry args={[0.185, 0.006, 8, 32]} />
                <meshPhysicalMaterial {...MAT_PLATE_GREEN} />
              </mesh>
              {/* Stainless center hub */}
              <mesh>
                <cylinderGeometry args={[0.065, 0.065, 0.037, 24]} />
                <meshPhysicalMaterial {...MAT_CHROME} />
              </mesh>
            </group>

            {/* ---------------- Quick-Release Barbell Lock-Jaw Collar ---------------- */}
            <group position={[0, lockCollarY, 0]}>
              {/* Clamping collar body (anodized red aluminum) */}
              <mesh castShadow>
                <cylinderGeometry args={[0.037, 0.037, 0.034, 16]} />
                <meshPhysicalMaterial {...MAT_COLLAR_RED} />
              </mesh>
              {/* Quick-release cam latch lever */}
              <mesh position={[0.035, 0, 0]}>
                <boxGeometry args={[0.016, 0.038, 0.014]} />
                <meshPhysicalMaterial {...MAT_HARDWARE} />
              </mesh>
              {/* High-friction rubber interior lining */}
              <mesh>
                <cylinderGeometry args={[0.027, 0.027, 0.036, 16]} />
                <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
              </mesh>
            </group>
          </group>
        );
      })}
    </group>
  );
}

/* ================================================================== */
/*  4. Commercial Hexagonal / 12-Sided Dumbbell                        */
/* ================================================================== */

export function Dumbbell({ side }: { side: -1 | 1 }) {
  return (
    <group position={[side * -0.01, 0, 0.05]} rotation={[0, 0, Math.PI / 2]}>
      {/* ---------------- Ergonomic Contoured Knurled Handle ---------------- */}
      {/* Center ergonomically thickened knurl section */}
      <mesh castShadow>
        <cylinderGeometry args={[0.016, 0.016, 0.07, 20]} />
        <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
      </mesh>
      {/* Tapered outer handle ends */}
      <mesh position={[0, 0.045, 0]}>
        <cylinderGeometry args={[0.014, 0.0155, 0.035, 20]} />
        <meshPhysicalMaterial {...MAT_CHROME} />
      </mesh>
      <mesh position={[0, -0.045, 0]}>
        <cylinderGeometry args={[0.0155, 0.014, 0.035, 20]} />
        <meshPhysicalMaterial {...MAT_CHROME} />
      </mesh>

      {/* Flared Inner Shoulder Flanges */}
      <mesh position={[0, 0.065, 0]}>
        <cylinderGeometry args={[0.022, 0.018, 0.01, 20]} />
        <meshPhysicalMaterial {...MAT_CHROME} />
      </mesh>
      <mesh position={[0, -0.065, 0]}>
        <cylinderGeometry args={[0.018, 0.022, 0.01, 20]} />
        <meshPhysicalMaterial {...MAT_CHROME} />
      </mesh>

      {/* ---------------- Heavy-Duty 12-Sided Dumbbell Heads ---------------- */}
      {[-0.092, 0.092].map((hy, idx) => (
        <group key={`head-${idx}`} position={[0, hy, 0]}>
          {/* Main 12-sided vulcanized rubber body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.075, 0.075, 0.052, 12]} />
            <meshPhysicalMaterial {...MAT_RUBBER_TIRE} />
          </mesh>
          {/* Beveled edge contour rim */}
          <mesh>
            <cylinderGeometry args={[0.071, 0.077, 0.016, 12]} />
            <meshPhysicalMaterial {...MAT_RUBBER_TIRE} />
          </mesh>

          {/* Inset End Cap Medallion */}
          <mesh position={[0, idx === 0 ? -0.027 : 0.027, 0]}>
            <cylinderGeometry args={[0.054, 0.054, 0.004, 20]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>

          {/* Contrasting Anodized Cyan Face Accent Ring */}
          <mesh position={[0, idx === 0 ? -0.029 : 0.029, 0]}>
            <torusGeometry args={[0.044, 0.0035, 8, 24]} />
            <meshPhysicalMaterial {...MAT_STITCHING_CYAN} />
          </mesh>

          {/* Recessed Stainless Center Retaining Hex Bolt */}
          <mesh position={[0, idx === 0 ? -0.03 : 0.03, 0]}>
            <cylinderGeometry args={[0.016, 0.016, 0.004, 6]} />
            <meshPhysicalMaterial {...MAT_HARDWARE} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ================================================================== */
/*  5. Competition Cast Iron & Steel Kettlebell                        */
/* ================================================================== */

export function Kettlebell() {
  return (
    <group position={[0, 0.1, 0.3]}>
      {/* Flat Ground Contact Resting Base */}
      <mesh position={[0, -0.09, 0]}>
        <cylinderGeometry args={[0.065, 0.065, 0.02, 20]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Main Cast Steel Bell Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <sphereGeometry args={[0.105, 24, 24]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Front Debossed Weight Medallion (24 KG) */}
      <mesh position={[0, 0, 0.102]}>
        <cylinderGeometry args={[0.045, 0.045, 0.005, 24]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>
      <mesh position={[0, 0, 0.105]}>
        <torusGeometry args={[0.038, 0.003, 8, 24]} />
        <meshPhysicalMaterial {...MAT_STITCHING_CYAN} />
      </mesh>

      {/* Competition Handle Horns & Grip */}
      <group position={[0, 0.11, 0]}>
        {/* Main top grip bar */}
        <mesh position={[0, 0.04, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.017, 0.017, 0.14, 20]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>
        {/* Left curved horn */}
        <mesh position={[-0.065, -0.01, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.017, 0.019, 0.09, 16]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>
        {/* Right curved horn */}
        <mesh position={[0.065, -0.01, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.017, 0.019, 0.09, 16]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>

        {/* Official 24kg Competition Color Bands (Emerald Green) */}
        <mesh position={[-0.068, -0.04, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.014, 16]} />
          <meshPhysicalMaterial {...MAT_PLATE_GREEN} />
        </mesh>
        <mesh position={[0.068, -0.04, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.014, 16]} />
          <meshPhysicalMaterial {...MAT_PLATE_GREEN} />
        </mesh>
      </group>
    </group>
  );
}

export function DynamicKettlebell({
  wristL,
  wristR,
}: {
  wristL: THREE.Vector3;
  wristR: THREE.Vector3;
}) {
  const kbRef = useRef<THREE.Group>(null!);
  const _mid = useRef(new THREE.Vector3()).current;

  useFrame(() => {
    if (!kbRef.current) return;
    _mid.addVectors(wristL, wristR).multiplyScalar(0.5);
    kbRef.current.position.copy(_mid);
  });

  return (
    <group ref={kbRef}>
      <group position={[0, -0.16, 0.04]}>
        <Kettlebell />
      </group>
    </group>
  );
}

/* ================================================================== */
/*  6. 3-in-1 Heavy Commercial Games Plyo Box                          */
/* ================================================================== */

export function PlyoBox() {
  return (
    <group position={[0, 0.3, 0.3]}>
      {/* Main High-Density Structural Core (0.50m x 0.60m x 0.70m) */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.6, 0.7]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Top High-Traction Landing Surface Pad */}
      <group position={[0, 0.302, 0]}>
        <mesh receiveShadow>
          <boxGeometry args={[0.48, 0.006, 0.68]} />
          <meshPhysicalMaterial {...MAT_LEATHER_PAD} />
        </mesh>
        {/* Contrast perimeter alignment border */}
        <mesh position={[0, 0.004, 0]}>
          <boxGeometry args={[0.44, 0.002, 0.64]} />
          <meshPhysicalMaterial {...MAT_STITCHING_CYAN} />
        </mesh>
        {/* Center landing chevron target */}
        <mesh position={[0, 0.005, 0]}>
          <boxGeometry args={[0.16, 0.002, 0.16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>

      {/* Routed Side Carry Handle Cutouts (Left & Right) */}
      {[-0.252, 0.252].map((hx, i) => (
        <group key={`handle-${i}`} position={[hx, 0.1, 0]}>
          {/* Recessed cavity backplate */}
          <mesh>
            <boxGeometry args={[0.004, 0.07, 0.18]} />
            <meshBasicMaterial color="#0b0c0e" />
          </mesh>
          {/* Tubular inner grab bar */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.16, 16]} />
            <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
          </mesh>
        </group>
      ))}

      {/* Beveled Edge Guards & Corner Reinforcement Bumpers */}
      <mesh position={[0, 0.298, 0]}>
        <boxGeometry args={[0.51, 0.01, 0.71]} />
        <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
      </mesh>
      <mesh position={[0, -0.298, 0]}>
        <boxGeometry args={[0.51, 0.01, 0.71]} />
        <meshPhysicalMaterial {...MAT_RUBBER_FEET} />
      </mesh>
    </group>
  );
}

/* ================================================================== */
/*  7. Commercial Cable Machine / Lat Pulldown Station                 */
/* ================================================================== */

export function CableMachine() {
  const stackPlates = useMemo(() => {
    const list = [];
    for (let y = 0.2; y <= 1.25; y += 0.07) {
      list.push(y);
    }
    return list;
  }, []);

  return (
    <group position={[0, 0, -0.7]}>
      {/* ---------------- Vertical Structural Tower Frame ---------------- */}
      {/* Base foot structure */}
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.88, 0.05, 0.4]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Twin vertical structural steel columns */}
      {[-0.38, 0.38].map((cx, i) => (
        <mesh key={`col-${i}`} position={[cx, 1.22, 0]} castShadow>
          <boxGeometry args={[0.06, 2.4, 0.06]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
      ))}

      {/* Top Header Crown Crossbeam */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[0.88, 0.08, 0.08]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Dual Polished Stainless Steel Guide Rods */}
      {[-0.14, 0.14].map((rx, i) => (
        <mesh key={`rod-${i}`} position={[rx, 1.15, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 2.1, 16]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>
      ))}

      {/* ---------------- Selectorized Weight Stack ---------------- */}
      {stackPlates.map((py, idx) => (
        <group key={`plate-${idx}`} position={[0, py, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.36, 0.055, 0.14]} />
            <meshPhysicalMaterial {...MAT_STEEL_DARK} />
          </mesh>
          {/* Laser-etched weight indicator label plate */}
          <mesh position={[0, 0, 0.072]}>
            <boxGeometry args={[0.06, 0.02, 0.002]} />
            <meshBasicMaterial color="#38bdf8" />
          </mesh>
        </group>
      ))}

      {/* Red Magnetic Weight Selector Pin with Coiled Lanyard */}
      <group position={[0.18, 0.62, 0.07]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.008, 0.008, 0.14, 12]} />
          <meshPhysicalMaterial {...MAT_COLLAR_RED} />
        </mesh>
        <mesh position={[0.07, 0, 0]}>
          <sphereGeometry args={[0.015, 12, 12]} />
          <meshPhysicalMaterial {...MAT_COLLAR_RED} />
        </mesh>
      </group>

      {/* ---------------- Top Pulley Head & Cable Rigging ---------------- */}
      <group position={[0, 2.36, 0.15]}>
        {/* Pulley mounting bracket */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[0.08, 0.06, 0.14]} />
          <meshPhysicalMaterial {...MAT_STEEL_DARK} />
        </mesh>
        {/* Anodized Red Aluminum Pulley Wheel */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <torusGeometry args={[0.055, 0.014, 12, 24]} />
          <meshPhysicalMaterial {...MAT_COLLAR_RED} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.03, 16]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>
      </group>

      {/* Steel Aircraft Cable running down to Lat Bar */}
      <mesh position={[0, 2.12, 0.22]}>
        <cylinderGeometry args={[0.003, 0.003, 0.48, 8]} />
        <meshPhysicalMaterial {...MAT_STEEL_DARK} />
      </mesh>

      {/* Heavy-Duty Silver Carabiner Clip */}
      <mesh position={[0, 1.88, 0.22]}>
        <torusGeometry args={[0.018, 0.004, 8, 16]} />
        <meshPhysicalMaterial {...MAT_CHROME} />
      </mesh>

      {/* ---------------- Wide Ergonomic Lat Pulldown Bar ---------------- */}
      <group position={[0, 1.84, 0.22]}>
        {/* Central swivel eyelet */}
        <mesh position={[0, 0.02, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.02, 12]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>
        {/* Main horizontal bar section */}
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.014, 0.014, 0.7, 20]} />
          <meshPhysicalMaterial {...MAT_CHROME} />
        </mesh>
        {/* Left angled drop handle */}
        <mesh position={[-0.42, -0.04, 0]} rotation={[0, 0, 0.35]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.24, 20]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>
        {/* Right angled drop handle */}
        <mesh position={[0.42, -0.04, 0]} rotation={[0, 0, -0.35]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, 0.24, 20]} />
          <meshPhysicalMaterial {...MAT_KNURL_STEEL} />
        </mesh>
      </group>
    </group>
  );
}

/* ================================================================== */
/*  8. High-Grade Dynamic Resistance Loop Band                         */
/* ================================================================== */

export function DynamicBand({
  wristL,
  wristR,
}: {
  wristL: THREE.Vector3;
  wristR: THREE.Vector3;
}) {
  const bandRef = useRef<THREE.Group>(null!);
  const meshRef = useRef<THREE.Mesh>(null!);

  const _mid = useRef(new THREE.Vector3()).current;
  const _dir = useRef(new THREE.Vector3()).current;
  const _upV = useRef(new THREE.Vector3(0, 1, 0)).current;
  const _q   = useRef(new THREE.Quaternion()).current;

  useFrame(() => {
    if (!bandRef.current || !meshRef.current) return;

    _mid.addVectors(wristL, wristR).multiplyScalar(0.5);
    bandRef.current.position.copy(_mid);

    _dir.subVectors(wristR, wristL);
    const dist = _dir.length();

    if (dist > 1e-6) {
      _dir.normalize();
      _q.setFromUnitVectors(_upV.set(0, 1, 0), _dir);
      bandRef.current.quaternion.copy(_q);

      meshRef.current.scale.set(1, dist, 1);
    }
  });

  return (
    <group ref={bandRef}>
      <mesh ref={meshRef} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.014, 0.014, 1, 16]} />
        <meshPhysicalMaterial color="#f43f5e" roughness={0.4} metalness={0.15} clearcoat={0.3} />
      </mesh>
    </group>
  );
}
