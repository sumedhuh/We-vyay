"use client";

import React from "react";

type IconProps = {
  className?: string;
  size?: number;
};

/**
 * Detailed anatomical human-figure outline SVG icons for every exercise.
 * Stroke-only, no fill — just clean outlines showing the exercise pose.
 */

/* ─── LOWER BODY ─────────────────────────────── */

function SquatIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* head */}
      <circle cx="24" cy="6" r="4" />
      {/* torso leaning forward slightly */}
      <path d="M24 10 L22 22" />
      {/* arms clasped in front */}
      <path d="M22 14 L18 18 L20 22" />
      <path d="M22 14 L26 18 L24 22" />
      {/* hips */}
      <path d="M22 22 L16 24" />
      <path d="M22 22 L28 24" />
      {/* left leg bent (squat position) */}
      <path d="M16 24 L12 32 L16 38" />
      {/* right leg bent (squat position) */}
      <path d="M28 24 L32 32 L28 38" />
      {/* feet */}
      <path d="M16 38 L13 40" />
      <path d="M28 38 L31 40" />
    </svg>
  );
}

function LungeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="6" r="4" />
      {/* upright torso */}
      <path d="M20 10 L20 22" />
      {/* arms at sides */}
      <path d="M20 14 L16 20" />
      <path d="M20 14 L24 20" />
      {/* hips */}
      <path d="M20 22 L14 24" />
      <path d="M20 22 L26 24" />
      {/* front leg bent 90° */}
      <path d="M14 24 L12 32 L16 38" />
      {/* back leg extended behind */}
      <path d="M26 24 L34 30 L38 38" />
      {/* feet */}
      <path d="M16 38 L14 40" />
      <path d="M38 38 L40 40" />
    </svg>
  );
}

function CalfRaiseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 22" />
      <path d="M24 14 L20 18" />
      <path d="M24 14 L28 18" />
      <path d="M24 22 L21 24" />
      <path d="M24 22 L27 24" />
      {/* straight legs */}
      <path d="M21 24 L21 36" />
      <path d="M27 24 L27 36" />
      {/* feet on toes (raised heels) */}
      <path d="M21 36 L20 38" />
      <path d="M27 36 L28 38" />
      {/* tiptoe indicator */}
      <circle cx="20" cy="39" r="1" fill="currentColor" />
      <circle cx="28" cy="39" r="1" fill="currentColor" />
    </svg>
  );
}

function LegPressIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* seated on machine — reclined torso */}
      <circle cx="12" cy="14" r="4" />
      <path d="M12 18 L16 28" />
      {/* arms holding grips */}
      <path d="M13 20 L10 24" />
      <path d="M14 22 L12 26" />
      {/* hips */}
      <path d="M16 28 L20 30" />
      {/* legs pushing platform */}
      <path d="M20 30 L30 26 L38 20" />
      <path d="M20 30 L30 34 L38 28" />
      {/* platform */}
      <line x1="38" y1="16" x2="38" y2="32" />
      {/* seat back */}
      <path d="M8 12 L8 30" />
    </svg>
  );
}

function HipThrustIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* back against bench */}
      <rect x="6" y="22" width="8" height="12" rx="2" />
      <circle cx="14" cy="20" r="4" />
      {/* torso bridged up */}
      <path d="M14 24 L24 18" />
      {/* hips raised */}
      <path d="M24 18 L30 20" />
      {/* legs bent, feet on ground */}
      <path d="M30 20 L34 28 L30 36" />
      <path d="M30 20 L36 28 L32 36" />
      {/* barbell across hips */}
      <line x1="20" y1="16" x2="28" y2="16" strokeWidth="2.5" />
      <circle cx="19" cy="16" r="2" />
      <circle cx="29" cy="16" r="2" />
    </svg>
  );
}

function BoxJumpIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* box */}
      <rect x="22" y="30" width="18" height="12" rx="2" />
      {/* figure mid-jump */}
      <circle cx="18" cy="6" r="4" />
      <path d="M18 10 L18 20" />
      {/* arms raised */}
      <path d="M18 13 L12 10" />
      <path d="M18 13 L24 10" />
      {/* legs tucked (mid-air) */}
      <path d="M18 20 L14 24 L16 28" />
      <path d="M18 20 L22 24 L20 28" />
    </svg>
  );
}

/* ─── UPPER BODY ─────────────────────────────── */

function PushupIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="22" r="4" />
      {/* body horizontal */}
      <path d="M12 22 L38 22" />
      {/* arms pushing down */}
      <path d="M14 22 L14 32" />
      <path d="M18 22 L18 32" />
      {/* legs extended */}
      <path d="M38 22 L42 26" />
      <path d="M38 22 L42 20" />
      {/* ground line */}
      <line x1="12" y1="34" x2="20" y2="34" strokeDasharray="2 2" opacity="0.4" />
    </svg>
  );
}

function BenchPressIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* bench */}
      <rect x="8" y="28" width="32" height="4" rx="1.5" />
      <line x1="12" y1="32" x2="12" y2="40" />
      <line x1="36" y1="32" x2="36" y2="40" />
      {/* person lying */}
      <circle cx="14" cy="24" r="4" />
      <path d="M18 24 L36 24" />
      {/* arms pressing barbell up */}
      <path d="M22 24 L22 12" />
      <path d="M30 24 L30 12" />
      {/* barbell */}
      <line x1="16" y1="12" x2="36" y2="12" strokeWidth="2.2" />
      <circle cx="15" cy="12" r="2.5" />
      <circle cx="37" cy="12" r="2.5" />
    </svg>
  );
}

function DumbbellPressIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 24" />
      {/* arms pressing overhead */}
      <path d="M24 14 L16 8 L14 4" />
      <path d="M24 14 L32 8 L34 4" />
      {/* dumbbells */}
      <line x1="12" y1="3" x2="16" y2="5" strokeWidth="2.5" />
      <line x1="32" y1="3" x2="36" y2="5" strokeWidth="2.5" />
      {/* legs */}
      <path d="M24 24 L20 36 L18 42" />
      <path d="M24 24 L28 36 L30 42" />
    </svg>
  );
}

function ShoulderPressIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="8" r="4" />
      <path d="M24 12 L24 26" />
      {/* arms pressing up from shoulders */}
      <path d="M24 15 L18 12 L16 6" />
      <path d="M24 15 L30 12 L32 6" />
      {/* weights at top */}
      <rect x="14" y="3" width="4" height="4" rx="1" />
      <rect x="30" y="3" width="4" height="4" rx="1" />
      {/* legs seated */}
      <path d="M24 26 L20 34 L18 38" />
      <path d="M24 26 L28 34 L30 38" />
    </svg>
  );
}

function PullUpIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* bar */}
      <line x1="8" y1="6" x2="40" y2="6" strokeWidth="2.2" />
      {/* hands on bar */}
      <circle cx="18" cy="6" r="1.5" fill="currentColor" />
      <circle cx="30" cy="6" r="1.5" fill="currentColor" />
      {/* head */}
      <circle cx="24" cy="12" r="4" />
      {/* arms reaching up to bar */}
      <path d="M18 6 L20 12" />
      <path d="M30 6 L28 12" />
      {/* torso */}
      <path d="M24 16 L24 30" />
      {/* legs hanging */}
      <path d="M24 30 L22 40" />
      <path d="M24 30 L26 40" />
    </svg>
  );
}

function BicepCurlIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 26" />
      {/* right arm curling up */}
      <path d="M24 14 L30 18 L28 12" />
      {/* dumbbell */}
      <line x1="26" y1="10" x2="30" y2="14" strokeWidth="2.5" />
      {/* left arm down */}
      <path d="M24 14 L18 22" />
      <line x1="16" y1="21" x2="20" y2="23" strokeWidth="2.5" />
      {/* legs */}
      <path d="M24 26 L21 38 L19 42" />
      <path d="M24 26 L27 38 L29 42" />
    </svg>
  );
}

function TricepDipIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* parallel bars */}
      <line x1="14" y1="14" x2="14" y2="40" />
      <line x1="34" y1="14" x2="34" y2="40" />
      <line x1="10" y1="14" x2="18" y2="14" strokeWidth="2.2" />
      <line x1="30" y1="14" x2="38" y2="14" strokeWidth="2.2" />
      {/* head */}
      <circle cx="24" cy="10" r="4" />
      {/* arms locked on bars */}
      <path d="M24 14 L18 14" />
      <path d="M24 14 L30 14" />
      {/* torso hanging */}
      <path d="M24 14 L24 28" />
      {/* legs slightly forward */}
      <path d="M24 28 L22 38" />
      <path d="M24 28 L26 38" />
    </svg>
  );
}

function LatPulldownIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* cable bar at top */}
      <line x1="10" y1="4" x2="38" y2="4" strokeWidth="2.2" />
      {/* cable */}
      <path d="M24 4 L24 8" strokeDasharray="2 2" />
      {/* wide bar */}
      <line x1="14" y1="8" x2="34" y2="8" strokeWidth="2" />
      <circle cx="24" cy="14" r="4" />
      {/* arms pulling bar down */}
      <path d="M14 8 L20 14" />
      <path d="M34 8 L28 14" />
      {/* torso */}
      <path d="M24 18 L24 30" />
      {/* seated legs */}
      <path d="M24 30 L20 38" />
      <path d="M24 30 L28 38" />
      {/* seat */}
      <rect x="18" y="32" width="12" height="3" rx="1" />
    </svg>
  );
}

function CableRowIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* machine / cable anchor */}
      <rect x="4" y="12" width="4" height="24" rx="1" />
      {/* cable */}
      <path d="M8 24 L18 24" strokeDasharray="2 2" />
      {/* seated person */}
      <circle cx="28" cy="14" r="4" />
      {/* torso leaning slightly */}
      <path d="M28 18 L26 30" />
      {/* arms pulling cable */}
      <path d="M28 20 L22 22 L18 24" />
      <path d="M28 22 L22 24 L18 24" />
      {/* legs extended toward machine */}
      <path d="M26 30 L18 34" />
      <path d="M26 30 L18 38" />
      {/* feet on foot plate */}
      <line x1="14" y1="32" x2="14" y2="40" />
    </svg>
  );
}

function DeadliftIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      {/* torso hinged forward */}
      <path d="M24 10 L22 22" />
      {/* arms hanging down holding bar */}
      <path d="M22 14 L20 26" />
      <path d="M24 14 L24 26" />
      {/* barbell at hip level */}
      <line x1="14" y1="26" x2="30" y2="26" strokeWidth="2.2" />
      <circle cx="13" cy="26" r="2.5" />
      <circle cx="31" cy="26" r="2.5" />
      {/* legs slightly bent */}
      <path d="M22 22 L18 32 L18 42" />
      <path d="M22 22 L26 32 L26 42" />
    </svg>
  );
}

function RomanianDeadliftIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="8" r="4" />
      {/* torso hinged deeply forward (almost horizontal) */}
      <path d="M18 12 L30 16" />
      {/* arms hanging down */}
      <path d="M24 14 L24 28" />
      <path d="M26 14 L26 28" />
      {/* barbell */}
      <line x1="20" y1="28" x2="30" y2="28" strokeWidth="2.2" />
      <circle cx="19" cy="28" r="2" />
      <circle cx="31" cy="28" r="2" />
      {/* straight legs */}
      <path d="M18 16 L16 28 L14 40" />
      <path d="M18 16 L20 28 L20 40" />
    </svg>
  );
}

