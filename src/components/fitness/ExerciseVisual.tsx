"use client";

import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Dumbbell } from "lucide-react";
import type { ExerciseRow } from "@/db/schema";
import { usePublishedAnimationsStore } from "@/stores/published-animations-store";
import { AnimationPlayer } from "@/components/media/animation-player";
import { PresetPreview } from "@/components/studio/studio-modals";
import type { MotionPreset } from "@/stores/studio-store";
import dynamic from "next/dynamic";
import { usePushupStore } from "@/components/3d-builder/store";
import type { PresetId } from "@/components/3d-builder/animations";
import { makeWorkout, SEQUENCES, kf, clonePose, posePreset, P } from "@/components/3d-builder/pose";

const DynamicPushupScene = dynamic(() => import('@/components/3d-builder/PushupScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 flex items-center justify-center text-[var(--text-secondary)]">Loading...</div>
});

const PRESET_KEYS = new Set(["pulse", "wave", "orbit", "pop"]);

/* ─── 3D Setup Helper ──────────────────────── */
function SetupScene({ config }: { config: any }) {
  useEffect(() => {
    const s = usePushupStore.getState();
    s.setShowAngles(false);
    s.setUseCustom(config.presetId === "custom");
    if (config.presetId !== "custom") {
      s.applyPreset(config.presetId as PresetId);
    }
    s.setSkinTone(config.skinTone);
    s.setShirtColor(config.shirtColor);
    s.setShortsColor(config.shortsColor);
    s.setCameraPreset(config.cameraPreset);
    s.setSpeed(config.speed);
    s.setAutoRotate(config.autoRotate);
  }, [config]);

  return null;
}

function SetupBuiltin({ exerciseName }: { exerciseName: string }) {
  useEffect(() => {
    const s = usePushupStore.getState();
    s.setShowAngles(false);
    const exName = exerciseName.toLowerCase().replace(/[^a-z]/g, '');
    
    // Procedural Presets
    if (exName.includes("pushup")) {
      s.setUseCustom(false);
      s.applyPreset("pushup");
    } else if (exName.includes("climber")) {
      s.setUseCustom(false);
      s.applyPreset("climbers");
    } else if (exName.includes("plank")) {
      s.setUseCustom(false);
      s.applyPreset("plank");
    } 
    // Keyframe Sequences
    else {
      s.setUseCustom(true);
      const workout = makeWorkout(exerciseName);
      if (exName.includes("squat")) {
         workout.keyframes = [
            kf("Stand", clonePose(posePreset("stand")!.pose), 0.6, 0.2),
            kf("Squat", clonePose(posePreset("squat")!.pose), 0.8, 0.3)
         ];
      } else if (exName.includes("lunge")) {
         workout.keyframes = [
            kf("Stand", clonePose(posePreset("stand")!.pose), 0.6, 0.2),
            kf("Lunge", clonePose(posePreset("lunge")!.pose), 0.8, 0.3)
         ];
      } else if (exName.includes("advancedyoga")) {
         workout.keyframes = SEQUENCES.find(seq => seq.id === "advancedyoga")!.build();
      } else if (exName.includes("yoga")) {
         workout.keyframes = SEQUENCES.find(seq => seq.id === "sun")!.build();
      } else if (exName.includes("calisthenics") || exName.includes("planche") || exName.includes("lsit")) {
         workout.keyframes = SEQUENCES.find(seq => seq.id === "calisthenics")!.build();
      } else if (exName.includes("handstand")) {
         workout.keyframes = [
            kf("Stand", clonePose(posePreset("stand")!.pose), 0.6, 0.2),
            kf("Handstand", clonePose(posePreset("handstand")!.pose), 1.0, 1.5)
         ];
      } else if (exName.includes("boat")) {
         workout.keyframes = [
            kf("Sit", clonePose(posePreset("supineFlat")!.pose), 0.6, 0.2),
            kf("Boat", clonePose(posePreset("boat")!.pose), 0.8, 1.5)
         ];
      } else if (exName.includes("crow")) {
         workout.keyframes = [
            kf("Squat", clonePose(posePreset("squat")!.pose), 0.6, 0.2),
            kf("Crow Pose", clonePose(posePreset("crow")!.pose), 0.8, 1.5)
         ];
      } else if (exName.includes("kbswing") || exName.includes("romanianhinge")) {
         workout.keyframes = [
            kf("Swing Down", P({ rootY: 0.8, rootPitch: 60, armFlexL: 10, armFlexR: 10, kneeL: 30, kneeR: 30 }), 0.5, 0.1),
            kf("Swing Up", P({ rootY: 0.95, rootPitch: 0, armFlexL: 90, armFlexR: 90, kneeL: 5, kneeR: 5 }), 0.4, 0.1)
         ];
      } else if (exName.includes("burpee")) {
         workout.keyframes = [
            kf("Stand", clonePose(posePreset("stand")!.pose), 0.4, 0.1),
            kf("Squat", clonePose(posePreset("squat")!.pose), 0.4, 0.1),
            kf("Plank", clonePose(posePreset("plankTop")!.pose), 0.4, 0.1),
            kf("Pushup", clonePose(posePreset("plankBottom")!.pose), 0.4, 0.1),
            kf("Plank", clonePose(posePreset("plankTop")!.pose), 0.4, 0.1),
            kf("Squat", clonePose(posePreset("squat")!.pose), 0.4, 0.1),
            kf("Jump", clonePose(posePreset("armsOverhead")!.pose), 0.4, 0.1)
         ];
      } else if (exName.includes("dance")) {
         workout.keyframes = [
            kf("Pose 1", clonePose(posePreset("warrior2")!.pose), 0.5, 0.2),
            kf("Pose 2", clonePose(posePreset("tree")!.pose), 0.5, 0.2),
            kf("Pose 3", clonePose(posePreset("armsOverhead")!.pose), 0.5, 0.2)
         ];
      } else if (exName.includes("dumbbellpress")) {
         workout.keyframes = [
            kf("Press Down", clonePose(posePreset("supineFlat")!.pose), 0.6, 0.2),
            kf("Press Up", P({ rootY: 0.14, rootZ: -0.28, rootPitch: 90, rootSpin: 180, armFlexL: 90, armFlexR: 90, armAbdL: 10, armAbdR: 10 }), 0.6, 0.3)
         ];
      } else {
         workout.keyframes = [
            kf("Stand", clonePose(posePreset("stand")!.pose), 0.6, 0.2),
            kf("Chair", clonePose(posePreset("chair")!.pose), 0.8, 0.3)
         ];
      }
      usePushupStore.setState({ workout, playing: true });
    }
  }, [exerciseName]);

  return null;
}

