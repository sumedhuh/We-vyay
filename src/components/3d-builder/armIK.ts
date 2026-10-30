import * as THREE from "three";
import type { Skeleton } from "./pose";

/* ================================================================== */
/*  2-Bone Analytic IK  (shoulder → elbow → wrist)                     */
/*                                                                     */
/*  Given a fixed shoulder position and a target wrist position,       */
/*  solve the elbow location so that the arm chain reaches the         */
/*  target exactly (if reachable) or stretches toward it.              */
/* ================================================================== */

const _dir = new THREE.Vector3();
const _perp = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

/**
 * Solve a 2-bone IK chain in world space.
 *
 * @param shoulder - fixed root of the chain (world)
 * @param target   - desired wrist position (world)
 * @param upperLen - length of upper arm
 * @param lowerLen - length of forearm
 * @param poleHint - direction that the elbow should "bulge" toward
 * @param outElbow - result: solved elbow position
 * @param outWrist - result: solved wrist position (may differ from target if unreachable)
 */
export function solveTwoBoneIK(
  shoulder: THREE.Vector3,
  target: THREE.Vector3,
  upperLen: number,
  lowerLen: number,
  poleHint: THREE.Vector3,
  outElbow: THREE.Vector3,
  outWrist: THREE.Vector3,
): void {
  _dir.subVectors(target, shoulder);
  let dist = _dir.length();
  const totalLen = upperLen + lowerLen;

  // clamp to reachable range
  if (dist > totalLen - 0.001) {
    dist = totalLen - 0.001;
  }
  const minDist = Math.abs(upperLen - lowerLen) + 0.001;
  if (dist < minDist) {
    dist = minDist;
  }

  _dir.normalize();

  // law of cosines: angle at shoulder
  const cosA = (upperLen * upperLen + dist * dist - lowerLen * lowerLen) / (2 * upperLen * dist);
  const clampedCosA = THREE.MathUtils.clamp(cosA, -1, 1);
  const angleA = Math.acos(clampedCosA);

  // perpendicular direction in the plane defined by the pole hint
  _perp.copy(poleHint).addScaledVector(_dir, -poleHint.dot(_dir));
  if (_perp.lengthSq() < 1e-6) {
    // fallback: use world up
    _perp.copy(_up).addScaledVector(_dir, -_up.dot(_dir));
    if (_perp.lengthSq() < 1e-6) {
      _perp.set(1, 0, 0); // absolute fallback
    }
  }
  _perp.normalize();

  // elbow = shoulder + upperLen * (dir * cos(A) + perp * sin(A))
  const sinA = Math.sin(angleA);
  outElbow.copy(shoulder)
    .addScaledVector(_dir, upperLen * clampedCosA)
    .addScaledVector(_perp, upperLen * sinA);

  // wrist = shoulder + dist * dir  (clamped to reachable)
  outWrist.copy(shoulder).addScaledVector(_dir, dist);
}

/* ================================================================== */
/*  Apply arm IK constraints to a solved skeleton                      */
/*                                                                     */
/*  After solvePose() runs FK, call this to snap the wrists            */
/*  to equipment grip points. The skeleton vectors are mutated         */
/*  in-place so PoseAthlete renders the corrected positions.           */
/* ================================================================== */

const _poleL = new THREE.Vector3();
const _poleR = new THREE.Vector3();

/**
 * For each arm, if a grip target is provided, re-solve shoulder→elbow→wrist
 * so the wrist lands exactly on the grip point.
 */
export function applyArmIK(
  sk: Skeleton,
  gripTargetL?: THREE.Vector3 | null,
  gripTargetR?: THREE.Vector3 | null,
  upperArmLen = 0.3,
  foreArmLen = 0.29,
): void {
  if (gripTargetL) {
    // pole hint: elbow should point backward (away from fwd)
    _poleL.copy(sk.fwd).negate().addScaledVector(sk.up, -0.3).normalize();
    solveTwoBoneIK(sk.shoulderL, gripTargetL, upperArmLen, foreArmLen, _poleL, sk.elbowL, sk.wristL);
  }

  if (gripTargetR) {
    _poleR.copy(sk.fwd).negate().addScaledVector(sk.up, -0.3).normalize();
    solveTwoBoneIK(sk.shoulderR, gripTargetR, upperArmLen, foreArmLen, _poleR, sk.elbowR, sk.wristR);
  }
}
