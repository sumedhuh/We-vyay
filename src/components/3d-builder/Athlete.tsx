import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Trail, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { usePushupStore, liveStats } from "./store";
import { smoothstep, evalJoint, type CustomJoints } from "./animations";

/* ---------------- helpers + temps ---------------- */
const UP = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const tmpDir = new THREE.Vector3();
const tmpMid = new THREE.Vector3();
const tmpN = new THREE.Vector3();
const tmpPerp = new THREE.Vector3();
const tmpRef = new THREE.Vector3();
const tmpBodyDir = new THREE.Vector3();
const V = () => new THREE.Vector3();

// knee-outside + foot orientation temps (module-level so they never clash with scratch)
const kA = new THREE.Vector3();
const kB = new THREE.Vector3();
const kSum = new THREE.Vector3();
const fX = new THREE.Vector3();
const fY = new THREE.Vector3();
const fZ = new THREE.Vector3();
const fUp = new THREE.Vector3();
const fM = new THREE.Matrix4();

function orientLimb(mesh: THREE.Object3D, start: THREE.Vector3, end: THREE.Vector3) {
  tmpDir.subVectors(end, start);
  const len = tmpDir.length();
  if (len < 1e-5) return;
  tmpDir.normalize();
  tmpMid.addVectors(start, end).multiplyScalar(0.5);
  mesh.position.copy(tmpMid);
  mesh.quaternion.setFromUnitVectors(UP, tmpDir);
}

/** orient + stretch a capsule so it exactly bridges start→end (totalLen = cyl + 2*radius) */
function orientScaled(mesh: THREE.Mesh, start: THREE.Vector3, end: THREE.Vector3, totalLen: number) {
  orientLimb(mesh, start, end);
  const len = start.distanceTo(end);
  mesh.scale.y = THREE.MathUtils.clamp(len / totalLen, 0.72, 1.35);
}

function solveKnee(S: THREE.Vector3, end: THREE.Vector3, l1: number, l2: number, bendRef: THREE.Vector3, out: THREE.Vector3) {
  tmpN.subVectors(end, S);
  let d = tmpN.length();
  d = THREE.MathUtils.clamp(d, 0.12, l1 + l2 - 0.004);
  tmpN.normalize();
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  tmpPerp.copy(bendRef).addScaledVector(tmpN, -bendRef.dot(tmpN));
  if (tmpPerp.lengthSq() < 1e-6) tmpPerp.set(0, 1, 0);
  tmpPerp.normalize();
  out.copy(S).addScaledVector(tmpN, a).addScaledVector(tmpPerp, h);
}

/** direction the kneecap faces = away from the inside of the bend; falls back when leg is straight */
function kneeOutside(H: THREE.Vector3, K: THREE.Vector3, A: THREE.Vector3, fallback: THREE.Vector3, out: THREE.Vector3) {
  kA.subVectors(H, K).normalize();
  kB.subVectors(A, K).normalize();
  kSum.addVectors(kA, kB);
  if (kSum.length() > 0.3) {
    out.copy(kSum).normalize().negate();
  } else {
    out.copy(fallback);
  }
}

/** point the shoe's toe (+Z) along footDir with a stable up vector */
function orientFoot(shoe: THREE.Object3D, ankle: THREE.Vector3, footDir: THREE.Vector3) {
  fZ.copy(footDir).normalize();
  if (Math.abs(fZ.y) > 0.88) fUp.set(0, 0, 1);
  else fUp.set(0, 1, 0);
  fX.crossVectors(fUp, fZ);
  if (fX.lengthSq() < 1e-6) fX.set(1, 0, 0);
  fX.normalize();
  fY.crossVectors(fZ, fX).normalize();
  fM.makeBasis(fX, fY, fZ);
  shoe.quaternion.setFromRotationMatrix(fM);
  // ankle joint sits just behind the shoe's midfoot (anatomical)
  shoe.position.copy(ankle).addScaledVector(fZ, 0.045);
}

// legacy rig: custom channels are no longer sourced here (studio uses PoseAthlete)
function jval(_J: CustomJoints | null, _id: string, _frac: number): number {
  void evalJoint;
  return 0;
}

/* ---------------- rig dimensions (metres) ---------------- */
const ANKLE_Z = -1.05;
const ANKLE_Y = 0.13;
const SHOULDER_TOP_Z = 0.25;
const TOP_H = 0.6;
const BOTTOM_H = 0.2;
const HIP_T = 0.38;
const L1 = 0.3;
const L2 = 0.3;
const LEG_L1 = 0.45; // thigh (hip→knee)
const LEG_L2 = 0.44; // shin (knee→ankle)
const BODY_LEN = Math.sqrt((SHOULDER_TOP_Z - ANKLE_Z) ** 2 + TOP_H ** 2);
const CYCLE_SECONDS = 2.6;

// capsule totals (cyl length + 2*radius) — must match geometry below
const UPPER_TOTAL = 0.3;
const FORE_TOTAL = 0.3;
const THIGH_TOTAL = 0.45;
const SHIN_TOTAL = 0.44;
const SOCK_TOTAL = 0.18;

