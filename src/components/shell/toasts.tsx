"use client";

import { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";

/** Lightweight in-app toast rail, pinned to the top of the app canvas. */
export const ToastRail = memo(function ToastRail() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none absolute inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-6"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ y: -18, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -12, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 560, damping: 34 }}
            className="surface shadow-soft flex max-w-full items-center gap-2.5 rounded-2xl px-4 py-2.5"
          >
            <span
              className={
                t.tone === "mint" ? "text-mint-deep" : "text-grape dark:text-amethyst"
              }
            >
              {t.tone === "mint" ? (
                <CheckCircle2 className="size-4" aria-hidden />
              ) : (
                <Sparkles className="size-4" aria-hidden />
              )}
            </span>
            <p className="truncate text-[13px] font-medium text-ink dark:text-snow">
              {t.title}
              {t.message ? (
                <span className="text-ink/55 dark:text-snow/50"> · {t.message}</span>
              ) : null}
            </p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
});
