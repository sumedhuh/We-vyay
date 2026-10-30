"use client";

import React from "react";
import { motion } from "framer-motion";

export type FlameVariant = "pink" | "orange" | "magenta" | "red" | "purple" | "cyan";

interface KawaiiFlameProps {
  className?: string;
  size?: number;
  variant?: FlameVariant;
}

const FLAME_VARIANTS: Record<FlameVariant, { stops: { offset: string; color: string }[]; innerStops: { offset: string; color: string }[] }> = {
  pink: {
    stops: [
      { offset: "0%", color: "#ff007f" },
      { offset: "50%", color: "#ffb732" },
      { offset: "100%", color: "#fff099" },
    ],
    innerStops: [
      { offset: "0%", color: "#ffb732" },
      { offset: "100%", color: "#ffffff" },
    ]
  },
  orange: {
    stops: [
      { offset: "0%", color: "#ff004c" },
      { offset: "50%", color: "#ff6a00" },
      { offset: "100%", color: "#ffff99" },
    ],
    innerStops: [
      { offset: "0%", color: "#ff6a00" },
      { offset: "100%", color: "#ffffff" },
    ]
  },
  magenta: {
    stops: [
      { offset: "0%", color: "#cc00ff" },
      { offset: "50%", color: "#ffaa00" },
      { offset: "100%", color: "#ffffaa" },
    ],
    innerStops: [
      { offset: "0%", color: "#ffaa00" },
      { offset: "100%", color: "#ffffff" },
    ]
  },
  red: {
    stops: [
      { offset: "0%", color: "#ff0055" },
      { offset: "50%", color: "#ff6600" },
      { offset: "100%", color: "#ffeb66" },
    ],
    innerStops: [
      { offset: "0%", color: "#ff6600" },
      { offset: "100%", color: "#ffffff" },
    ]
  },
  purple: {
    stops: [
      { offset: "0%", color: "#aa00ff" },
      { offset: "50%", color: "#0088ff" },
      { offset: "100%", color: "#ccffff" },
    ],
    innerStops: [
      { offset: "0%", color: "#0088ff" },
      { offset: "100%", color: "#ffffff" },
    ]
  },
  cyan: {
    stops: [
      { offset: "0%", color: "#00eeff" },
      { offset: "50%", color: "#00ccaa" },
      { offset: "100%", color: "#ccffdd" },
    ],
    innerStops: [
      { offset: "0%", color: "#00ccaa" },
      { offset: "100%", color: "#ffffff" },
    ]
  }
};

export function KawaiiFlame({ className = "", size = 28, variant = "orange" }: KawaiiFlameProps) {
  const currentVariant = FLAME_VARIANTS[variant] || FLAME_VARIANTS.orange;
  const uniqueId = React.useId().replace(/:/g, "");

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Outer Glow */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.7, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute inset-0 rounded-full blur-lg pointer-events-none"
        style={{
           background: `radial-gradient(circle, ${currentVariant.stops[1].color} 0%, transparent 60%)`
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 100 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        animate={{
          y: [0, -2, 0],
          rotate: [-1, 1, -1],
          scale: [0.98, 1.02, 0.98],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative z-10 drop-shadow-xl"
      >
        <defs>
          <linearGradient id={`flameGrad-${uniqueId}`} x1="50" y1="5" x2="50" y2="115" gradientUnits="userSpaceOnUse">
            {currentVariant.stops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>

          <linearGradient id={`innerGrad-${uniqueId}`} x1="50" y1="55" x2="50" y2="115" gradientUnits="userSpaceOnUse">
            {currentVariant.innerStops.map((stop, i) => (
              <stop key={i} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
          
          <filter id={`glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
             <feGaussianBlur stdDeviation="3" result="blur" />
             <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Thick Dark Outline */}
        <path
          d="M55 5 C 55 5 85 35 85 70 C 85 95 70 115 50 115 C 30 115 15 95 15 70 C 15 50 25 35 35 25 C 32 38 35 50 42 58 C 45 40 55 5 55 5 Z"
          fill="#111111"
          stroke="#111111"
          strokeWidth="12"
          strokeLinejoin="round"
        />

        {/* Main Flame Body */}
        <path
          d="M55 5 C 55 5 85 35 85 70 C 85 95 70 115 50 115 C 30 115 15 95 15 70 C 15 50 25 35 35 25 C 32 38 35 50 42 58 C 45 40 55 5 55 5 Z"
          fill={`url(#flameGrad-${uniqueId})`}
        />

        {/* Inner Flame Detailing (the core) */}
        <path
          d="M50 55 C 50 55 70 70 70 95 C 70 108 58 115 50 115 C 42 115 30 108 30 95 C 30 70 50 55 50 55 Z"
          fill={`url(#innerGrad-${uniqueId})`}
          opacity="0.8"
        />
        
        {/* The 3-pointed inner spark/crown */}
        <path
          d="M36 86 L 40 74 L 46 82 L 50 70 L 54 82 L 60 74 L 64 86 C 58 96 42 96 36 86 Z"
          fill="#ffffff"
          opacity="0.9"
          filter={`url(#glow-${uniqueId})`}
        />
        <path
          d="M36 86 L 40 74 L 46 82 L 50 70 L 54 82 L 60 74 L 64 86 C 58 96 42 96 36 86 Z"
          fill="#ffffff"
        />
        
      </motion.svg>
    </div>
  );
}