export default function Athlete() {
  const skinTone = usePushupStore((s) => s.skinTone);
  const shirtColor = usePushupStore((s) => s.shirtColor);
  const shortsColor = usePushupStore((s) => s.shortsColor);
  const showTrail = usePushupStore((s) => s.showTrail);
  const showAngles = usePushupStore((s) => s.showAngles);

  const skinDark = useMemo(() => new THREE.Color(skinTone).multiplyScalar(0.86).getStyle(), [skinTone]);
  const skinDeep = useMemo(() => new THREE.Color(skinTone).multiplyScalar(0.72).getStyle(), [skinTone]);
  const shirtDark = useMemo(() => new THREE.Color(shirtColor).multiplyScalar(0.7).getStyle(), [shirtColor]);

  const phase = useRef(0);
  const prevEffort = useRef(0);

  // core skeleton
  const chestRef = useRef<THREE.Mesh>(null!);
  const absRef = useRef<THREE.Mesh>(null!);
  const pelvisRef = useRef<THREE.Mesh>(null!);
  const waistbandRef = useRef<THREE.Mesh>(null!);
  const neckRef = useRef<THREE.Mesh>(null!);
  const headGroup = useRef<THREE.Group>(null!);
  const collarRef = useRef<THREE.Mesh>(null!);

  // muscles / torso detail
  const pecL = useRef<THREE.Mesh>(null!);
  const pecR = useRef<THREE.Mesh>(null!);
  const abBump1 = useRef<THREE.Mesh>(null!);
  const abBump2 = useRef<THREE.Mesh>(null!);
  const trapL = useRef<THREE.Mesh>(null!);
  const trapR = useRef<THREE.Mesh>(null!);
  const gluteL = useRef<THREE.Mesh>(null!);
  const gluteR = useRef<THREE.Mesh>(null!);

  // arms
  const upperL = useRef<THREE.Mesh>(null!);
  const upperR = useRef<THREE.Mesh>(null!);
  const foreL = useRef<THREE.Mesh>(null!);
  const foreR = useRef<THREE.Mesh>(null!);
  const deltL = useRef<THREE.Mesh>(null!);
  const deltR = useRef<THREE.Mesh>(null!);
  const elbowL = useRef<THREE.Mesh>(null!);
  const elbowR = useRef<THREE.Mesh>(null!);
  const bicepL = useRef<THREE.Mesh>(null!);
  const bicepR = useRef<THREE.Mesh>(null!);
  const wristL = useRef<THREE.Mesh>(null!);
  const wristR = useRef<THREE.Mesh>(null!);
  const handL = useRef<THREE.Group>(null!);
  const handR = useRef<THREE.Group>(null!);
  const fistL = useRef<THREE.Group>(null!);
  const fistR = useRef<THREE.Group>(null!);
  const labelL = useRef<THREE.Group>(null!);
  const labelR = useRef<THREE.Group>(null!);

  // legs
  const thighL = useRef<THREE.Mesh>(null!);
  const thighR = useRef<THREE.Mesh>(null!);
  const shinL = useRef<THREE.Mesh>(null!);
  const shinR = useRef<THREE.Mesh>(null!);
  const kneeL = useRef<THREE.Mesh>(null!);
  const kneeR = useRef<THREE.Mesh>(null!);
  const patellaL = useRef<THREE.Mesh>(null!);
  const patellaR = useRef<THREE.Mesh>(null!);
  const quadL = useRef<THREE.Mesh>(null!);
  const quadR = useRef<THREE.Mesh>(null!);
  const calfL = useRef<THREE.Mesh>(null!);
  const calfR = useRef<THREE.Mesh>(null!);
  const ankleL = useRef<THREE.Mesh>(null!);
  const ankleR = useRef<THREE.Mesh>(null!);
  const shortL = useRef<THREE.Mesh>(null!);
  const shortR = useRef<THREE.Mesh>(null!);
  const shoeL = useRef<THREE.Group>(null!);
  const shoeR = useRef<THREE.Group>(null!);
  const sockL = useRef<THREE.Mesh>(null!);
  const sockR = useRef<THREE.Mesh>(null!);

  const trailAnchor = useRef<THREE.Group>(null!);
  const chestGlow = useRef<THREE.Mesh>(null!);
  const floorTarget = useRef<THREE.Mesh>(null!);

  const scratch = useMemo(
    () => ({
      shoulderCenter: V(), hipCenter: V(), ankleCenter: V(), midTorso: V(), headPos: V(),
      S: V(), E: V(), W: V(), hipSide: V(), ankleSide: V(), knee: V(), foot: V(),
      tuck: V(), bendRef: V(), pelvis: V(), M: V(), handPos: V(), toeA: V(), toeB: V(),
      footUp: V(), vA: V(), vB: V(), shoeDir: V(), neckB: V(), front: V(),
      kneeOut: V(), fallback: V(), shinDir: V(), sockTop: V(), thighDir: V(), quadDir: V(),
    }),
    []
  );

  useFrame((state, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = usePushupStore.getState();
    const useCustom = false;
    const anim = store.anim;
    const effectiveSpeed = store.speed * (store.slowMo ? 0.25 : 1);

    if (store.playing) {
      phase.current += delta * effectiveSpeed * ((Math.PI * 2) / CYCLE_SECONDS);
      if (phase.current >= Math.PI * 2) {
        phase.current -= Math.PI * 2;
        const amp =
          anim.base === "plank"
            ? Math.abs(anim.toDepth - anim.fromDepth) + anim.kneeDrive * 0.6
            : Math.max(Math.abs(anim.toCurl - anim.fromCurl), Math.abs(anim.toLegRaise - anim.fromLegRaise));
        if (amp > 0.15) store.incrementReps();
      }
    }

    const p = phase.current;
    const frac = p / (Math.PI * 2);
    const raw = (1 - Math.cos(p)) / 2;
    const smooth = smoothstep(raw);
    const base = anim.base;
    const J = null as unknown as CustomJoints;

    // legacy preset rig has no custom joint channels
    const cChest = 0;
    const cHips = 0;
    const cSpread = 1;
    const cKneeL = 0;
    const cKneeR = 0;
    const cCurl = 0;
    const cLegL = 0;
    const cLegR = 0;
    const cBridge = 0;
    void cCurl; void cLegL; void cLegR; void cBridge;
    const cHead = useCustom ? jval(J, "head", frac) / 50 : 0; // -1..1
    const cSway = useCustom ? (jval(J, "sway", frac) / 100) * 0.22 : 0; // metres

    const s = scratch;
    let effort = 0;
    let jointAngle = 170;
    let jointLabel = "ELBOW";
    let phaseName = "top";
    let phaseVel = 0;

    /* ================= PLANK ================= */
    if (base === "plank") {
      const depth = useCustom ? THREE.MathUtils.clamp(cChest, 0, 1) : THREE.MathUtils.lerp(anim.fromDepth, anim.toDepth, smooth);
      const pikeAmt = useCustom ? THREE.MathUtils.clamp(cHips, 0, 1) * 0.8 : anim.pike;
      const spread = useCustom ? THREE.MathUtils.clamp(cSpread, 0.4, 1.8) : anim.handSpread;
      effort = Math.max(depth, useCustom ? Math.max(cHips * 0.7, cKneeL * 0.6, cKneeR * 0.6) : 0);

      const shoulderH = THREE.MathUtils.lerp(TOP_H, BOTTOM_H, depth);
      const dzSafe = Math.sqrt(Math.max(0.2, BODY_LEN * BODY_LEN - shoulderH * shoulderH));
      const shoulderZ = ANKLE_Z + dzSafe;

      s.shoulderCenter.set(cSway, shoulderH, shoulderZ);
      s.ankleCenter.set(cSway * 0.3, ANKLE_Y, ANKLE_Z);
      s.hipCenter.lerpVectors(s.shoulderCenter, s.ankleCenter, HIP_T);
      s.hipCenter.y += pikeAmt * 0.55 + 0.02;
      s.hipCenter.z -= pikeAmt * 0.2;
      s.hipCenter.x = cSway * 0.7;
      s.midTorso.lerpVectors(s.shoulderCenter, s.hipCenter, 0.45);
      tmpBodyDir.subVectors(s.shoulderCenter, s.hipCenter).normalize();
      s.headPos.copy(s.shoulderCenter).addScaledVector(tmpBodyDir, 0.17);
      s.headPos.y += 0.1;
      s.headPos.z += 0.05;
      s.neckB.copy(s.shoulderCenter).add(s.vA.set(0, 0.05, -0.01));

      // torso core
      s.vA.copy(s.shoulderCenter); s.vA.y -= 0.03; s.vA.z -= 0.01;
      orientLimb(chestRef.current, s.vA, s.midTorso);
      s.vB.copy(s.hipCenter); s.vB.y += 0.03;
      orientLimb(absRef.current, s.midTorso, s.vB);
      pelvisRef.current.position.copy(s.hipCenter);
      pelvisRef.current.quaternion.setFromUnitVectors(UP, tmpBodyDir);
      waistbandRef.current.position.copy(s.hipCenter).addScaledVector(tmpBodyDir, -0.02);
      waistbandRef.current.quaternion.copy(pelvisRef.current.quaternion);

      const flex = 1 + depth * 0.1;
      chestRef.current.scale.set(flex, 1, 1 + depth * 0.06);
      const breathe = 1 + Math.sin(state.clock.elapsedTime * 2.2) * 0.012;
      absRef.current.scale.set(breathe, 1, breathe);

      collarRef.current.position.copy(s.shoulderCenter).addScaledVector(tmpBodyDir, 0.03).add(s.vA.set(0, 0.045, 0));
      collarRef.current.quaternion.setFromUnitVectors(Z_AXIS, tmpBodyDir);

      // pecs + abs face the floor in plank
      const pecFlex = 1 + depth * 0.18;
      s.vB.lerpVectors(s.shoulderCenter, s.midTorso, 0.32);
      pecL.current.position.set(s.vB.x - 0.075, s.vB.y - 0.1, s.vB.z + 0.01);
      pecR.current.position.set(s.vB.x + 0.075, s.vB.y - 0.1, s.vB.z + 0.01);
      pecL.current.scale.set(1, 0.72 * pecFlex, 0.66);
      pecR.current.scale.set(1, 0.72 * pecFlex, 0.66);
      s.vA.lerpVectors(s.midTorso, s.hipCenter, 0.3);
      abBump1.current.position.set(s.vA.x, s.vA.y - 0.095, s.vA.z);
      s.vA.lerpVectors(s.midTorso, s.hipCenter, 0.62);
      abBump2.current.position.set(s.vA.x, s.vA.y - 0.095, s.vA.z);

      // glutes face up in plank
      gluteL.current.position.set(s.hipCenter.x - 0.072, s.hipCenter.y + 0.075, s.hipCenter.z - 0.055);
      gluteR.current.position.set(s.hipCenter.x + 0.072, s.hipCenter.y + 0.075, s.hipCenter.z - 0.055);

      // neck + head
      s.vA.copy(s.shoulderCenter).addScaledVector(tmpBodyDir, 0.02); s.vA.y += 0.04;
      s.vB.copy(s.headPos); s.vB.y -= 0.08;
      orientLimb(neckRef.current, s.vA, s.vB);
      headGroup.current.position.copy(s.headPos);
      headGroup.current.rotation.set(0.85 + depth * 0.12 + cHead * 0.25, cSway * 1.2, 0);

      // ---- arms (2-bone IK, exact-fit capsules) ----
      const handX = Math.max(0.06, 0.295 * spread);
      const shX = 0.12 + 0.08 * Math.min(spread, 1.4);
      for (const side of [-1, 1] as const) {
        const isLeft = side < 0;
        s.S.set(side * shX + cSway, shoulderH + 0.015, shoulderZ);
        s.W.set(side * handX + cSway * 0.35, 0.1, 0.335);
        tmpN.subVectors(s.W, s.S);
        let d = tmpN.length();
        d = THREE.MathUtils.clamp(d, 0.18, L1 + L2 - 0.008);
        tmpN.normalize();
        const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
        const sideFlare = 2.2 - spread * 1.2;
        tmpRef.set(side * sideFlare, 0.2, -0.55).normalize();
        tmpPerp.copy(tmpRef).addScaledVector(tmpN, -tmpRef.dot(tmpN)).normalize();
        s.E.copy(s.S).addScaledVector(tmpN, a).addScaledVector(tmpPerp, h);

        const upper = isLeft ? upperL.current : upperR.current;
        const fore = isLeft ? foreL.current : foreR.current;
        const delt = isLeft ? deltL.current : deltR.current;
        const elb = isLeft ? elbowL.current : elbowR.current;
        const bic = isLeft ? bicepL.current : bicepR.current;
        const wri = isLeft ? wristL.current : wristR.current;
        const hand = isLeft ? handL.current : handR.current;
        const fist = isLeft ? fistL.current : fistR.current;
        const trap = isLeft ? trapL.current : trapR.current;
        const lab = isLeft ? labelL.current : labelR.current;

        orientScaled(upper, s.S, s.E, UPPER_TOTAL);
        orientScaled(fore, s.E, s.W, FORE_TOTAL);
        const bulge = 1 + depth * 0.14;
        upper.scale.x = bulge;
        upper.scale.z = bulge;
        delt.position.copy(s.S);
        elb.position.copy(s.E);
        s.vA.lerpVectors(s.S, s.E, 0.38);
        bic.position.set(s.vA.x + side * 0.015, s.vA.y + 0.015, s.vA.z);
        bic.scale.set(1 + depth * 0.3, 1 + depth * 0.18, 1 + depth * 0.3);
        wri.position.copy(s.W);
        orientLimb(trap, s.neckB, s.vB.copy(s.S).add(s.front.set(0, 0.02, -0.01)));
        hand.position.set(side * handX + cSway * 0.35, 0, 0);
        hand.visible = true;
        fist.visible = false;
        lab.position.copy(s.E).add(s.vA.set(side * 0.16, 0.06, 0));

        if (isLeft) {
          s.vA.subVectors(s.S, s.E).normalize();
          s.vB.subVectors(s.W, s.E).normalize();
          jointAngle = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(s.vA.dot(s.vB), -1, 1)));
        }
      }
      jointLabel = "ELBOW";

      // ---- LEGS — human hinge knees, always IK (no straight/tuck pop) ----
      let driveL: number, driveR: number;
      if (useCustom) {
        driveL = THREE.MathUtils.clamp(cKneeL, 0, 1);
        driveR = THREE.MathUtils.clamp(cKneeR, 0, 1);
      } else {
        driveL = anim.kneeDrive * (0.5 - 0.5 * Math.cos(p));
        driveR = anim.kneeDrive * (0.5 - 0.5 * Math.cos(p + Math.PI));
      }
      // heels lift + slide slightly in pike so legs stay reachable (like downward-dog)
      const ankY = ANKLE_Y + pikeAmt * 0.04;
      const ankZ = ANKLE_Z + pikeAmt * 0.15;

      for (const side of [-1, 1] as const) {
        const isLeft = side < 0;
        const drive = THREE.MathUtils.clamp(isLeft ? driveL : driveR, 0, 1);

        // hip joints sit purely sideways on the pelvis → constant leg reach
        s.hipSide.copy(s.hipCenter).add(s.vA.set(side * 0.105, 0, 0));
        s.ankleSide.set(side * 0.095 + cSway * 0.3, ankY, ankZ);
        // tucked ankle: under the ribs, slightly narrower, lifted off the floor
        s.tuck.set(side * 0.09 + cSway, 0.24, shoulderZ - 0.42);
        s.foot.lerpVectors(s.ankleSide, s.tuck, drive);

        // knees bend DOWN + FORWARD (toward the chest), slightly out — never up through the body
        s.bendRef.set(0.22 * side, -0.45, 0.9);
        solveKnee(s.hipSide, s.foot, LEG_L1, LEG_L2, s.bendRef, s.knee);
        if (s.knee.y < 0.055) s.knee.y = 0.055; // never through the floor

        const thigh = isLeft ? thighL.current : thighR.current;
        const shin = isLeft ? shinL.current : shinR.current;
        const kn = isLeft ? kneeL.current : kneeR.current;
        const pat = isLeft ? patellaL.current : patellaR.current;
        const quad = isLeft ? quadL.current : quadR.current;
        const calf = isLeft ? calfL.current : calfR.current;
        const ank = isLeft ? ankleL.current : ankleR.current;
        const short = isLeft ? shortL.current : shortR.current;
        const shoe = isLeft ? shoeL.current : shoeR.current;
        const sock = isLeft ? sockL.current : sockR.current;

        orientScaled(thigh, s.hipSide, s.knee, THIGH_TOTAL);
        orientScaled(shin, s.knee, s.foot, SHIN_TOTAL);
        // quads swell as the knee drives
        const girth = 1 + drive * 0.07;
        thigh.scale.x = girth;
        thigh.scale.z = girth;
        kn.position.copy(s.knee);

        // kneecap / muscles follow the true bend plane (not fixed world offsets)
        s.fallback.set(0, -1, 0.25).normalize();
        kneeOutside(s.hipSide, s.knee, s.foot, s.fallback, s.kneeOut);
        pat.position.copy(s.knee).addScaledVector(s.kneeOut, 0.05);

        // muscle offsets stay perpendicular to their bone even in deep flexion
        s.thighDir.subVectors(s.knee, s.hipSide).normalize();
        s.quadDir.copy(s.kneeOut).addScaledVector(s.thighDir, -s.kneeOut.dot(s.thighDir));
        if (s.quadDir.lengthSq() < 0.04) s.quadDir.copy(s.kneeOut);
        else s.quadDir.normalize();
        s.shinDir.subVectors(s.foot, s.knee).normalize();
        s.front.copy(s.kneeOut).negate().addScaledVector(s.shinDir, s.kneeOut.dot(s.shinDir));
        if (s.front.lengthSq() < 0.04) s.front.copy(s.kneeOut).negate();
        else s.front.normalize();

        s.vA.lerpVectors(s.hipSide, s.knee, 0.42).addScaledVector(s.quadDir, 0.055);
        quad.position.copy(s.vA);
        quad.quaternion.copy(thigh.quaternion);

        s.vA.lerpVectors(s.knee, s.foot, 0.3).addScaledVector(s.front, 0.05);
        calf.position.copy(s.vA);
        calf.quaternion.copy(shin.quaternion);

        s.vA.lerpVectors(s.hipSide, s.knee, 0.13);
        short.position.copy(s.vA);
        short.quaternion.copy(thigh.quaternion);

        s.sockTop.lerpVectors(s.knee, s.foot, 0.72);
        orientScaled(sock, s.sockTop, s.foot, SOCK_TOTAL);
        ank.position.copy(s.foot);

        // foot: toes run down-back off the shin (toe-stand in plank, dangle when tucked)
        s.shoeDir.copy(s.shinDir).multiplyScalar(0.35).add(s.vA.set(0, -0.75, -0.55)).normalize();
        orientFoot(shoe, s.foot, s.shoeDir);
      }

      trailAnchor.current.position.copy(s.shoulderCenter).add(s.vA.set(0, -0.1, 0.02));

      phaseVel = delta > 0 ? (effort - prevEffort.current) / delta : 0;
      prevEffort.current = effort;
      phaseName = effort < 0.06 ? "top" : effort > 0.94 ? "bottom" : phaseVel > 0.02 ? "lower" : "push";

      liveStats.plankDepth = depth;
      liveStats.kneeDrive = Math.max(driveL, driveR);
      liveStats.shoulderHeight = shoulderH;
      liveStats.curl = 0;
      liveStats.legRaise = 0;

    /* ================= SUPINE ================= */
    } else {
      const curl = THREE.MathUtils.lerp(anim.fromCurl, anim.toCurl, smooth);
      const legRaiseBase = THREE.MathUtils.lerp(anim.fromLegRaise, anim.toLegRaise, smooth);
      const kneeBend = anim.kneeBend;
      const armsPose = anim.arms;
      const bridgeLift = 0;
      const legL = legRaiseBase;
      const legR = legRaiseBase;
      effort = Math.max(curl * 0.75, legL, legR, useCustom ? cBridge * 0.8 : 0);

      s.pelvis.set(cSway * 0.5, 0.15 + bridgeLift, -0.2);
      const ce = smoothstep(THREE.MathUtils.clamp(curl, 0, 1));
      const extra = Math.max(0, curl - 1);
      s.shoulderCenter.set(cSway, 0.16 + 0.3 * ce + extra * 0.4, 0.62 - 0.22 * ce - extra * 0.16);
      s.M.set(cSway * 0.8, 0.15 + 0.13 * ce + bridgeLift * 0.5, 0.2 + 0.02 * ce);
      tmpBodyDir.subVectors(s.shoulderCenter, s.M).normalize();
      s.headPos.copy(s.shoulderCenter).addScaledVector(tmpBodyDir, 0.13);
      s.headPos.y += 0.06;
      s.headPos.z += 0.02;
      s.neckB.copy(s.shoulderCenter).add(s.vA.set(0, 0.04, -0.02));

      orientLimb(absRef.current, s.pelvis, s.M);
      orientLimb(chestRef.current, s.M, s.shoulderCenter);
      pelvisRef.current.position.copy(s.pelvis);
      pelvisRef.current.quaternion.setFromUnitVectors(UP, tmpBodyDir);
      waistbandRef.current.position.copy(s.pelvis).addScaledVector(tmpBodyDir, -0.02);
      waistbandRef.current.quaternion.copy(pelvisRef.current.quaternion);
      chestRef.current.scale.set(1 + ce * 0.08, 1, 1);
      absRef.current.scale.set(1 + ce * 0.06, 1, 1 + ce * 0.06);

      collarRef.current.position.copy(s.shoulderCenter).addScaledVector(tmpBodyDir, 0.02).add(s.vA.set(0, 0.05, 0));
      collarRef.current.quaternion.setFromUnitVectors(Z_AXIS, tmpBodyDir);

      // pecs + abs face the sky in supine
      s.vB.lerpVectors(s.shoulderCenter, s.M, 0.35);
      pecL.current.position.set(s.vB.x - 0.075, s.vB.y + 0.1, s.vB.z);
      pecR.current.position.set(s.vB.x + 0.075, s.vB.y + 0.1, s.vB.z);
      pecL.current.scale.set(1, 0.72, 0.66);
      pecR.current.scale.set(1, 0.72, 0.66);
      const abPop = 1 + ce * 0.25;
      s.vA.lerpVectors(s.M, s.pelvis, 0.3);
      abBump1.current.position.set(s.vA.x, s.vA.y + 0.085, s.vA.z);
      abBump1.current.scale.set(1.1 * abPop, 0.8 * abPop, 0.7);
      s.vA.lerpVectors(s.M, s.pelvis, 0.6);
      abBump2.current.position.set(s.vA.x, s.vA.y + 0.085, s.vA.z);
      abBump2.current.scale.set(1.1 * abPop, 0.8 * abPop, 0.7);

      gluteL.current.position.set(s.pelvis.x - 0.072, s.pelvis.y - 0.05, s.pelvis.z - 0.03);
      gluteR.current.position.set(s.pelvis.x + 0.072, s.pelvis.y - 0.05, s.pelvis.z - 0.03);

      s.vA.copy(s.shoulderCenter); s.vA.y += 0.03;
      s.vB.copy(s.headPos); s.vB.y -= 0.08;
      orientLimb(neckRef.current, s.vA, s.vB);
      headGroup.current.position.copy(s.headPos);
      headGroup.current.rotation.set(-Math.PI / 2 + ce * 0.45 + extra * 0.2 + cHead * 0.25, 0, cSway);

      // ---- arms ----
      for (const side of [-1, 1] as const) {
        const isLeft = side < 0;
        s.S.copy(s.shoulderCenter).add(s.vA.set(side * 0.14, 0, -0.02));
        if (armsPose === "head") {
          s.E.copy(s.S).add(s.vA.set(side * 0.2, 0.05 + ce * 0.1, -0.05));
          s.handPos.copy(s.headPos).add(s.vB.set(side * 0.09, 0.02, -0.03));
        } else {
          s.E.copy(s.S).add(s.vA.set(side * 0.12, 0.06 + ce * 0.08, 0.02));
          s.handPos.set(side * -0.04 + cSway, 0.18 + ce * 0.22, s.shoulderCenter.z - 0.08);
        }
        const upper = isLeft ? upperL.current : upperR.current;
        const fore = isLeft ? foreL.current : foreR.current;
        const delt = isLeft ? deltL.current : deltR.current;
        const elb = isLeft ? elbowL.current : elbowR.current;
        const bic = isLeft ? bicepL.current : bicepR.current;
        const wri = isLeft ? wristL.current : wristR.current;
        const hand = isLeft ? handL.current : handR.current;
        const fist = isLeft ? fistL.current : fistR.current;
        const trap = isLeft ? trapL.current : trapR.current;
        const lab = isLeft ? labelL.current : labelR.current;
        orientScaled(upper, s.S, s.E, UPPER_TOTAL);
        orientScaled(fore, s.E, s.handPos, FORE_TOTAL);
        upper.scale.x = 1;
        upper.scale.z = 1;
        delt.position.copy(s.S);
        elb.position.copy(s.E);
        s.vA.lerpVectors(s.S, s.E, 0.4);
        bic.position.copy(s.vA);
        bic.scale.set(1, 1, 1);
        wri.position.copy(s.handPos);
        orientLimb(trap, s.neckB, s.vB.copy(s.S).add(s.front.set(0, 0.02, 0)));
        hand.visible = false;
        fist.visible = true;
        fist.position.copy(s.handPos);
        lab.position.copy(s.E).add(s.vA.set(side * 0.14, 0.08, 0));
      }
      jointLabel = "ELBOW";

      // ---- LEGS — independent L/R, anatomically reachable targets ----
      const avgLift = (legL + legR) / 2;
      for (const side of [-1, 1] as const) {
        const isLeft = side < 0;
        const lift = THREE.MathUtils.clamp(isLeft ? legL : legR, 0, 1);

        s.hipSide.copy(s.pelvis).add(s.vA.set(side * 0.1, -0.01, 0.01));
        // pelvis tilts a touch when legs move independently
        s.hipSide.y += (lift - avgLift) * 0.035;

        s.toeA.set(side * 0.11 + cSway * 0.2, 0.07, -0.6); // feet planted, soles flat (ankle height)
        s.toeB.set(side * 0.1 + cSway * 0.2, 0.1, -1.07); // legs flat (matches 0.89 reach)
        s.ankleSide.lerpVectors(s.toeA, s.toeB, 1 - kneeBend);
        s.footUp.set(side * 0.1 + cSway * 0.3, 1.0, -0.2); // legs vertical (matches reach)
        s.foot.lerpVectors(s.ankleSide, s.footUp, lift);

        // knees bend UP (and slightly out) — the only human direction lying down
        s.bendRef.set(0.25 * side, 1, -0.25);
        solveKnee(s.hipSide, s.foot, LEG_L1, LEG_L2, s.bendRef, s.knee);
        if (s.knee.y < 0.05) s.knee.y = 0.05;

        const thigh = isLeft ? thighL.current : thighR.current;
        const shin = isLeft ? shinL.current : shinR.current;
        const kn = isLeft ? kneeL.current : kneeR.current;
        const pat = isLeft ? patellaL.current : patellaR.current;
        const quad = isLeft ? quadL.current : quadR.current;
        const calf = isLeft ? calfL.current : calfR.current;
        const ank = isLeft ? ankleL.current : ankleR.current;
        const short = isLeft ? shortL.current : shortR.current;
        const shoe = isLeft ? shoeL.current : shoeR.current;
        const sock = isLeft ? sockL.current : sockR.current;

        orientScaled(thigh, s.hipSide, s.knee, THIGH_TOTAL);
        orientScaled(shin, s.knee, s.foot, SHIN_TOTAL);
        const girth = 1 + lift * 0.06 + (1 - kneeBend) * 0.0;
        thigh.scale.x = girth;
        thigh.scale.z = girth;
        kn.position.copy(s.knee);

        // straight-leg fallback rotates from UP (flat) to FORWARD (vertical)
        s.fallback.set(0, 1 - lift * 0.8, 0.2 + lift * 0.8).normalize();
        kneeOutside(s.hipSide, s.knee, s.foot, s.fallback, s.kneeOut);
        pat.position.copy(s.knee).addScaledVector(s.kneeOut, 0.05);

        s.thighDir.subVectors(s.knee, s.hipSide).normalize();
        s.quadDir.copy(s.kneeOut).addScaledVector(s.thighDir, -s.kneeOut.dot(s.thighDir));
        if (s.quadDir.lengthSq() < 0.04) s.quadDir.copy(s.kneeOut);
        else s.quadDir.normalize();
        s.shinDir.subVectors(s.foot, s.knee).normalize();
        s.front.copy(s.kneeOut).negate().addScaledVector(s.shinDir, s.kneeOut.dot(s.shinDir));
        if (s.front.lengthSq() < 0.04) s.front.copy(s.kneeOut).negate();
        else s.front.normalize();

        s.vA.lerpVectors(s.hipSide, s.knee, 0.42).addScaledVector(s.quadDir, 0.055);
        quad.position.copy(s.vA);
        quad.quaternion.copy(thigh.quaternion);

        s.vA.lerpVectors(s.knee, s.foot, 0.3).addScaledVector(s.front, 0.05);
        calf.position.copy(s.vA);
        calf.quaternion.copy(shin.quaternion);

        s.vA.lerpVectors(s.hipSide, s.knee, 0.13);
        short.position.copy(s.vA);
        short.quaternion.copy(thigh.quaternion);

        s.sockTop.lerpVectors(s.knee, s.foot, 0.72);
        orientScaled(sock, s.sockTop, s.foot, SOCK_TOTAL);
        ank.position.copy(s.foot);

        // foot behaviour blends: planted→flat on floor, legs flat→toes up, raised→toes pointed
        const wUp = lift;
        const wPlant = (1 - lift) * kneeBend;
        const wFlat = (1 - lift) * (1 - kneeBend);
        s.shoeDir.set(0, 0, 0)
          .addScaledVector(s.shinDir, wUp)
          .addScaledVector(s.vA.set(0, 0.05, 1), wPlant)
          .addScaledVector(s.vB.set(0, 0.85, -0.15), wFlat);
        if (s.shoeDir.lengthSq() < 1e-6) s.shoeDir.set(0, 0.05, 1);
        s.shoeDir.normalize();
        orientFoot(shoe, s.foot, s.shoeDir);

        if (isLeft) {
          s.vA.subVectors(s.hipSide, s.knee).normalize();
          s.vB.subVectors(s.foot, s.knee).normalize();
          jointAngle = THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(s.vA.dot(s.vB), -1, 1)));
        }
      }
      jointLabel = "KNEE";

      trailAnchor.current.position.copy(s.shoulderCenter).add(s.vA.set(0, -0.04, 0));

      phaseVel = delta > 0 ? (effort - prevEffort.current) / delta : 0;
      prevEffort.current = effort;
      phaseName = curl < 0.06 && Math.max(legL, legR) < 0.1 && cBridge < 0.08 ? "rest" : curl > 0.9 ? "peak" : phaseVel > 0.02 ? "crunch" : "unroll";

      liveStats.curl = curl;
      liveStats.legRaise = Math.max(legL, legR);
      liveStats.kneeDrive = 0;
      liveStats.shoulderHeight = s.shoulderCenter.y;
      liveStats.plankDepth = 0;
    }

    // glow markers
    chestGlow.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.08);
    (chestGlow.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + effort * 0.5;
    const pulse = effort > 0.85 ? 1 + Math.sin(state.clock.elapsedTime * 10) * 0.08 : 1;
    floorTarget.current.scale.setScalar(pulse);
    (floorTarget.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + effort * 0.5;

    liveStats.mode = base;
    liveStats.effort = effort;
    liveStats.jointAngle = jointAngle;
    liveStats.jointLabel = jointLabel;
    liveStats.phase = phaseName;
    liveStats.phaseFrac = frac;
    liveStats.velocity = phaseVel;
  });

  return (
    <group>
      {/* ---------- TORSO CORE ---------- */}
      <mesh ref={chestRef} castShadow>
        <capsuleGeometry args={[0.155, 0.2, 8, 20]} />
        <meshStandardMaterial color={shirtColor} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh ref={absRef} castShadow>
        <capsuleGeometry args={[0.125, 0.16, 8, 20]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh ref={pelvisRef} castShadow scale={[1.15, 1.35, 1.05]}>
        <sphereGeometry args={[0.135, 24, 18]} />
        <meshStandardMaterial color={shortsColor} roughness={0.65} />
      </mesh>
      <mesh ref={waistbandRef} scale={[1, 0.35, 1]}>
        <torusGeometry args={[0.13, 0.018, 10, 24]} />
        <meshStandardMaterial color="#3a4150" roughness={0.7} />
      </mesh>
      <mesh ref={collarRef}>
        <torusGeometry args={[0.068, 0.014, 8, 22]} />
        <meshStandardMaterial color={shirtDark} roughness={0.6} />
      </mesh>
      <mesh ref={neckRef} castShadow>
        <capsuleGeometry args={[0.055, 0.06, 6, 12]} />
        <meshStandardMaterial color={skinTone} roughness={0.55} />
      </mesh>

      {/* ---------- MUSCLE DETAIL ---------- */}
      <mesh ref={pecL} castShadow>
        <sphereGeometry args={[0.075, 18, 14]} />
        <meshStandardMaterial color={shirtColor} roughness={0.55} />
      </mesh>
      <mesh ref={pecR} castShadow>
        <sphereGeometry args={[0.075, 18, 14]} />
        <meshStandardMaterial color={shirtColor} roughness={0.55} />
      </mesh>
      <mesh ref={abBump1}>
        <sphereGeometry args={[0.048, 14, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh ref={abBump2}>
        <sphereGeometry args={[0.048, 14, 12]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh ref={trapL}>
        <capsuleGeometry args={[0.045, 0.06, 6, 10]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh ref={trapR}>
        <capsuleGeometry args={[0.045, 0.06, 6, 10]} />
        <meshStandardMaterial color={shirtColor} roughness={0.6} />
      </mesh>
      <mesh ref={gluteL} castShadow scale={[1, 0.9, 0.95]}>
        <sphereGeometry args={[0.085, 18, 14]} />
        <meshStandardMaterial color={shortsColor} roughness={0.65} />
      </mesh>
      <mesh ref={gluteR} castShadow scale={[1, 0.9, 0.95]}>
        <sphereGeometry args={[0.085, 18, 14]} />
        <meshStandardMaterial color={shortsColor} roughness={0.65} />
      </mesh>

      {/* ---------- HEAD ---------- */}
      <group ref={headGroup}>
        {/* Upper skull */}
        <mesh castShadow position={[0, 0.02, -0.01]} scale={[1.08, 1, 1.05]}>
          <sphereGeometry args={[0.112, 28, 22]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
        {/* Wide chiseled jaw */}
        <mesh castShadow position={[0, -0.035, 0.02]} scale={[1.25, 0.9, 1]}>
          <sphereGeometry args={[0.088, 24, 18]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>
        {/* Defined chin */}
        <mesh castShadow position={[0, -0.082, 0.082]} scale={[1.2, 0.8, 0.9]}>
          <sphereGeometry args={[0.034, 16, 16]} />
          <meshStandardMaterial color={skinTone} roughness={0.5} />
        </mesh>

        <mesh position={[0, 0.045, -0.025]} rotation={[-0.5, 0, 0]}>
          <sphereGeometry args={[0.118, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.045, 0.005]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <torusGeometry args={[0.112, 0.022, 10, 28]} />
          <meshStandardMaterial color="#c8a15a" roughness={0.65} />
        </mesh>
        {/* ears */}
        <mesh position={[-0.125, -0.01, -0.01]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.6} />
        </mesh>
        <mesh position={[0.125, -0.01, -0.01]}>
          <sphereGeometry args={[0.026, 12, 10]} />
          <meshStandardMaterial color={skinTone} roughness={0.6} />
        </mesh>
        {/* brows */}
        <mesh position={[-0.045, 0.014, 0.108]} rotation={[0, 0, 0.12]}>
          <boxGeometry args={[0.034, 0.009, 0.008]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        <mesh position={[0.045, 0.014, 0.108]} rotation={[0, 0, -0.12]}>
          <boxGeometry args={[0.034, 0.009, 0.008]} />
          <meshStandardMaterial color="#14100c" roughness={0.9} />
        </mesh>
        {/* eyes */}
        <mesh position={[-0.045, -0.01, 0.105]}>
          <sphereGeometry args={[0.014, 10, 10]} />
          <meshStandardMaterial color="#111111" roughness={0.25} />
        </mesh>
        <mesh position={[0.045, -0.01, 0.105]}>
          <sphereGeometry args={[0.014, 10, 10]} />
          <meshStandardMaterial color="#111111" roughness={0.25} />
        </mesh>
        {/* nose */}
        <mesh position={[0, -0.045, 0.115]}>
          <sphereGeometry args={[0.016, 10, 10]} />
          <meshStandardMaterial color={skinDark} roughness={0.6} />
        </mesh>
        {/* mouth */}
        <mesh position={[0, -0.077, 0.102]}>
          <boxGeometry args={[0.036, 0.008, 0.006]} />
          <meshStandardMaterial color={skinDeep} roughness={0.7} />
        </mesh>
      </group>

      {/* ---------- ARMS ---------- */}
      {([-1, 1] as const).map((side) => {
        const isLeft = side < 0;
        return (
          <group key={side}>
            <mesh ref={isLeft ? upperL : upperR} castShadow>
              <capsuleGeometry args={[0.062, 0.176, 6, 14]} />
              <meshStandardMaterial color={shirtColor} roughness={0.6} />
            </mesh>
            <mesh ref={isLeft ? foreL : foreR} castShadow>
              <capsuleGeometry args={[0.052, 0.196, 6, 14]} />
              <meshStandardMaterial color={skinTone} roughness={0.5} />
            </mesh>
            <mesh ref={isLeft ? deltL : deltR} castShadow scale={[1, 1.25, 1]}>
              <sphereGeometry args={[0.082, 18, 14]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? elbowL : elbowR}>
              <sphereGeometry args={[0.052, 14, 12]} />
              <meshStandardMaterial color={skinDark} roughness={0.65} />
            </mesh>
            <mesh ref={isLeft ? bicepL : bicepR}>
              <sphereGeometry args={[0.062, 14, 12]} />
              <meshStandardMaterial color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? wristL : wristR}>
              <sphereGeometry args={[0.046, 12, 10]} />
              <meshStandardMaterial color={skinDark} roughness={0.6} />
            </mesh>
            {/* planted detailed hand (plank) */}
            <group ref={isLeft ? handL : handR}>
              <mesh position={[0, 0.032, 0.35]} castShadow scale={[1.15, 0.55, 1.35]}>
                <sphereGeometry args={[0.05, 14, 12]} />
                <meshStandardMaterial color={skinTone} roughness={0.55} />
              </mesh>
              {[-0.033, -0.011, 0.011, 0.033].map((fx, i) => (
                <mesh key={i} position={[fx, 0.014, 0.435]} rotation={[Math.PI / 2, 0, 0]}>
                  <capsuleGeometry args={[0.011, 0.045, 4, 8]} />
                  <meshStandardMaterial color={skinTone} roughness={0.6} />
                </mesh>
              ))}
              <mesh position={[-side * 0.058, 0.02, 0.36]} rotation={[1.2, 0, -side * 0.6]}>
                <capsuleGeometry args={[0.012, 0.04, 4, 8]} />
                <meshStandardMaterial color={skinTone} roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.012, 0.38]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
                <circleGeometry args={[0.085, 24]} />
                <meshStandardMaterial color="#c6ff2e" transparent opacity={0.18} roughness={0.6} />
              </mesh>
              <mesh position={[0, 0.115, 0.335]}>
                <torusGeometry args={[0.052, 0.014, 8, 18]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} />
              </mesh>
            </group>
            {/* fist (supine) */}
            <group ref={isLeft ? fistL : fistR} visible={false}>
              <mesh castShadow>
                <sphereGeometry args={[0.055, 14, 12]} />
                <meshStandardMaterial color={skinTone} roughness={0.55} />
              </mesh>
              <mesh position={[isLeft ? 0.045 : -0.045, 0.01, 0.02]} rotation={[0, 0, isLeft ? -0.6 : 0.6]}>
                <capsuleGeometry args={[0.015, 0.035, 4, 8]} />
                <meshStandardMaterial color={skinTone} roughness={0.6} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* billboarded workout data tags — always face the camera */}
      {showAngles && <WorkoutTags />}
      <group ref={labelL} />
      <group ref={labelR} />

      {/* ---------- LEGS ---------- */}
      {([-1, 1] as const).map((side) => {
        const isLeft = side < 0;
        return (
          <group key={`leg-${side}`}>
            <mesh ref={isLeft ? thighL : thighR} castShadow>
              <capsuleGeometry args={[0.085, 0.28, 6, 14]} />
              <meshStandardMaterial color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? shinL : shinR} castShadow>
              <capsuleGeometry args={[0.06, 0.32, 6, 14]} />
              <meshStandardMaterial color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? kneeL : kneeR}>
              <sphereGeometry args={[0.068, 16, 12]} />
              <meshStandardMaterial color={skinDark} roughness={0.65} />
            </mesh>
            <mesh ref={isLeft ? patellaL : patellaR}>
              <sphereGeometry args={[0.032, 12, 10]} />
              <meshStandardMaterial color={skinTone} roughness={0.5} />
            </mesh>
            <mesh ref={isLeft ? quadL : quadR} scale={[0.95, 1.35, 0.95]}>
              <sphereGeometry args={[0.072, 14, 12]} />
              <meshStandardMaterial color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? calfL : calfR} scale={[0.9, 1.3, 0.9]}>
              <sphereGeometry args={[0.06, 14, 12]} />
              <meshStandardMaterial color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={isLeft ? ankleL : ankleR}>
              <sphereGeometry args={[0.048, 12, 10]} />
              <meshStandardMaterial color={skinDark} roughness={0.6} />
            </mesh>
            <mesh ref={isLeft ? shortL : shortR} castShadow scale={[1.15, 1.4, 1.15]}>
              <sphereGeometry args={[0.098, 16, 12]} />
              <meshStandardMaterial color={shortsColor} roughness={0.65} />
            </mesh>
            <mesh ref={isLeft ? sockL : sockR} castShadow>
              <capsuleGeometry args={[0.055, 0.07, 6, 12]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.6} />
            </mesh>
            {/* shoe — toes point along local +Z (see orientFoot) */}
            <group ref={isLeft ? shoeL : shoeR}>
              <mesh castShadow>
                <boxGeometry args={[0.11, 0.095, 0.27]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.45} />
              </mesh>
              <mesh position={[0, -0.052, 0.005]}>
                <boxGeometry args={[0.115, 0.028, 0.28]} />
                <meshStandardMaterial color="#ff4d2e" roughness={0.5} />
              </mesh>
              <mesh position={[0, -0.025, 0.12]}>
                <boxGeometry args={[0.1, 0.07, 0.1]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
              </mesh>
              {[0.01, 0.045, 0.08].map((lz, i) => (
                <mesh key={i} position={[0, 0.048, lz]}>
                  <boxGeometry args={[0.07, 0.008, 0.016]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.6} />
                </mesh>
              ))}
              <mesh position={[0, 0.055, -0.13]}>
                <boxGeometry args={[0.04, 0.03, 0.012]} />
                <meshStandardMaterial color="#d4ff3f" roughness={0.5} />
              </mesh>
            </group>
          </group>
        );
      })}

      {/* chest glow + trail */}
      <group ref={trailAnchor}>
        <mesh ref={chestGlow} visible={false}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#c8a15a" transparent opacity={0.3} />
        </mesh>
        {showTrail && (
          <Trail width={1.5} length={2.6} color="#8a8f98" attenuation={(t) => t * t}>
            <mesh visible={false}>
              <sphereGeometry args={[0.01, 6, 6]} />
            </mesh>
          </Trail>
        )}
      </group>

      <mesh ref={floorTarget} visible={false} position={[0, 0.008, 0.3]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.2, 32]} />
        <meshBasicMaterial color="#c8a15a" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/* ============================================================
   BILLBOARDED WORKOUT TAGS

   Clean, large, always camera-facing labels floating beside the
   athlete. They replace the old unreadable angle pills with data
   that actually means something during a set.
   ============================================================ */
function WorkoutTags() {
  return null;
}