/* ─── CORE / PLANK ───────────────────────────── */

function PlankIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="8" cy="22" r="3.5" />
      {/* body in straight line */}
      <path d="M11 24 L40 24" />
      {/* forearms on ground */}
      <path d="M14 24 L12 30" />
      <path d="M18 24 L16 30" />
      {/* toes */}
      <path d="M40 24 L42 28" />
      {/* ground reference */}
      <line x1="10" y1="32" x2="44" y2="32" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

function SidePlankIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="8" r="4" />
      {/* torso diagonal */}
      <path d="M18 12 L26 30" />
      {/* top arm reaching up */}
      <path d="M20 16 L14 8" />
      {/* bottom arm supporting */}
      <path d="M24 26 L30 34" />
      {/* legs stacked */}
      <path d="M26 30 L32 38" />
      <path d="M26 30 L34 36" />
      {/* ground */}
      <line x1="28" y1="40" x2="38" y2="40" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

function BurpeeIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* figure mid-jump, arms up */}
      <circle cx="24" cy="6" r="4" />
      {/* arms raised */}
      <path d="M24 10 L18 4" />
      <path d="M24 10 L30 4" />
      {/* torso */}
      <path d="M24 10 L24 22" />
      {/* legs slightly spread in jump */}
      <path d="M24 22 L20 32 L18 36" />
      <path d="M24 22 L28 32 L30 36" />
      {/* motion lines */}
      <line x1="14" y1="38" x2="14" y2="42" opacity="0.3" />
      <line x1="34" y1="38" x2="34" y2="42" opacity="0.3" />
      <line x1="24" y1="38" x2="24" y2="42" opacity="0.3" />
    </svg>
  );
}

/* ─── CLIMBING / CARDIO ──────────────────────── */

function ClimberIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="12" r="4" />
      {/* body in push-up position */}
      <path d="M18 14 L36 18" />
      {/* arms */}
      <path d="M20 14 L18 24" />
      <path d="M22 15 L20 24" />
      {/* one knee driven forward */}
      <path d="M30 17 L24 24 L26 28" />
      {/* other leg extended back */}
      <path d="M36 18 L42 24" />
    </svg>
  );
}

function KettlebellSwingIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 24" />
      {/* arms swinging up with kettlebell */}
      <path d="M24 14 L18 8" />
      <path d="M24 14 L16 10" />
      {/* kettlebell at top */}
      <circle cx="16" cy="6" r="3" />
      <line x1="15" y1="3.5" x2="17" y2="3.5" strokeWidth="1.5" />
      {/* legs in athletic stance */}
      <path d="M24 24 L20 34 L18 42" />
      <path d="M24 24 L28 34 L30 42" />
    </svg>
  );
}

function DanceIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 24" />
      {/* arms in dance pose */}
      <path d="M24 14 L16 10 L14 14" />
      <path d="M24 14 L32 10 L34 6" />
      {/* legs in dynamic pose */}
      <path d="M24 24 L18 34 L14 40" />
      <path d="M24 24 L32 30 L36 38" />
      {/* motion sparkles */}
      <circle cx="10" cy="12" r="1" fill="currentColor" opacity="0.4" />
      <circle cx="38" cy="8" r="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

/* ─── YOGA / FLEXIBILITY ─────────────────────── */

function YogaFlowIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Warrior II pose */}
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 24" />
      {/* arms extended wide */}
      <path d="M24 16 L10 16" />
      <path d="M24 16 L38 16" />
      {/* front leg bent */}
      <path d="M24 24 L16 30 L12 40" />
      {/* back leg straight */}
      <path d="M24 24 L34 30 L38 40" />
    </svg>
  );
}

function SunSalutationIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="8" r="4" />
      <path d="M24 12 L24 26" />
      {/* arms reaching overhead in prayer */}
      <path d="M24 14 L20 6 L22 2" />
      <path d="M24 14 L28 6 L26 2" />
      {/* palms together */}
      <path d="M22 2 L24 0 L26 2" />
      {/* legs together */}
      <path d="M24 26 L22 38 L22 44" />
      <path d="M24 26 L26 38 L26 44" />
    </svg>
  );
}

function WarriorPoseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 24" />
      {/* arms wide */}
      <path d="M24 15 L8 15" />
      <path d="M24 15 L40 15" />
      {/* front leg bent deeply */}
      <path d="M24 24 L16 28 L12 38" />
      {/* back leg straight */}
      <path d="M24 24 L34 28 L40 38" />
    </svg>
  );
}

function TreePoseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 28" />
      {/* arms overhead in prayer */}
      <path d="M24 14 L22 6" />
      <path d="M24 14 L26 6" />
      <path d="M22 6 L24 2 L26 6" />
      {/* standing leg straight */}
      <path d="M24 28 L24 44" />
      {/* other foot pressed against inner thigh */}
      <path d="M24 28 L30 24 L28 20" />
    </svg>
  );
}

function DownwardDogIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* inverted V shape */}
      {/* head between arms */}
      <circle cx="12" cy="26" r="3.5" />
      {/* arms reaching to ground */}
      <path d="M12 22 L10 34" />
      <path d="M14 22 L12 34" />
      {/* body going up then down */}
      <path d="M12 24 L24 10 L36 24" />
      {/* legs straight to ground */}
      <path d="M36 24 L38 38" />
      <path d="M36 24 L34 38" />
    </svg>
  );
}

function PigeonPoseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="10" r="4" />
      {/* torso upright */}
      <path d="M18 14 L20 26" />
      {/* arms */}
      <path d="M19 18 L14 22" />
      <path d="M19 18 L24 22" />
      {/* front leg folded on ground */}
      <path d="M20 26 L12 30 L8 28" />
      {/* back leg extended behind */}
      <path d="M20 26 L34 28 L42 28" />
      {/* ground */}
      <line x1="6" y1="32" x2="44" y2="32" strokeDasharray="2 2" opacity="0.3" />
    </svg>
  );
}

function CrowPoseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="12" r="4" />
      {/* torso forward, horizontal */}
      <path d="M24 16 L24 26" />
      {/* arms balancing on ground */}
      <path d="M24 20 L18 28 L16 34" />
      <path d="M24 20 L30 28 L32 34" />
      {/* knees resting on triceps, legs tucked */}
      <path d="M24 26 L20 24 L18 26" />
      <path d="M24 26 L28 24 L30 26" />
      {/* feet up behind */}
      <path d="M20 24 L22 20" />
      <path d="M28 24 L26 20" />
    </svg>
  );
}

function BoatPoseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* V-shape body */}
      <circle cx="24" cy="10" r="4" />
      {/* torso leaning back */}
      <path d="M24 14 L28 28" />
      {/* arms extended forward parallel to legs */}
      <path d="M24 18 L16 16" />
      <path d="M24 20 L16 18" />
      {/* legs raised and straight */}
      <path d="M28 28 L18 22" />
      <path d="M28 28 L16 24" />
    </svg>
  );
}

function HandstandIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* inverted figure */}
      {/* hands on ground */}
      <circle cx="22" cy="40" r="1.5" fill="currentColor" />
      <circle cx="30" cy="40" r="1.5" fill="currentColor" />
      {/* arms */}
      <path d="M22 40 L22 32" />
      <path d="M30 40 L30 32" />
      {/* head (at bottom) */}
      <circle cx="26" cy="34" r="4" />
      {/* body going up */}
      <path d="M26 30 L26 14" />
      {/* legs pointing up */}
      <path d="M26 14 L24 4" />
      <path d="M26 14 L28 4" />
    </svg>
  );
}

function PlancheIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* horizontal body floating on hands */}
      <circle cx="14" cy="22" r="4" />
      {/* body straight and horizontal */}
      <path d="M18 22 L42 22" />
      {/* arms supporting under body */}
      <path d="M20 22 L20 32" />
      <path d="M24 22 L24 32" />
      {/* hands */}
      <circle cx="20" cy="33" r="1.5" fill="currentColor" />
      <circle cx="24" cy="33" r="1.5" fill="currentColor" />
      {/* legs extended and slightly up */}
      <path d="M42 22 L44 20" />
    </svg>
  );
}

function CalisthenicsIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* L-sit pose */}
      <circle cx="24" cy="8" r="4" />
      <path d="M24 12 L24 24" />
      {/* arms pushing down on parallel bars */}
      <path d="M24 18 L18 24 L18 30" />
      <path d="M24 18 L30 24 L30 30" />
      {/* bars */}
      <line x1="14" y1="30" x2="22" y2="30" strokeWidth="2" />
      <line x1="26" y1="30" x2="34" y2="30" strokeWidth="2" />
      {/* legs extended forward (L position) */}
      <path d="M24 24 L16 24" />
      <path d="M24 24 L14 26" />
    </svg>
  );
}

/* ─── BALANCE ────────────────────────────────── */

function SingleLegStandIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 26" />
      {/* arms out for balance */}
      <path d="M24 16 L14 14" />
      <path d="M24 16 L34 14" />
      {/* standing leg */}
      <path d="M24 26 L24 44" />
      {/* raised leg */}
      <path d="M24 26 L32 28 L34 24" />
    </svg>
  );
}

function BosuBallSquatIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L22 20" />
      {/* arms forward for balance */}
      <path d="M23 14 L18 16" />
      <path d="M23 14 L28 16" />
      {/* squat position */}
      <path d="M22 20 L18 28 L16 34" />
      <path d="M22 20 L26 28 L28 34" />
      {/* bosu ball */}
      <ellipse cx="22" cy="38" rx="12" ry="4" />
      <path d="M10 38 L10 40 L34 40 L34 38" />
    </svg>
  );
}

function HeelToeWalkIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="6" r="4" />
      <path d="M20 10 L20 24" />
      {/* arms out for balance */}
      <path d="M20 16 L12 14" />
      <path d="M20 16 L28 14" />
      {/* walking legs - one forward, one back */}
      <path d="M20 24 L14 34 L12 40" />
      <path d="M20 24 L28 34 L30 40" />
      {/* line showing straight path */}
      <line x1="10" y1="42" x2="32" y2="42" strokeDasharray="3 2" opacity="0.4" />
    </svg>
  );
}

function PikePushupIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* pike / inverted V position */}
      <circle cx="16" cy="18" r="4" />
      {/* arms going down */}
      <path d="M16 22 L14 32" />
      <path d="M18 22 L16 32" />
      {/* body making V */}
      <path d="M16 18 L28 8" />
      <path d="M28 8 L36 20" />
      {/* legs straight to ground */}
      <path d="M36 20 L38 34" />
      <path d="M36 20 L34 34" />
    </svg>
  );
}

/* ─── GENERIC FALLBACK ───────────────────────── */

function GenericExerciseIcon({ className, size = 24 }: IconProps) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="6" r="4" />
      <path d="M24 10 L24 26" />
      {/* arms in athletic stance */}
      <path d="M24 15 L18 20" />
      <path d="M24 15 L30 20" />
      {/* legs in ready position */}
      <path d="M24 26 L20 38 L18 44" />
      <path d="M24 26 L28 38 L30 44" />
    </svg>
  );
}

/* ─── ICON RESOLVER ──────────────────────────── */

