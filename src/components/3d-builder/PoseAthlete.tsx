import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Trail, Billboard } from "@react-three/drei";
import * as THREE from "three";
import { usePushupStore, liveStats } from "./store";
import {
  solvePose, makeSkeleton, stepPlayback, zeroPose, DIM,
  type PlayState, type FaceGuide, type EquipmentType,
} from "./pose";
import { advanceFixedStep, type FixedStepState } from "./poseChannels";
import { applyArmIK } from "./armIK";
import { GymEquipment, DynamicBarbell, Dumbbell, DynamicKettlebell, DynamicBand } from "./GymEquipment";

const UP = new THREE.Vector3(0, 1, 0);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

const tmpDir = new THREE.Vector3();
const tmpMid = new THREE.Vector3();
const kA = new THREE.Vector3();
const kB = new THREE.Vector3();
const kSum = new THREE.Vector3();
const fX = new THREE.Vector3();
const fY = new THREE.Vector3();
const fZ = new THREE.Vector3();
const fUp = new THREE.Vector3();
const fM = new THREE.Matrix4();
const vTmp = new THREE.Vector3();

function orientLimb(mesh: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  tmpDir.subVectors(b, a);
  if (tmpDir.lengthSq() < 1e-9) return;
  tmpDir.normalize();
  tmpMid.addVectors(a, b).multiplyScalar(0.5);
  mesh.position.copy(tmpMid);
  mesh.quaternion.setFromUnitVectors(UP, tmpDir);
}
function orientScaled(mesh: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3, total: number) {
  orientLimb(mesh, a, b);
  mesh.scale.y = THREE.MathUtils.clamp(a.distanceTo(b) / total, 0.7, 1.4);
}
/** kneecap faces away from the inside of the bend */
function kneeOut(H: THREE.Vector3, K: THREE.Vector3, A: THREE.Vector3, fallback: THREE.Vector3, out: THREE.Vector3) {
  kA.subVectors(H, K).normalize();
  kB.subVectors(A, K).normalize();
  kSum.addVectors(kA, kB);
  if (kSum.length() > 0.3) out.copy(kSum).normalize().negate();
  else out.copy(fallback);
}
function orientFoot(group: THREE.Object3D, ankle: THREE.Vector3, dir: THREE.Vector3) {
  fZ.copy(dir).normalize();
  fUp.set(0, 1, 0);
  if (Math.abs(fZ.y) > 0.9) fUp.set(0, 0, 1);
  fX.crossVectors(fUp, fZ);
  if (fX.lengthSq() < 1e-6) fX.set(1, 0, 0);
  fX.normalize();
  fY.crossVectors(fZ, fX).normalize();
  fM.makeBasis(fX, fY, fZ);
  group.quaternion.setFromRotationMatrix(fM);
  group.position.copy(ankle).addScaledVector(fZ, 0.045);
}