export function ExerciseVisual({
  exercise,
  isActive,
}: {
  exercise: ExerciseRow;
  isActive: boolean;
}) {
  useEffect(() => {
    usePushupStore.setState({ playing: isActive });
  }, [isActive]);

  const getAnim = usePublishedAnimationsStore((s) => s.getAnimationForExercise);
  const publishedAnim = getAnim(exercise.name);

  // Check if exercise has a custom uploaded animation
  if (exercise.animationId && exercise.animationKind) {
    return (
      <AnimationPlayer
        id={exercise.animationId}
        kind={exercise.animationKind}
        name={exercise.animationName ?? exercise.name}
        className="size-full object-cover"
      />
    );
  }

  // Check if exercise has a built-in preset animation
  if (exercise.animation && PRESET_KEYS.has(exercise.animation)) {
    return (
      <div className="flex size-full items-center justify-center bg-gradient-to-br from-[#1a1a2e] to-[#16213e]">
        <span className="scale-[4] opacity-80">
          <PresetPreview preset={exercise.animation as MotionPreset} />
        </span>
      </div>
    );
  }

  if (publishedAnim) {
    const cfg = publishedAnim.sceneConfig;
    return (
      <div className="relative size-full overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#111133] to-[#0d0d2b]">
        {/* On mount, apply the published config to the global store so the 3D scene renders it accurately */}
        <SetupScene config={cfg} />
        <DynamicPushupScene />
      </div>
    );
  }

  // Check if it's a built-in pre-made 3D template (e.g., Push-ups, Squats, etc)
  const exName = exercise.name.toLowerCase().replace(/[^a-z]/g, '');
  const isBuiltIn = [
    "pushup", "squat", "climber", "yoga", "kbswing", "lunge", 
    "plank", "dumbbellpress", "burpee", "romanianhinge", "dance",
    "calisthenics", "boat", "crow", "planche", "handstand", "lsit"
  ].some(term => exName.includes(term));

  if (isBuiltIn) {
    return (
      <div className="relative size-full overflow-hidden bg-transparent">
        <SetupBuiltin exerciseName={exercise.name} />
        <DynamicPushupScene />
      </div>
    );
  }

  // Fallback placeholder if no custom animation is bound
  return (
    <div className="relative flex size-full items-center justify-center overflow-hidden bg-[var(--surface-2)]">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          className="absolute size-48 rounded-full border border-slate-300"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute size-72 rounded-full border border-slate-200"
          style={{ transform: "rotateX(60deg)" }}
        />
      </div>

      <motion.div
        animate={isActive ? { y: [0, -8, 0] } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
        className="relative z-10 flex flex-col items-center gap-3 pointer-events-none"
      >
        <div className="flex size-24 items-center justify-center rounded-3xl bg-white border border-slate-200 shadow-xl">
          <Dumbbell className="size-12 text-slate-400" />
        </div>
        <p className="text-[11px] font-bold text-slate-400">Exercise View</p>
      </motion.div>
    </div>
  );
}
