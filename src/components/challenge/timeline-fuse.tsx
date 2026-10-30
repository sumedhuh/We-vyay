"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

/**
 * Timeline Fuse — a glowing bar at the top of a card that indicates deadline urgency.
 * Calm pastel → pulsing amber → urgent coral as deadline approaches.
 */
export function TimelineFuse({ deadline }: { deadline: string }) {
  const [urgency, setUrgency] = useState(0); // 0 = calm, 1 = urgent

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const end = new Date(deadline).getTime();
      const total = end - now;

      if (total <= 0) {
        setUrgency(1);
        return;
      }

      // Start pulsing in the last 2 hours
      const twoHours = 2 * 60 * 60 * 1000;
      setUrgency(total < twoHours ? 1 - total / twoHours : 0);
    };

    update();
    const interval = setInterval(update, 30_000);
    return () => clearInterval(interval);
  }, [deadline]);

  // Interpolate colors based on urgency
  const color =
    urgency < 0.33
      ? "#A8E6CF" // calm sage
      : urgency < 0.66
        ? "#FFB347" // amber
        : "#FF6B6B"; // urgent coral

  return (
    <motion.div
      className="absolute top-0 left-0 right-0 h-1 rounded-t-[1.6rem] overflow-hidden"
      style={{ background: `linear-gradient(90deg, ${color}, ${color}80)` }}
      animate={urgency > 0.5 ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
      transition={
        urgency > 0.5
          ? { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
          : {}
      }
    />
  );
}
