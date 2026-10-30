"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";

/**
 * Gullak Vault — the digital jar that collects completed task items.
 * When all tasks are done, it glows and presents a "CRUSH IT" button.
 * Button press → jar shatters → items splash → "CRUSHED!" typography.
 */
export function GullakVault() {
  const gullakItems = useChallengeStore((s) => s.gullakItems);
  const allCompleted = useChallengeStore((s) => s.allCompleted);
  const crushed = useChallengeStore((s) => s.crushed);
  const crushGullak = useChallengeStore((s) => s.crushGullak);
  const [shaking, setShaking] = useState(false);
  const [shattered, setShattered] = useState(false);
  const [fragments, setFragments] = useState<{ id: number; x: number; y: number; r: number }[]>([]);

  const handleCrush = useCallback(() => {
    if (!allCompleted || shattered) return;
    haptic("heavy");
    setShaking(true);

    setTimeout(() => {
      setShaking(false);
      setShattered(true);
      haptic("success");

      // Generate jar fragments
      const frags = Array.from({ length: 16 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 300 - 100,
        r: Math.random() * 720 - 360,
      }));
      setFragments(frags);

      setTimeout(() => crushGullak(), 1200);
    }, 500);
  }, [allCompleted, shattered, crushGullak]);

  if (gullakItems.length === 0 && !shattered) return null;

  return (
    <motion.div
      layout
      className="relative overflow-hidden rounded-[1.8rem] p-5"
      style={{
        background: "linear-gradient(135deg, #FFF8E1, #FFE0B2)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!shattered ? (
        <>
          {/* Jar */}
          <div className="flex flex-col items-center">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700/60 mb-3">
              Gullak Vault
            </p>

            <motion.div
              animate={
                shaking
                  ? { x: [-4, 4, -4, 4, 0], rotate: [-2, 2, -2, 2, 0] }
                  : allCompleted
                    ? { scale: [1, 1.02, 1] }
                    : {}
              }
              transition={
                shaking
                  ? { duration: 0.5 }
                  : allCompleted
                    ? { repeat: Infinity, duration: 1.5 }
                    : {}
              }
              className={`relative w-28 h-32 rounded-b-[2rem] rounded-t-xl overflow-hidden ${
                allCompleted ? "animate-gullak-glow" : ""
              }`}
              style={{
                background: "linear-gradient(180deg, rgba(255,200,100,0.3), rgba(255,170,50,0.5))",
                border: "3px solid rgba(200,150,50,0.4)",
              }}
            >
              {/* Jar lid */}
              <div
                className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-20 h-4 rounded-t-lg"
                style={{
                  background: "linear-gradient(180deg, #C0935F, #A07843)",
                  border: "2px solid rgba(160,120,67,0.6)",
                }}
              />

              {/* Items inside */}
              <div className="absolute bottom-2 left-0 right-0 flex flex-wrap justify-center gap-1 px-2">
                <AnimatePresence>
                  {gullakItems.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ y: -60, opacity: 0, scale: 0.5 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 15,
                        delay: i * 0.1,
                      }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                      style={{ background: item.color }}
                    >
                      {item.emoji}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>

            <p className="mt-2 text-[11px] font-bold text-amber-700/60">
              {gullakItems.length} item{gullakItems.length !== 1 ? "s" : ""} collected
            </p>

            {/* CRUSH button */}
            <AnimatePresence>
              {allCompleted && (
                <motion.button
                  type="button"
                  onClick={handleCrush}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  whileTap={{ scale: 0.92 }}
                  className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-orange-500/40 cursor-pointer outline-none"
                >
                  💥 Crush It!
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </>
      ) : (
        /* Shattered state */
        <div className="relative flex flex-col items-center py-6 min-h-[200px]">
          {/* Flying fragments */}
          {fragments.map((f) => (
            <motion.div
              key={f.id}
              initial={{ x: 0, y: 0, rotate: 0, scale: 1, opacity: 1 }}
              animate={{ x: f.x, y: f.y, rotate: f.r, scale: 0, opacity: 0 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute left-1/2 top-1/2 w-4 h-3 rounded-sm"
              style={{
                background: "linear-gradient(135deg, rgba(255,200,100,0.6), rgba(200,150,50,0.4))",
                border: "1px solid rgba(200,150,50,0.3)",
              }}
            />
          ))}

          {/* Splashed items */}
          {gullakItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ x: 0, y: 0, scale: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 120,
                scale: [0, 1.5, 1],
                rotate: Math.random() * 180 - 90,
              }}
              transition={{ delay: 0.3 + i * 0.05, type: "spring", stiffness: 200 }}
              className="absolute w-8 h-8 rounded-full flex items-center justify-center text-lg"
              style={{ background: item.color, top: "50%", left: "50%" }}
            >
              {item.emoji}
            </motion.div>
          ))}

          {/* CRUSHED typography */}
          <motion.div
            initial={{ scale: 0, rotate: -10, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 200, damping: 12 }}
            className="relative z-10 mt-8"
          >
            <h2
              className="text-4xl font-black uppercase tracking-widest"
              style={{
                background: "linear-gradient(135deg, #FF6B6B, #FFB347, #FF69B4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
              }}
            >
              CRUSHED!
            </h2>
            <p className="mt-2 text-center text-[11px] font-bold text-amber-700/60">
              You destroyed today's goals 💪
            </p>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
