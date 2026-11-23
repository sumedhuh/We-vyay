"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Trash2, Globe, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import {
  useCreateUserWorkout,
  useUpdateUserWorkout,
  type UserWorkout,
} from "@/lib/queries/user-workouts";
import { useUiStore } from "@/stores/ui-store";

type ExerciseEntry = {
  name: string;
  sets: number;
  reps: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** If provided, we're editing an existing workout */
  workout?: UserWorkout | null;
};

const DEFAULT_EXERCISE: ExerciseEntry = { name: "", sets: 3, reps: "12" };

export function WorkoutEditorSheet({ open, onClose, workout }: Props) {
  const isEditing = Boolean(workout);
  const pushToast = useUiStore((s) => s.pushToast);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [exercises, setExercises] = useState<ExerciseEntry[]>([{ ...DEFAULT_EXERCISE }]);
  const [error, setError] = useState<string | null>(null);

  const create = useCreateUserWorkout();
  const update = useUpdateUserWorkout();
  const isPending = create.isPending || update.isPending;

  // Populate fields when editing
  useEffect(() => {
    if (open && workout) {
      setTitle(workout.title);
      setDescription(workout.description);
      setIsPublished(workout.isPublished);
      setExercises(
        workout.exercises.length > 0
          ? workout.exercises.map((e) => ({ name: e.name, sets: e.sets, reps: e.reps }))
          : [{ ...DEFAULT_EXERCISE }],
      );
      setError(null);
    } else if (open && !workout) {
      setTitle("");
      setDescription("");
      setIsPublished(false);
      setExercises([{ ...DEFAULT_EXERCISE }]);
      setError(null);
    }
  }, [open, workout]);

  const addExercise = useCallback(() => {
    haptic("light");
    setExercises((prev) => [...prev, { ...DEFAULT_EXERCISE }]);
  }, []);

  const removeExercise = useCallback((index: number) => {
    haptic("light");
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateExercise = useCallback(
    (index: number, field: keyof ExerciseEntry, value: string | number) => {
      setExercises((prev) =>
        prev.map((e, i) => (i === index ? { ...e, [field]: value } : e)),
      );
    },
    [],
  );

  const handleSave = useCallback(async () => {
    setError(null);
    if (!title.trim()) {
      setError("Please enter a workout title.");
      haptic("medium");
      return;
    }
    const validExercises = exercises.filter((e) => e.name.trim());
    const payload = {
      title: title.trim(),
      description: description.trim(),
      isPublished,
      exercises: validExercises,
    };

    try {
      if (isEditing && workout) {
        await update.mutateAsync({ id: workout.id, ...payload });
        pushToast({ title: "Workout updated", tone: "mint" });
      } else {
        await create.mutateAsync(payload);
        pushToast({ title: "Workout created!", tone: "mint" });
      }
      haptic("success");
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      haptic("medium");
    }
  }, [title, description, isPublished, exercises, isEditing, workout, create, update, pushToast, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/40"
            onClick={onClose}
            aria-hidden
          />

          {/* Sheet */}
          <motion.div
            role="dialog"
            aria-label={isEditing ? "Edit workout" : "Create workout"}
            aria-modal="true"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="absolute inset-x-0 bottom-0 z-50 flex max-h-[92%] flex-col overflow-hidden rounded-t-[2.5rem] bg-paper dark:bg-void"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-black/15 dark:bg-white/15" aria-hidden />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 pt-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-mint-deep dark:text-amethyst">
                  {isEditing ? "editing" : "new workout"}
                </p>
                <h2 className="mt-0.5 text-[22px] font-black tracking-tight text-black dark:text-white">
                  {isEditing ? "Edit Workout" : "Create Workout"}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-10 items-center justify-center rounded-full bg-black/6 dark:bg-white/8 outline-none"
              >
                <X className="size-5 text-black/60 dark:text-white/60" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="no-scrollbar flex-1 overflow-y-auto px-6 pb-8">
              <div className="flex flex-col gap-5">

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 rounded-2xl bg-[#FFEBEE] dark:bg-[#3D2020] px-4 py-3"
                    >
                      <AlertCircle className="size-4 shrink-0 text-[#C62828] dark:text-[#EF9A9A]" />
                      <p className="text-[13px] font-semibold text-[#C62828] dark:text-[#EF9A9A]">
                        {error}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Title */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/40">
                    Title *
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Morning Full-Body Burn"
                    maxLength={80}
                    aria-label="Workout title"
                    className="w-full rounded-2xl border border-black/10 dark:border-white/10 bg-black/4 dark:bg-white/5 px-4 py-3.5 text-[16px] font-bold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/25 outline-none focus:border-mint-deep/50 dark:focus:border-amethyst/50"
                  />
                  <p className="mt-1 text-right text-[11px] text-black/30 dark:text-white/25">
                    {title.length}/80
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-2 block text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/40">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what this workout targets..."
                    maxLength={400}
                    rows={3}
                    aria-label="Workout description"
                    className="w-full resize-none rounded-2xl border border-black/10 dark:border-white/10 bg-black/4 dark:bg-white/5 px-4 py-3.5 text-[14px] font-medium text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/25 outline-none focus:border-mint-deep/50 dark:focus:border-amethyst/50"
                  />
                  <p className="mt-1 text-right text-[11px] text-black/30 dark:text-white/25">
                    {description.length}/400
                  </p>
                </div>

                {/* Publish toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-black/8 dark:border-white/8 bg-black/3 dark:bg-white/4 px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex size-9 items-center justify-center rounded-full",
                        isPublished
                          ? "bg-[#E8F5E9] dark:bg-[#1A2E1F]"
                          : "bg-[#FFF3E0] dark:bg-[#2E251A]",
                      )}
                    >
                      {isPublished ? (
                        <Globe className="size-4 text-[#2E7D32] dark:text-[#69F0AE]" />
                      ) : (
                        <Lock className="size-4 text-[#E65100] dark:text-[#FFB74D]" />
                      )}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-black dark:text-white">
                        {isPublished ? "Published" : "Draft"}
                      </p>
                      <p className="text-[11px] text-black/45 dark:text-white/40">
                        {isPublished ? "Visible to community" : "Only visible to you"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isPublished}
                    onClick={() => {
                      haptic("selection");
                      setIsPublished((v) => !v);
                    }}
                    className={cn(
                      "relative h-7 w-12 cursor-pointer rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
                      isPublished
                        ? "bg-[#4CAF50] dark:bg-[#43A047]"
                        : "bg-black/15 dark:bg-white/15",
                    )}
                  >
                    <motion.span
                      layout
                      transition={{ type: "spring", stiffness: 600, damping: 36 }}
                      className={cn(
                        "absolute top-1 size-5 rounded-full bg-white shadow-sm",
                        isPublished ? "left-6" : "left-1",
                      )}
                    />
                  </button>
                </div>

                {/* Exercises */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/40">
                      Exercises
                    </label>
                    <button
                      type="button"
                      onClick={addExercise}
                      disabled={exercises.length >= 24}
                      className="flex items-center gap-1.5 rounded-full bg-mint/40 dark:bg-grape/25 px-3 py-1.5 text-[11px] font-bold text-pine dark:text-lilac outline-none disabled:opacity-40"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                      {exercises.map((ex, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          className="overflow-hidden rounded-2xl border border-black/8 dark:border-white/8 bg-black/3 dark:bg-white/4"
                        >
                          <div className="p-3.5">
                            <div className="flex items-start gap-2">
                              <span className="mt-3 text-[11px] font-black text-black/35 dark:text-white/30 w-5 shrink-0 text-center">
                                {i + 1}
                              </span>
                              <div className="flex-1 flex flex-col gap-2">
                                <input
                                  value={ex.name}
                                  onChange={(e) => updateExercise(i, "name", e.target.value)}
                                  placeholder="Exercise name"
                                  aria-label={`Exercise ${i + 1} name`}
                                  className="w-full rounded-xl border border-black/8 dark:border-white/8 bg-transparent px-3 py-2.5 text-[14px] font-semibold text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/25 outline-none focus:border-mint-deep/50 dark:focus:border-amethyst/50"
                                />
                                <div className="flex gap-2">
                                  <div className="flex-1">
                                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-black/35 dark:text-white/30">
                                      Sets
                                    </label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={20}
                                      value={ex.sets}
                                      onChange={(e) =>
                                        updateExercise(i, "sets", parseInt(e.target.value) || 1)
                                      }
                                      aria-label={`Exercise ${i + 1} sets`}
                                      className="w-full rounded-xl border border-black/8 dark:border-white/8 bg-transparent px-3 py-2 text-[14px] font-bold text-black dark:text-white text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                  </div>
                                  <div className="flex-1">
                                    <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-black/35 dark:text-white/30">
                                      Reps / Duration
                                    </label>
                                    <input
                                      value={ex.reps}
                                      onChange={(e) => updateExercise(i, "reps", e.target.value)}
                                      placeholder="12 or 30s"
                                      aria-label={`Exercise ${i + 1} reps`}
                                      className="w-full rounded-xl border border-black/8 dark:border-white/8 bg-transparent px-3 py-2 text-[14px] font-bold text-black dark:text-white text-center outline-none placeholder:text-black/25 dark:placeholder:text-white/20"
                                    />
                                  </div>
                                </div>
                              </div>
                              {exercises.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeExercise(i)}
                                  aria-label={`Remove exercise ${i + 1}`}
                                  className="mt-2.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFEBEE] dark:bg-[#3D2020] outline-none"
                                >
                                  <Trash2 className="size-3.5 text-[#C62828] dark:text-[#EF9A9A]" />
                                </button>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="border-t border-black/6 dark:border-white/6 px-6 py-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={isPending}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[16px] font-black tracking-wide text-pine outline-none disabled:opacity-50 dark:from-grape dark:to-iris dark:text-white"
              >
                {isPending ? (
                  "Saving…"
                ) : (
                  <>
                    <CheckCircle2 className="size-5" aria-hidden />
                    {isEditing ? "Save Changes" : "Create Workout"}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