export default function PoseAthlete() {
  const skinTone = usePushupStore((s) => s.skinTone);
  const shirtColor = usePushupStore((s) => s.shirtColor);
  const shortsColor = usePushupStore((s) => s.shortsColor);
  const showTrail = usePushupStore((s) => s.showTrail);
  const showAngles = usePushupStore((s) => s.showAngles);
  const workoutEquipment = usePushupStore((s) => s.workout.equipment ?? "none") as EquipmentType;
  const workoutEquipments = usePushupStore((s) => (s.workout as any).equipments as EquipmentType[] | undefined);
  const activeEquipments = useMemo(() => {
    if (workoutEquipments && workoutEquipments.length > 0) return workoutEquipments;
    if (workoutEquipment && workoutEquipment !== "none") return [workoutEquipment];
    return [];
  }, [workoutEquipment, workoutEquipments]);

  const fixedStep = useRef<FixedStepState>({ accumulator: 0 });

  const skinDark = useMemo(() => new THREE.Color(skinTone).multiplyScalar(0.86).getStyle(), [skinTone]);
  const skinDeep = useMemo(() => new THREE.Color(skinTone).multiplyScalar(0.72).getStyle(), [skinTone]);
  const shirtDark = useMemo(() => new THREE.Color(shirtColor).multiplyScalar(0.7).getStyle(), [shirtColor]);

  const sk = useMemo(makeSkeleton, []);
  const pose = useMemo(zeroPose, []);
  const play = useRef<PlayState>({ idx: 0, t: 0, kf: null, pose, loopFrac: 0 });

  // refs
  const chestRef = useRef<THREE.Mesh>(null!);
  const absRef = useRef<THREE.Mesh>(null!);
  const pelvisRef = useRef<THREE.Mesh>(null!);
  const waistbandRef = useRef<THREE.Mesh>(null!);
  const neckRef = useRef<THREE.Mesh>(null!);
  const headGroup = useRef<THREE.Group>(null!);
  const collarRef = useRef<THREE.Mesh>(null!);
  const pecL = useRef<THREE.Mesh>(null!);
  const pecR = useRef<THREE.Mesh>(null!);
  const ab1 = useRef<THREE.Mesh>(null!);
  const ab2 = useRef<THREE.Mesh>(null!);
  const trapL = useRef<THREE.Mesh>(null!);
  const trapR = useRef<THREE.Mesh>(null!);
  const gluteL = useRef<THREE.Mesh>(null!);
  const gluteR = useRef<THREE.Mesh>(null!);

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
  const labelL = useRef<THREE.Group>(null!);
  const labelR = useRef<THREE.Group>(null!);

  const thighL = useRef<THREE.Mesh>(null!);
  const thighR = useRef<THREE.Mesh>(null!);
  const shinL = useRef<THREE.Mesh>(null!);
  const shinR = useRef<THREE.Mesh>(null!);
  const kneeL = useRef<THREE.Mesh>(null!);
  const kneeR = useRef<THREE.Mesh>(null!);
  const patL = useRef<THREE.Mesh>(null!);
  const patR = useRef<THREE.Mesh>(null!);
  const quadL = useRef<THREE.Mesh>(null!);
  const quadR = useRef<THREE.Mesh>(null!);
  const calfL = useRef<THREE.Mesh>(null!);
  const calfR = useRef<THREE.Mesh>(null!);
  const ankL = useRef<THREE.Mesh>(null!);
  const ankR = useRef<THREE.Mesh>(null!);
  const shortL = useRef<THREE.Mesh>(null!);
  const shortR = useRef<THREE.Mesh>(null!);
  const shoeL = useRef<THREE.Group>(null!);
  const shoeR = useRef<THREE.Group>(null!);
  const sockL = useRef<THREE.Mesh>(null!);
  const sockR = useRef<THREE.Mesh>(null!);

  const trailAnchor = useRef<THREE.Group>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const targetRef = useRef<THREE.Mesh>(null!);

  // keep the studio's selected keyframe in sync when not playing
  const selectedKF = usePushupStore((s) => s.selectedKF);
  const kfCount = usePushupStore((s) => s.workout.keyframes.length);
  const workoutMode = usePushupStore((s) => s.workout.mode);
  const faceGuides = usePushupStore((s) => s.workout.guides as FaceGuide[] | undefined);
  const isFaceMode = workoutMode === "face";
  const lastKFSignature = useRef("");

  useFrame((state, rawDelta) => {
    const store = usePushupStore.getState();
    const w = store.workout;
    const speed = store.speed * (store.slowMo ? 0.25 : 1);

    if (store.playing) {
      // Fixed-timestep accumulator — eliminates micro-jitter
      advanceFixedStep(fixedStep.current, rawDelta, (dt) => {
        if (w.keyframes.length > 0) {
          const st = play.current as PlayState & { wrapped?: boolean };
          st.wrapped = false;
          stepPlayback(w, st, dt * speed, pose);
          if (st.wrapped) {
            if (w.loop) store.incrementReps();
            else store.setPlaying(false);
          }
        }
      });
    } else if (w.keyframes.length > 0) {
      // paused: show whichever keyframe is selected in the studio
      const idx = Math.min(selectedKF, w.keyframes.length - 1);
      const sig = `${idx}:${kfCount}`;
      if (sig !== lastKFSignature.current) {
        lastKFSignature.current = sig;
        play.current.t = 0;
        play.current.idx = idx;
      }
      Object.assign(pose, w.keyframes[idx].pose);
    }

    solvePose(pose, sk, w.autoGround);

    // ---- Post-FK IK constraint pass for gym equipment ----
    const eq = w.equipment ?? "none";
    const eqList = (w as any).equipments as EquipmentType[] | undefined;
    if (eq === "pullup_bar" || eqList?.includes("pullup_bar")) {
      // snap wrists to the overhead bar grip points
      const gripL = new THREE.Vector3(-0.3, 2.05, -0.3);
      const gripR = new THREE.Vector3(0.3, 2.05, -0.3);
      applyArmIK(sk, gripL, gripR, DIM.upperArm, DIM.foreArm);
    }

    const effort = sk.effort;

    /* ---- face studio mode: keep the body standing and frame the head ---- */
    if (isFaceMode) {
      // stand the rig upright in place and keep the head dominant in frame
      sk.pelvis.set(0, 0.98, -0.35);
      sk.chest.set(0, 1.38, -0.28);
      sk.headPos.set(0, 1.66, 0.02);
      sk.spineDir.set(0, 1, 0);
      sk.fwd.set(0, 0, 1);
      sk.right.set(1, 0, 0);
      // relaxed arms with hands lifted near the face for massage exercises
      sk.shoulderL.set(-0.19, 1.38, -0.28);
      sk.shoulderR.set(0.19, 1.38, -0.28);
      sk.elbowL.set(-0.28, 1.16, -0.1);
      sk.elbowR.set(0.28, 1.16, -0.1);
      sk.wristL.set(-0.2, 1.3, 0.16);
      sk.wristR.set(0.2, 1.3, 0.16);
      // stable planted legs hidden by the framing
      sk.hipL.set(-0.12, 0.98, -0.35);
      sk.hipR.set(0.12, 0.98, -0.35);
      sk.kneeL.set(-0.12, 0.54, -0.35);
      sk.kneeR.set(0.12, 0.54, -0.35);
      sk.ankleL.set(-0.12, 0.1, -0.33);
      sk.ankleR.set(0.12, 0.1, -0.33);
      sk.toeL.set(-0.12, 0.1, -0.12);
      sk.toeR.set(0.12, 0.1, -0.12);
      sk.footDirL.set(0, 0, 1);
      sk.footDirR.set(0, 0, 1);
      sk.kneeOutL.set(0, 0, 1);
      sk.kneeOutR.set(0, 0, 1);
    }

    /* ---- torso ---- */
    const mid = vTmp.lerpVectors(sk.pelvis, sk.chest, 0.5);
    orientLimb(absRef.current, sk.pelvis, mid);
    orientLimb(chestRef.current, mid, sk.chest);
    pelvisRef.current.position.copy(sk.pelvis);
    pelvisRef.current.quaternion.setFromUnitVectors(UP, sk.spineDir);
    waistbandRef.current.position.copy(sk.pelvis).addScaledVector(sk.spineDir, -0.02);
    waistbandRef.current.quaternion.copy(pelvisRef.current.quaternion);
    collarRef.current.position.copy(sk.chest).addScaledVector(sk.spineDir, 0.02);
    collarRef.current.quaternion.setFromUnitVectors(Z_AXIS, sk.spineDir);
    const flex = 1 + effort * 0.1;
    chestRef.current.scale.set(flex, 1, 1 + effort * 0.05);

    // pecs / abs / glutes on the body surface
    const chestN = kA.copy(sk.chest).lerp(mid, 0.3);
    pecL.current.position.copy(chestN).addScaledVector(sk.fwd, 0.075).addScaledVector(sk.right, -0.075);
    pecR.current.position.copy(chestN).addScaledVector(sk.fwd, 0.075).addScaledVector(sk.right, 0.075);
    const abN = kA.copy(mid).lerp(sk.pelvis, 0.35);
    ab1.current.position.copy(abN).addScaledVector(sk.fwd, 0.075);
    ab2.current.position.copy(abN).lerp(sk.pelvis, 0.45).addScaledVector(sk.fwd, 0.075);
    gluteL.current.position.copy(sk.pelvis).addScaledVector(sk.fwd, -0.06).addScaledVector(sk.right, -0.072);
    gluteR.current.position.copy(sk.pelvis).addScaledVector(sk.fwd, -0.06).addScaledVector(sk.right, 0.072);
    trapL.current.position.copy(sk.chest).addScaledVector(sk.right, -0.1).addScaledVector(sk.fwd, 0.04);
    trapR.current.position.copy(sk.chest).addScaledVector(sk.right, 0.1).addScaledVector(sk.fwd, 0.04);

    /* ---- neck + head ---- */
    const headBase = kA.copy(sk.chest).addScaledVector(sk.spineDir, 0.03);
    orientLimb(neckRef.current, headBase, sk.headPos);
    headGroup.current.position.copy(sk.headPos);
    headGroup.current.quaternion.setFromRotationMatrix(
      fM.makeBasis(sk.right, sk.spineDir, sk.fwd)
    );
    headGroup.current.rotateX((-pose.headNod * 0.55 - 4) * (Math.PI / 180));
    headGroup.current.rotateY((-pose.headTurn * 0.55 * Math.PI) / 180);

    // face expression rig (simple but readable): jaw, lips, cheeks, brows, eye squint
    const faceScale = isFaceMode ? 1.55 : 1;
    headGroup.current.scale.setScalar(faceScale);
    const jaw = pose.jawOpen / 100;
    const purse = pose.lipPurse / 100;
    const suck = pose.cheekSuck / 100;
    const lift = pose.cheekLift / 100;
    const brow = pose.browLift / 100;
    const squint = pose.eyeSquint / 100;
    // use existing facial features already in the head subtree by scaling / rotating the head subtly
    headGroup.current.position.y += lift * 0.02 - suck * 0.01;
    headGroup.current.rotation.x += jaw * 0.18 + purse * 0.03;
    headGroup.current.rotation.z += (brow - squint) * 0.05 + suck * 0.02;

    /* ---- arms ---- */
    for (const side of [-1, 1] as const) {
      const L = side < 0;
      const S = L ? sk.shoulderL : sk.shoulderR;
      const E = L ? sk.elbowL : sk.elbowR;
      const Wr = L ? sk.wristL : sk.wristR;
      const upper = L ? upperL.current : upperR.current;
      const fore = L ? foreL.current : foreR.current;
      const delt = L ? deltL.current : deltR.current;
      const elb = L ? elbowL.current : elbowR.current;
      const bic = L ? bicepL.current : bicepR.current;
      const wri = L ? wristL.current : wristR.current;
      const hand = L ? handL.current : handR.current;
      const lab = L ? labelL.current : labelR.current;

      orientScaled(upper, S, E, DIM.upperArm);
      orientScaled(fore, E, Wr, DIM.foreArm);
      const bulge = 1 + effort * 0.12;
      upper.scale.x = bulge; upper.scale.z = bulge;
      delt.position.copy(S);
      elb.position.copy(E);
      // bicep sits on the front of the upper arm
      kA.subVectors(E, S).normalize();
      kB.crossVectors(kA, sk.right).normalize();
      vTmp.lerpVectors(S, E, 0.4).addScaledVector(kB, 0.022 * side);
      bic.position.copy(vTmp);
      bic.scale.setScalar(1 + effort * 0.25);
      wri.position.copy(Wr);
      // hand aligned with the forearm
      kA.subVectors(Wr, E).normalize();
      hand.position.copy(Wr);
      fUp.copy(sk.fwd);
      if (Math.abs(kA.dot(fUp)) > 0.9) fUp.copy(sk.up);
      fX.crossVectors(fUp, kA);
      if (fX.lengthSq() < 1e-6) fX.set(1, 0, 0);
      fX.normalize();
      fY.crossVectors(kA, fX).normalize();
      fM.makeBasis(fX, fY, kA);
      hand.quaternion.setFromRotationMatrix(fM);
      lab.position.copy(E).addScaledVector(sk.right, side * 0.15).addScaledVector(sk.up, 0.05);
    }

    /* ---- legs ---- */
    for (const side of [-1, 1] as const) {
      const L = side < 0;
      const H = L ? sk.hipL : sk.hipR;
      const K = L ? sk.kneeL : sk.kneeR;
      const A = L ? sk.ankleL : sk.ankleR;
      const T = L ? sk.toeL : sk.toeR;
      const FD = L ? sk.footDirL : sk.footDirR;
      const KO = L ? sk.kneeOutL : sk.kneeOutR;
      const thigh = L ? thighL.current : thighR.current;
      const shin = L ? shinL.current : shinR.current;
      const kn = L ? kneeL.current : kneeR.current;
      const pat = L ? patL.current : patR.current;
      const quad = L ? quadL.current : quadR.current;
      const calf = L ? calfL.current : calfR.current;
      const ank = L ? ankL.current : ankR.current;
      const short = L ? shortL.current : shortR.current;
      const shoe = L ? shoeL.current : shoeR.current;
      const sock = L ? sockL.current : sockR.current;

      orientScaled(thigh, H, K, DIM.thigh);
      orientScaled(shin, K, A, DIM.shin);
      const girth = 1 + (pose[L ? "kneeL" : "kneeR"] / 152) * 0.08;
      thigh.scale.x = girth; thigh.scale.z = girth;
      kn.position.copy(K);

      kneeOut(H, K, A, sk.fwd, KO);
      pat.position.copy(K).addScaledVector(KO, 0.052);

      // quad on the front of the thigh, calf on the back of the shin
      kA.subVectors(K, H).normalize();
      kB.copy(KO).addScaledVector(kA, -KO.dot(kA));
      if (kB.lengthSq() < 0.02) kB.copy(KO);
      kB.normalize();
      vTmp.lerpVectors(H, K, 0.42).addScaledVector(kB, 0.055);
      quad.position.copy(vTmp);
      quad.quaternion.copy(thigh.quaternion);

      kA.subVectors(A, K).normalize();
      kB.copy(KO).negate().addScaledVector(kA, KO.dot(kA));
      if (kB.lengthSq() < 0.02) kB.copy(KO).negate();
      kB.normalize();
      vTmp.lerpVectors(K, A, 0.3).addScaledVector(kB, 0.05);
      calf.position.copy(vTmp);
      calf.quaternion.copy(shin.quaternion);

      vTmp.lerpVectors(H, K, 0.14);
      short.position.copy(vTmp);
      short.quaternion.copy(thigh.quaternion);

      vTmp.lerpVectors(K, A, 0.74);
      orientScaled(sock, vTmp, A, 0.18);
      ank.position.copy(A);
      orientFoot(shoe, A, FD);
      void T;
    }

    /* ---- fx + stats ---- */
    trailAnchor.current.position.copy(sk.chest).addScaledVector(sk.fwd, 0.06);
    glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 6) * 0.08);
    (glowRef.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + effort * 0.5;
    targetRef.current.scale.setScalar(effort > 0.85 ? 1 + Math.sin(state.clock.elapsedTime * 10) * 0.08 : 1);
    (targetRef.current.material as THREE.MeshStandardMaterial).opacity = 0.25 + effort * 0.5;

    const prone = Math.abs(pose.rootSpin) < 90;
    liveStats.mode = prone ? "plank" : "supine";
    liveStats.effort = effort;
    liveStats.plankDepth = prone ? effort : 0;
    liveStats.curl = prone ? 0 : Math.min(1, Math.max(0, pose.spineCurl) / 100);
    liveStats.legRaise = prone ? 0 : Math.min(1, Math.max(pose.legFlexL, pose.legFlexR) / 100);
    liveStats.kneeDrive = prone ? Math.min(1, Math.max(pose.kneeL, pose.kneeR) / 140) : 0;
    liveStats.shoulderHeight = sk.chest.y;
    liveStats.jointLabel = prone ? "ELBOW" : "KNEE";
    liveStats.phase = play.current.kf?.name ?? "pose";
    liveStats.phaseFrac = play.current.loopFrac;
    liveStats.kfName = play.current.kf?.name ?? "";
    liveStats.kfIndex = play.current.idx;
    liveStats.kfTotal = w.keyframes.length;
    // elbow or knee angle readout
    const ja = prone
      ? angleBetween(sk.shoulderL, sk.elbowL, sk.wristL)
      : angleBetween(sk.hipL, sk.kneeL, sk.ankleL);
    liveStats.jointAngle = ja;
  });

  const muscleMat = <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.55} />;

  return (
    <group>
      {/* torso */}
      <mesh ref={chestRef} castShadow>
        <capsuleGeometry args={[0.15, 0.19, 8, 20]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.55} metalness={0.05} />
      </mesh>
      <mesh ref={absRef} castShadow>
        <capsuleGeometry args={[0.122, 0.15, 8, 20]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh ref={pelvisRef} castShadow scale={[1.15, 1.35, 1.05]}>
        <sphereGeometry args={[0.132, 24, 18]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shortsColor} roughness={0.65} />
      </mesh>
      <mesh ref={waistbandRef} scale={[1, 0.35, 1]}>
        <torusGeometry args={[0.128, 0.018, 10, 24]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#3a4150" roughness={0.7} />
      </mesh>
      <mesh ref={collarRef}>
        <torusGeometry args={[0.066, 0.014, 8, 22]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtDark} roughness={0.6} />
      </mesh>
      <mesh ref={neckRef} castShadow>
        <capsuleGeometry args={[0.053, 0.06, 6, 12]} />
        <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} />
      </mesh>

      {/* muscles */}
      <mesh ref={pecL} castShadow><sphereGeometry args={[0.072, 18, 14]} />{muscleMat}</mesh>
      <mesh ref={pecR} castShadow><sphereGeometry args={[0.072, 18, 14]} />{muscleMat}</mesh>
      <mesh ref={ab1}><sphereGeometry args={[0.046, 14, 12]} />{muscleMat}</mesh>
      <mesh ref={ab2}><sphereGeometry args={[0.046, 14, 12]} />{muscleMat}</mesh>
      <mesh ref={trapL}><capsuleGeometry args={[0.042, 0.055, 6, 10]} />{muscleMat}</mesh>
      <mesh ref={trapR}><capsuleGeometry args={[0.042, 0.055, 6, 10]} />{muscleMat}</mesh>
      <mesh ref={gluteL} castShadow scale={[1, 0.9, 0.95]}><sphereGeometry args={[0.083, 18, 14]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shortsColor} roughness={0.65} /></mesh>
      <mesh ref={gluteR} castShadow scale={[1, 0.9, 0.95]}><sphereGeometry args={[0.083, 18, 14]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shortsColor} roughness={0.65} /></mesh>

      {/* head */}
      <group ref={headGroup}>
        {/* Upper skull */}
        <mesh castShadow position={[0, 0.02, -0.01]} scale={[1.08, 1, 1.05]}><sphereGeometry args={[0.112, 28, 22]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.5} /></mesh>
        {/* Wide chiseled jaw */}
        <mesh castShadow position={[0, -0.035, 0.02]} scale={[1.25, 0.9, 1]}><sphereGeometry args={[0.088, 24, 18]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.5} /></mesh>
        {/* Defined chin */}
        <mesh castShadow position={[0, -0.082, 0.082]} scale={[1.2, 0.8, 0.9]}><sphereGeometry args={[0.034, 16, 16]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.5} /></mesh>

        <mesh position={[0, 0.045, -0.025]} rotation={[-0.5, 0, 0]}>
          <sphereGeometry args={[0.116, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#14100c" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.045, 0.005]} rotation={[Math.PI / 2 - 0.25, 0, 0]}>
          <torusGeometry args={[0.11, 0.021, 10, 28]} />
          <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#c8a15a" roughness={0.65} />
        </mesh>
        <mesh position={[-0.125, -0.01, -0.01]}><sphereGeometry args={[0.026, 12, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.6} /></mesh>
        <mesh position={[0.125, -0.01, -0.01]}><sphereGeometry args={[0.026, 12, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.6} /></mesh>
        <mesh position={[-0.045, 0.014, 0.108]} rotation={[0, 0, 0.12]}><boxGeometry args={[0.034, 0.009, 0.008]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#14100c" roughness={0.9} /></mesh>
        <mesh position={[0.045, 0.014, 0.108]} rotation={[0, 0, -0.12]}><boxGeometry args={[0.034, 0.009, 0.008]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#14100c" roughness={0.9} /></mesh>
        <mesh position={[-0.045, -0.01, 0.105]}><sphereGeometry args={[0.014, 10, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#111111" roughness={0.25} /></mesh>
        <mesh position={[0.045, -0.01, 0.105]}><sphereGeometry args={[0.014, 10, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#111111" roughness={0.25} /></mesh>
        <mesh position={[0, -0.045, 0.115]}><sphereGeometry args={[0.016, 10, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDark} roughness={0.6} /></mesh>
        <mesh position={[0, -0.077, 0.102]}><boxGeometry args={[0.036, 0.008, 0.006]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDeep} roughness={0.7} /></mesh>
      </group>

      {/* arms */}
      {([-1, 1] as const).map((side) => {
        const L = side < 0;
        return (
          <group key={side}>
            <mesh ref={L ? upperL : upperR} castShadow>
              <capsuleGeometry args={[0.061, 0.178, 6, 14]} />
              <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.6} />
            </mesh>
            <mesh ref={L ? foreL : foreR} castShadow>
              <capsuleGeometry args={[0.051, 0.188, 6, 14]} />
              <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.5} />
            </mesh>
            <mesh ref={L ? deltL : deltR} castShadow scale={[1, 1.25, 1]}>
              <sphereGeometry args={[0.08, 18, 14]} />
              <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.55} />
            </mesh>
            <mesh ref={L ? elbowL : elbowR}><sphereGeometry args={[0.051, 14, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDark} roughness={0.65} /></mesh>
            <mesh ref={L ? bicepL : bicepR}><sphereGeometry args={[0.06, 14, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shirtColor} roughness={0.55} /></mesh>
            <mesh ref={L ? wristL : wristR}><sphereGeometry args={[0.045, 12, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDark} roughness={0.6} /></mesh>
            {/* hand, aligned with the forearm */}
            <group ref={L ? handL : handR}>
              <mesh position={[0, 0, 0.03]} castShadow scale={[1.15, 0.6, 1.2]}>
                <sphereGeometry args={[0.048, 14, 12]} />
                <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} />
              </mesh>
              {[-0.031, -0.011, 0.011, 0.031].map((fx, i) => (
                <mesh key={i} position={[fx, 0, 0.085]}>
                  <capsuleGeometry args={[0.0105, 0.042, 4, 8]} />
                  <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.6} />
                </mesh>
              ))}
              <mesh position={[side * -0.055, 0, 0.015]} rotation={[0, 0, side * -0.7]}>
                <capsuleGeometry args={[0.0115, 0.038, 4, 8]} />
                <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.6} />
              </mesh>
              {activeEquipments.includes("dumbbells") && <Dumbbell side={side} />}
            </group>
          </group>
        );
      })}

      {showAngles && <PoseWorkoutTags />}
      <group ref={labelL} />
      <group ref={labelR} />
      {isFaceMode && faceGuides && faceGuides.length > 0 && <FaceGuideOverlay guides={faceGuides} />}

      {/* legs */}
      {([-1, 1] as const).map((side) => {
        const L = side < 0;
        return (
          <group key={`leg-${side}`}>
            <mesh ref={L ? thighL : thighR} castShadow>
              <capsuleGeometry args={[0.084, 0.282, 6, 14]} />
              <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={L ? shinL : shinR} castShadow>
              <capsuleGeometry args={[0.059, 0.322, 6, 14]} />
              <meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} />
            </mesh>
            <mesh ref={L ? kneeL : kneeR}><sphereGeometry args={[0.066, 16, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDark} roughness={0.65} /></mesh>
            <mesh ref={L ? patL : patR}><sphereGeometry args={[0.031, 12, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.5} /></mesh>
            <mesh ref={L ? quadL : quadR} scale={[0.95, 1.35, 0.95]}><sphereGeometry args={[0.07, 14, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} /></mesh>
            <mesh ref={L ? calfL : calfR} scale={[0.9, 1.3, 0.9]}><sphereGeometry args={[0.059, 14, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinTone} roughness={0.55} /></mesh>
            <mesh ref={L ? ankL : ankR}><sphereGeometry args={[0.047, 12, 10]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={skinDark} roughness={0.6} /></mesh>
            <mesh ref={L ? shortL : shortR} castShadow scale={[1.15, 1.4, 1.15]}><sphereGeometry args={[0.096, 16, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color={shortsColor} roughness={0.65} /></mesh>
            <mesh ref={L ? sockL : sockR} castShadow><capsuleGeometry args={[0.054, 0.07, 6, 12]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#f8fafc" roughness={0.6} /></mesh>
            <group ref={L ? shoeL : shoeR}>
              <mesh castShadow><boxGeometry args={[0.11, 0.095, 0.27]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#f8fafc" roughness={0.45} /></mesh>
              <mesh position={[0, -0.052, 0.005]}><boxGeometry args={[0.115, 0.028, 0.28]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#ff4d2e" roughness={0.5} /></mesh>
              <mesh position={[0, -0.025, 0.12]}><boxGeometry args={[0.1, 0.07, 0.1]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#e2e8f0" roughness={0.5} /></mesh>
              {[0.01, 0.045, 0.08].map((lz, i) => (
                <mesh key={i} position={[0, 0.048, lz]}><boxGeometry args={[0.07, 0.008, 0.016]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#0f172a" roughness={0.6} /></mesh>
              ))}
              <mesh position={[0, 0.055, -0.13]}><boxGeometry args={[0.04, 0.03, 0.012]} /><meshPhysicalMaterial clearcoat={0.3} clearcoatRoughness={0.4}  color="#d4ff3f" roughness={0.5} /></mesh>
            </group>
          </group>
        );
      })}

      <group ref={trailAnchor}>
        <mesh ref={glowRef} visible={false}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#c8a15a" transparent opacity={0.3} />
        </mesh>
        {showTrail && (
          <Trail width={1.5} length={2.6} color="#8a8f98" attenuation={(t) => t * t}>
            <mesh visible={false}><sphereGeometry args={[0.01, 6, 6]} /></mesh>
          </Trail>
        )}
      </group>

      <mesh ref={targetRef} visible={false} position={[0, 0.008, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.16, 0.2, 32]} />
        <meshBasicMaterial color="#c6ff2e" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>

      {/* Gym Equipment */}
      <GymEquipment equipmentList={activeEquipments} />
      {activeEquipments.includes("barbell") && <DynamicBarbell wristL={sk.wristL} wristR={sk.wristR} />}
      {activeEquipments.includes("kettlebell") && <DynamicKettlebell wristL={sk.wristL} wristR={sk.wristR} />}
      {activeEquipments.includes("band") && <DynamicBand wristL={sk.wristL} wristR={sk.wristR} />}
    </group>
  );
}

function angleBetween(a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) {
  kA.subVectors(a, b).normalize();
  kB.subVectors(c, b).normalize();
  return THREE.MathUtils.radToDeg(Math.acos(THREE.MathUtils.clamp(kA.dot(kB), -1, 1)));
}

/** Billboarded, legible workout tags (mirrors the Athlete version). */
function FaceGuideOverlay({ guides }: { guides: FaceGuide[] }) {
  return (
    <Billboard position={[0, 1.7, 0.18]} follow>
      <Html center distanceFactor={3.6} style={{ pointerEvents: "none" }} zIndexRange={[12, 0]}>
        <div style={{ width: 320, height: 360, position: "relative", pointerEvents: "none" }}>
          <svg viewBox="0 0 100 120" width="320" height="360" style={{ overflow: "visible" }}>
            {/* face frame */}
            <ellipse cx="50" cy="56" rx="32" ry="41" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
            {guides.map((g, i) => {
              const points = g.points.map(([x, y]) => `${x * 100},${y * 120}`).join(" ");
              return (
                <g key={g.id + i}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={g.color}
                    strokeWidth="2.6"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={g.dashed ? "6 4" : undefined}
                    filter="url(#glow)"
                  />
                  <circle cx={g.points[0][0] * 100} cy={g.points[0][1] * 120} r="2.1" fill={g.color} />
                  <text x={g.points[g.points.length - 1][0] * 100 + 3} y={g.points[g.points.length - 1][1] * 120 - 4}
                    fill={g.color} fontSize="5" fontWeight="800" letterSpacing="0.08em">
                    {g.label.toUpperCase()}
                  </text>
                </g>
              );
            })}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="1.2" result="b" />
                <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
          </svg>
        </div>
      </Html>
    </Billboard>
  );
}

function PoseWorkoutTags() {
  const [, setTick] = useState(0);
  const reps = usePushupStore((s) => s.reps);

  useEffect(() => {
    let raf = 0, n = 0;
    const loop = () => {
      if (++n % 10 === 0) setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const angle = Math.round(liveStats.jointAngle);
  const depthOk = liveStats.mode === "plank" ? angle < 100 : angle < 120;
  const target = 15;
  const current = Math.min(target, (reps % target) + 1);

  const tags: { pos: [number, number, number]; label: string; value: string; accent: string }[] = [
    { pos: [-1.5, 1.32, 0.25], label: "REP", value: `${current}/${target}`, accent: "#ffffff" },
    { pos: [1.55, 1.12, 0.1], label: "TEMPO", value: "3-1-3", accent: "#ffffff" },
    {
      pos: [-1.35, 0.62, -1.15],
      label: "FORM CHECK",
      value: depthOk ? "GOOD DEPTH" : "GO LOWER",
      accent: depthOk ? "#5ce08a" : "#ffb648",
    },
  ];

  return (
    <>
      {tags.map((t, i) => (
        <Billboard key={i} position={t.pos} follow>
          <Html center distanceFactor={4.4} style={{ pointerEvents: "none" }} zIndexRange={[10, 0]}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 16px",
                borderRadius: 12,
                background: "rgba(16,17,21,0.92)",
                border: "1px solid rgba(255,255,255,0.16)",
                boxShadow: "0 6px 22px rgba(0,0,0,0.45)",
                whiteSpace: "nowrap",
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.55)" }}>
                {t.label}
              </span>
              <span style={{ fontSize: 22, fontWeight: 800, color: t.accent }}>{t.value}</span>
            </div>
          </Html>
        </Billboard>
      ))}
    </>
  );
}

