"use client";

import { memo, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, MoonStar } from "lucide-react";
import { haptic } from "@/lib/haptics";

/** Circular Theme Toggle switch with a horizontal flip animation. */
export const ThemeToggle = memo(function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      aria-label={dark ? "Switch to pastel light mode" : "Switch to purple dark mode"}
      onClick={() => {
        haptic("light");
        setTheme(dark ? "light" : "dark");
      }}
      className={`relative flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-500 outline-none shadow-md border ${
        dark
          ? "bg-purple-900 border-purple-800/60 shadow-[0_4px_16px_rgba(139,92,246,0.3)]"
          : "bg-white border-pink-300/60 shadow-[0_4px_16px_rgba(244,114,182,0.25)]"
      }`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={dark ? "dark" : "light"}
          initial={{ rotateY: -180, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          exit={{ rotateY: 180, opacity: 0 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 25 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {dark ? (
            <MoonStar className="size-5 text-purple-300 fill-purple-300/30" />
          ) : (
            <Sun className="size-5 text-amber-500 fill-amber-400/40" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
});
