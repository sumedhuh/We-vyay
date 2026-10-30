"use client";

import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

/**
 * Shared bottom sheet. Springs up from the bottom on mobile, centers on
 * desktop. Drag-to-dismiss is constrained to the y axis with a rubber band
 * beyond the top edge; >90px displacement (or a fast flick) dismisses.
 */
export function Sheet({
  open,
  onClose,
  label,
  children,
  dismissible = true,
  z = 70,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  dismissible?: boolean;
  /** raise for sheets that stack on top of another sheet */
  z?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, dismissible]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: z }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onClose()}
            className="absolute inset-0 bg-black/45 backdrop-blur-[3px]"
            aria-hidden
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: "84%", opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "70%", opacity: 0 }}
            drag={dismissible ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.06, bottom: 0.55 }}
            onDragEnd={(_e, info) => {
              if (!dismissible) return;
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            className="surface-solid relative flex max-h-[88dvh] w-full max-w-[430px] touch-pan-y flex-col overflow-hidden rounded-t-[2rem] sm:rounded-[2rem]"
          >
            <div
              aria-hidden
              className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink/15 dark:bg-white/15"
            />
            {dismissible && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-full bg-ink/5 text-ink/60 outline-none transition-colors hover:bg-ink/10 dark:bg-white/8 dark:text-snow/60 dark:hover:bg-white/15"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
            <div className="no-scrollbar min-h-0 overflow-y-auto px-5 pb-7 pt-3">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
