"use client";

import { memo, useState } from "react";
import { motion } from "framer-motion";
import { ListChecks, Globe, Lock, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import type { UserWorkout } from "@/lib/queries/user-workouts";

export type WorkoutMiniCardProps = {
  workout: UserWorkout;
  onEdit?: (w: UserWorkout) => void;
  onDelete?: (id: string) => void;
  onTogglePublished?: (w: UserWorkout) => void;
  isDeleting?: boolean;
  isToggling?: boolean;
};

/** Pastel color slots cycle through for variety */
const PASTEL_PAIRS: { bg: string; text: string }[] = [
  { bg: "bg-[#E8F4FD]", text: "text-[#1565C0]" },   // Sky blue
  { bg: "bg-[#F3E8FD]", text: "text-[#6A1B9A]" },   // Lavender
  { bg: "bg-[#E8FDF3]", text: "text-[#1B5E20]" },   // Sage green
  { bg: "bg-[#FDF3E8]", text: "text-[#E65100]" },   // Peach
  { bg: "bg-[#FDE8F3]", text: "text-[#880E4F]" },   // Blush pink
  { bg: "bg-[#FDFDE8]", text: "text-[#827717]" },   // Butter
];

const DARK_PASTEL_PAIRS: { bg: string; text: string }[] = [
  { bg: "bg-[#1A2733]", text: "text-[#90CAF9]" },
  { bg: "bg-[#231A33]", text: "text-[#CE93D8]" },
  { bg: "bg-[#1A2E1F]", text: "text-[#A5D6A7]" },
  { bg: "bg-[#2E251A]", text: "text-[#FFCC80]" },
  { bg: "bg-[#2E1A23]", text: "text-[#F48FB1]" },
  { bg: "bg-[#2E2E1A]", text: "text-[#FFF176]" },
];

export const WorkoutMiniCard = memo(function WorkoutMiniCard({
  workout,
  onEdit,
  onDelete,
  onTogglePublished,
  isDeleting,
  isToggling,
}: WorkoutMiniCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Deterministic color slot from title hash
  const slot =
    workout.title.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    PASTEL_PAIRS.length;

  const light = PASTEL_PAIRS[slot];
  const dark = DARK_PASTEL_PAIRS[slot];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "relative overflow-hidden rounded-[1.6rem] border border-black/8 dark:border-white/8",
        light.bg,
        "dark:" + dark.bg.replace("bg-", ""),
      )}
    >
      {/* Published / Draft badge — top right */}
      <div className="absolute right-4 top-4">
        {workout.isPublished ? (
          <span className="flex items-center gap-1 rounded-full bg-[#E8F5E9] px-2.5 py-1 text-[10px] font-bold text-[#2E7D32] dark:bg-[#1A2E1F] dark:text-[#69F0AE]">
            <Globe className="size-3" aria-hidden />
            Published
          </span>
        ) : (
          <span className="flex items-center gap-1 rounded-full bg-[#FFF3E0] px-2.5 py-1 text-[10px] font-bold text-[#E65100] dark:bg-[#2E251A] dark:text-[#FFB74D]">
            <Lock className="size-3" aria-hidden />
            Draft
          </span>
        )}
      </div>

      <div className="p-5 pr-28">
        <h3
          className={cn(
            "text-[16px] font-bold tracking-tight leading-tight",
            light.text,
            "dark:" + dark.text.replace("text-", ""),
          )}
        >
          {workout.title}
        </h3>
        {workout.description ? (
          <p className="mt-1 line-clamp-2 text-[12px] font-medium text-black/55 dark:text-white/50">
            {workout.description}
          </p>
        ) : (
          <p className="mt-1 text-[12px] font-medium text-black/30 dark:text-white/25 italic">
            No description
          </p>
        )}

        <div className="mt-3 flex items-center gap-3 text-[11px] font-semibold text-black/50 dark:text-white/40">
          <span className="flex items-center gap-1">
            <ListChecks className="size-3.5" aria-hidden />
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Action row */}
      <div className="flex items-center gap-2 border-t border-black/6 dark:border-white/6 px-5 py-3">
        {/* Toggle published */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic("selection");
            onTogglePublished?.(workout);
          }}
          disabled={isToggling}
          aria-label={workout.isPublished ? "Unpublish" : "Publish"}
          className="flex h-9 items-center gap-1.5 rounded-full bg-black/5 dark:bg-white/8 px-3.5 text-[11px] font-bold text-black/70 dark:text-white/70 outline-none disabled:opacity-50"
        >
          {workout.isPublished ? (
            <>
              <EyeOff className="size-3.5" aria-hidden />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="size-3.5" aria-hidden />
              Publish
            </>
          )}
        </motion.button>

        {/* Edit */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            haptic("light");
            onEdit?.(workout);
          }}
          aria-label={`Edit ${workout.title}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 outline-none"
        >
          <Pencil className="size-4 text-black/60 dark:text-white/60" aria-hidden />
        </motion.button>

        {/* Delete */}
        {confirmDelete ? (
          <motion.button
            type="button"
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={() => {
              haptic("medium");
              onDelete?.(workout.id);
              setConfirmDelete(false);
            }}
            disabled={isDeleting}
            className="flex h-9 items-center gap-1 rounded-full bg-[#FFEBEE] dark:bg-[#3D2020] px-3 text-[11px] font-bold text-[#C62828] dark:text-[#EF9A9A] outline-none disabled:opacity-50"
          >
            <Trash2 className="size-3.5" aria-hidden />
            Confirm
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              haptic("light");
              setConfirmDelete(true);
              setTimeout(() => setConfirmDelete(false), 3000);
            }}
            aria-label={`Delete ${workout.title}`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 outline-none"
          >
            <Trash2 className="size-4 text-black/40 dark:text-white/40" aria-hidden />
          </motion.button>
        )}
      </div>
    </motion.article>
  );
});