const ICON_MAP: Array<{ keywords: string[]; icon: React.FC<IconProps> }> = [
  // Lower body
  { keywords: ["squat", "bosu ball squat"],         icon: SquatIcon },
  { keywords: ["lunge"],                            icon: LungeIcon },
  { keywords: ["calf raise", "calf"],               icon: CalfRaiseIcon },
  { keywords: ["leg press"],                        icon: LegPressIcon },
  { keywords: ["hip thrust"],                       icon: HipThrustIcon },
  { keywords: ["box jump"],                         icon: BoxJumpIcon },
  { keywords: ["deadlift"],                         icon: DeadliftIcon },
  { keywords: ["romanian", "rdl", "hinge"],         icon: RomanianDeadliftIcon },

  // Upper body
  { keywords: ["push-up", "pushup", "push up"],     icon: PushupIcon },
  { keywords: ["bench press"],                      icon: BenchPressIcon },
  { keywords: ["dumbbell press", "db press"],       icon: DumbbellPressIcon },
  { keywords: ["shoulder press", "overhead press", "ohp"], icon: ShoulderPressIcon },
  { keywords: ["pull-up", "pullup", "pull up", "chin-up", "chinup"], icon: PullUpIcon },
  { keywords: ["bicep curl", "curl"],               icon: BicepCurlIcon },
  { keywords: ["tricep dip", "dip"],                icon: TricepDipIcon },
  { keywords: ["lat pulldown", "pulldown"],         icon: LatPulldownIcon },
  { keywords: ["cable row", "row"],                 icon: CableRowIcon },
  { keywords: ["pike push", "pike"],                icon: PikePushupIcon },

  // Core / Plank
  { keywords: ["side plank"],                       icon: SidePlankIcon },
  { keywords: ["plank"],                            icon: PlankIcon },
  { keywords: ["burpee"],                           icon: BurpeeIcon },

  // Climbing / Cardio
  { keywords: ["climber", "mountain climber"],      icon: ClimberIcon },
  { keywords: ["kb swing", "kettlebell swing", "kettlebell"], icon: KettlebellSwingIcon },
  { keywords: ["dance"],                            icon: DanceIcon },

  // Yoga / Flexibility
  { keywords: ["sun salutation", "surya"],          icon: SunSalutationIcon },
  { keywords: ["warrior"],                          icon: WarriorPoseIcon },
  { keywords: ["tree pose", "tree"],                icon: TreePoseIcon },
  { keywords: ["downward dog", "down dog"],         icon: DownwardDogIcon },
  { keywords: ["pigeon"],                           icon: PigeonPoseIcon },
  { keywords: ["crow pose", "crow"],                icon: CrowPoseIcon },
  { keywords: ["boat pose", "boat"],                icon: BoatPoseIcon },
  { keywords: ["handstand"],                        icon: HandstandIcon },
  { keywords: ["planche"],                          icon: PlancheIcon },
  { keywords: ["calisthenics", "l-sit", "lsit"],    icon: CalisthenicsIcon },
  { keywords: ["yoga"],                             icon: YogaFlowIcon },

  // Balance
  { keywords: ["single leg", "one leg"],            icon: SingleLegStandIcon },
  { keywords: ["bosu ball"],                        icon: BosuBallSquatIcon },
  { keywords: ["heel-to-toe", "heel to toe", "toe walk"], icon: HeelToeWalkIcon },
];

/**
 * Returns the correct human-figure outline icon component for a given exercise name.
 * Falls back to a generic athletic stance icon if no match is found.
 */
export function getExerciseIcon(exerciseName: string): React.FC<IconProps> {
  const lower = exerciseName.toLowerCase();

  // Try longest keyword match first (more specific matches win)
  for (const entry of ICON_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) {
        return entry.icon;
      }
    }
  }

  return GenericExerciseIcon;
}

/**
 * Convenience component that resolves + renders the icon for a given exercise name.
 */
export function ExerciseIcon({
  name,
  className,
  size = 24,
}: {
  name: string;
  className?: string;
  size?: number;
}) {
  const Icon = getExerciseIcon(name);
  return <Icon className={className} size={size} />;
}
