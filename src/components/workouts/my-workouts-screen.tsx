"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Dumbbell, Globe, Lock, RefreshCw } from "lucide-react";
import { AnimatePresence as AP } from "framer-motion";
import {
  useUserWorkoutsQuery,
  useDeleteUserWorkout,
  useToggleWorkoutPublished,
  type UserWorkout,
} from "@/lib/queries/user-workouts";
import { WorkoutMiniCard } from "./workout-mini-card";
import { WorkoutEditorSheet } from "./workout-editor-sheet";
import { useUiStore } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

type Tab = "personal" | "published";

export function MyWorkoutsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<UserWorkout | null>(null);

  const pushToast = useUiStore((s) => s.pushToast);
  const { data: allWorkouts = [], isLoading, error, refetch } = useUserWorkoutsQuery();
  const deleteWorkout = useDeleteUserWorkout();
  const togglePublished = useToggleWorkoutPublished();

  const personalWorkouts = allWorkouts.filter((w) => !w.isPublished);
  const publishedWorkouts = allWorkouts.filter((w) => w.isPublished);
  const displayedWorkouts = activeTab === "personal" ? personalWorkouts : publishedWorkouts;

  const handleEdit = useCallback((workout: UserWorkout) => {
    setEditingWorkout(workout);
    setEditorOpen(true);
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteWorkout.mutateAsync(id);
        haptic("success");
        pushToast({ title: "Workout deleted", tone: "mint" });
      } catch {
        pushToast({ title: "Delete failed", message: "Please try again", tone: "grape" });
      }
    },
    [deleteWorkout, pushToast],
  );

  const handleTogglePublished = useCallback(
    async (workout: UserWorkout) => {
      try {
        await togglePublished.mutateAsync(workout);
        haptic("success");
        pushToast({
          title: workout.isPublished ? "Moved to drafts" : "Published!",
          tone: workout.isPublished ? "mint" : "mint",
        });
      } catch {
        pushToast({ title: "Failed to update", message: "Please try again", tone: "grape" });
      }
    },
    [togglePublished, pushToast],
  );

  const openCreate = useCallback(() => {
    haptic("light");
    setEditingWorkout(null);
    setEditorOpen(true);
  }, []);

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* ── Header ── */}
      <header className="pt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-mint-deep dark:text-amethyst">
          your creations
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-none text-black dark:text-white">
          My Workouts
        </h1>
        <p className="mt-1.5 text-[12px] font-medium text-black/50 dark:text-white/40">
          {allWorkouts.length === 0
            ? "Create your first custom workout below."
            : `${allWorkouts.length} workout${allWorkouts.length !== 1 ? "s" : ""} · ${publishedWorkouts.length} published`}
        </p>
      </header>

      {/* ── Create CTA ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={openCreate}
        className="flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-mint to-mint-strong text-[15px] font-black tracking-wide text-pine outline-none dark:from-grape dark:to-iris dark:text-white"
      >
        <Plus className="size-5" aria-hidden />
        Create New Workout
      </motion.button>

      {/* ── Tab Switcher ── */}
      <div className="flex rounded-full bg-black/5 dark:bg-white/8 p-1">
        {(
          [
            { id: "personal" as Tab, label: "Personal", icon: Lock, count: personalWorkouts.length },
            { id: "published" as Tab, label: "Published", icon: Globe, count: publishedWorkouts.length },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                haptic("selection");
                setActiveTab(tab.id);
              }}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-bold outline-none transition-colors",
                isActive
                  ? "bg-white dark:bg-black text-black dark:text-white shadow-sm"
                  : "text-black/50 dark:text-white/40",
              )}
            >
              <tab.icon className="size-4" aria-hidden />
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={cn(
                    "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-black",
                    isActive
                      ? "bg-mint/40 text-pine dark:bg-grape/30 dark:text-lilac"
                      : "bg-black/8 dark:bg-white/10 text-black/50 dark:text-white/40",
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[140px] w-full animate-pulse rounded-[1.6rem] bg-black/5 dark:bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-[#FFEBEE] dark:bg-[#3D2020]">
            <RefreshCw className="size-6 text-[#C62828] dark:text-[#EF9A9A]" />
          </div>
          <p className="text-[14px] font-bold text-black dark:text-white">
            Couldn't load workouts
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-full bg-black/8 dark:bg-white/10 px-5 py-2.5 text-[13px] font-bold text-black dark:text-white outline-none"
          >
            Retry
          </button>
        </div>
      ) : displayedWorkouts.length === 0 ? (
        <EmptyState tab={activeTab} onCreateClick={openCreate} />
      ) : (
        <div className="flex flex-col gap-3">
          <AP initial={false}>
            {displayedWorkouts.map((workout) => (
              <WorkoutMiniCard
                key={workout.id}
                workout={workout}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublished={handleTogglePublished}
                isDeleting={deleteWorkout.isPending}
                isToggling={togglePublished.isPending}
              />
            ))}
          </AP>
        </div>
      )}

      {/* ── Workout Editor Sheet ── */}
      <WorkoutEditorSheet
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setTimeout(() => setEditingWorkout(null), 350);
        }}
        workout={editingWorkout}
      />
    </div>
  );
}

function EmptyState({ tab, onCreateClick }: { tab: Tab; onCreateClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-4 py-16 text-center"
    >
      <div className="flex size-20 items-center justify-center rounded-full bg-mint/20 dark:bg-grape/20">
        <Dumbbell className="size-9 text-mint-deep dark:text-amethyst" aria-hidden />
      </div>
      <div>
        <p className="text-[17px] font-black tracking-tight text-black dark:text-white">
          {tab === "personal" ? "No personal workouts yet" : "Nothing published yet"}
        </p>
        <p className="mt-1 text-[13px] text-black/50 dark:text-white/40">
          {tab === "personal"
            ? "Create your first workout to get started."
            : "Publish a personal workout to share it with the community."}
        </p>
      </div>
      {tab === "personal" && (
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-2 flex h-12 items-center gap-2 rounded-full bg-mint/30 dark:bg-grape/25 px-6 text-[14px] font-bold text-pine dark:text-lilac outline-none"
        >
          <Plus className="size-4" aria-hidden />
          Create Workout
        </button>
      )}
    </motion.div>
  );
}
