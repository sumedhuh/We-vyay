"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, User, ChevronRight, Dumbbell, Pencil, Check } from "lucide-react";
import { useProfileQuery, useUpdateProfile } from "@/lib/queries/profile";
import { WorkoutEditorSheet } from "@/components/workouts/workout-editor-sheet";
import { useUiStore } from "@/stores/ui-store";
import { useSettingsStore } from "@/stores/settings-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/** Preset avatar icons using dicebear seeds */
const ICON_PRESETS = [
  { seed: "felix", bg: "#E8F4FD", name: "Felix" },
  { seed: "mia", bg: "#FDF3E8", name: "Mia" },
  { seed: "leo", bg: "#F3E8FD", name: "Leo" },
  { seed: "sam", bg: "#E8FDF3", name: "Sam" },
  { seed: "blake", bg: "#FDE8F3", name: "Blake" },
  { seed: "alex", bg: "#FDFDE8", name: "Alex" },
  { seed: "morgan", bg: "#E8EDFD", name: "Morgan" },
  { seed: "casey", bg: "#FDE8E8", name: "Casey" },
];

export function ProfileScreen() {
  const pushToast = useUiStore((s) => s.pushToast);
  const avatarColor = useSettingsStore((s) => s.avatarColor);
  const displayName = useSettingsStore((s) => s.displayName);

  const { data: profile, isLoading } = useProfileQuery();
  const updateProfile = useUpdateProfile();

  const [bioEditing, setBioEditing] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [workoutEditorOpen, setWorkoutEditorOpen] = useState(false);

  const startBioEdit = useCallback(() => {
    setBioValue(profile?.bio ?? "");
    setBioEditing(true);
  }, [profile?.bio]);

  const saveBio = useCallback(async () => {
    if (!bioEditing) return;
    try {
      await updateProfile.mutateAsync({ bio: bioValue.trim() });
      haptic("success");
      pushToast({ title: "Bio updated", tone: "mint" });
    } catch {
      pushToast({ title: "Update failed", tone: "grape" });
    } finally {
      setBioEditing(false);
    }
  }, [bioEditing, bioValue, updateProfile, pushToast]);

  const selectIcon = useCallback(
    async (seed: string) => {
      const iconUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=transparent`;
      try {
        await updateProfile.mutateAsync({ iconUrl });
        haptic("success");
        pushToast({ title: "Avatar updated", tone: "mint" });
      } catch {
        pushToast({ title: "Update failed", tone: "grape" });
      } finally {
        setIconPickerOpen(false);
      }
    },
    [updateProfile, pushToast],
  );

  const avatarUrl =
    profile?.iconUrl ??
    `https://api.dicebear.com/7.x/notionists/svg?seed=${displayName}&backgroundColor=transparent`;

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* ── Header ── */}
      <header className="pt-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-mint-deep dark:text-amethyst">
          your identity
        </p>
        <h1 className="font-display mt-1 text-[34px] italic leading-none text-black dark:text-white">
          Profile
        </h1>
      </header>

      {/* ── Avatar Card ── */}
      <div className="surface-solid rounded-[1.6rem] p-5">
        <div className="flex items-center gap-4">
          {/* Avatar with edit button */}
          <div className="relative shrink-0">
            <div
              className="size-20 overflow-hidden rounded-full border-2 border-black/8 dark:border-white/10"
              style={{ backgroundColor: avatarColor + "33" }}
            >
              {isLoading ? (
                <div className="size-full animate-pulse bg-black/8 dark:bg-white/8" />
              ) : (
                <img
                  src={avatarUrl}
                  alt="Profile avatar"
                  className="size-full object-cover"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                haptic("light");
                setIconPickerOpen((v) => !v);
              }}
              aria-label="Change avatar"
              className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full border-2 border-paper bg-mint-deep dark:bg-grape dark:border-void outline-none"
            >
              <Camera className="size-3.5 text-white" aria-hidden />
            </button>
          </div>

          {/* Name & identity tag */}
          <div className="min-w-0 flex-1">
            <p className="text-[20px] font-black tracking-tight text-black dark:text-white truncate">
              {displayName || "You"}
            </p>
            <p className="mt-0.5 text-[12px] font-medium text-black/40 dark:text-white/35">
              vyay member
            </p>
          </div>
        </div>

        {/* Icon picker */}
        {iconPickerOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-black/40 dark:text-white/35">
              Choose your avatar
            </p>
            <div className="grid grid-cols-4 gap-3">
              {ICON_PRESETS.map((preset) => {
                const url = `https://api.dicebear.com/7.x/notionists/svg?seed=${preset.seed}&backgroundColor=transparent`;
                const isSelected = profile?.iconUrl?.includes(preset.seed);
                return (
                  <motion.button
                    key={preset.seed}
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => selectIcon(preset.seed)}
                    aria-label={`Select ${preset.name} avatar`}
                    className={cn(
                      "relative flex flex-col items-center gap-1.5 outline-none",
                    )}
                  >
                    <div
                      className={cn(
                        "size-14 overflow-hidden rounded-full border-2",
                        isSelected
                          ? "border-mint-deep dark:border-amethyst"
                          : "border-transparent",
                      )}
                      style={{ backgroundColor: preset.bg }}
                    >
                      <img
                        src={url}
                        alt={preset.name}
                        className="size-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    {isSelected && (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-mint-deep dark:bg-amethyst">
                        <Check className="size-3 text-white" aria-hidden />
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-black/40 dark:text-white/35">
                      {preset.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Bio Card ── */}
      <div className="surface-solid rounded-[1.6rem] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <User className="size-4 text-black/50 dark:text-white/40" aria-hidden />
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-black/50 dark:text-white/40">
              Bio
            </p>
          </div>
          {!bioEditing ? (
            <button
              type="button"
              onClick={startBioEdit}
              aria-label="Edit bio"
              className="flex size-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/8 outline-none"
            >
              <Pencil className="size-3.5 text-black/50 dark:text-white/40" />
            </button>
          ) : (
            <button
              type="button"
              onClick={saveBio}
              disabled={updateProfile.isPending}
              aria-label="Save bio"
              className="flex h-8 items-center gap-1.5 rounded-full bg-mint/40 dark:bg-grape/25 px-3 text-[11px] font-bold text-pine dark:text-lilac outline-none disabled:opacity-50"
            >
              <Check className="size-3.5" aria-hidden />
              {updateProfile.isPending ? "Saving…" : "Save"}
            </button>
          )}
        </div>

        {bioEditing ? (
          <textarea
            value={bioValue}
            onChange={(e) => setBioValue(e.target.value)}
            placeholder="Tell the community about your fitness journey…"
            maxLength={300}
            rows={4}
            autoFocus
            className="w-full resize-none rounded-2xl border border-black/10 dark:border-white/10 bg-black/4 dark:bg-white/5 px-4 py-3 text-[14px] font-medium text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/25 outline-none focus:border-mint-deep/50 dark:focus:border-amethyst/50"
          />
        ) : isLoading ? (
          <div className="h-14 animate-pulse rounded-xl bg-black/5 dark:bg-white/5" />
        ) : (
          <p
            className={cn(
              "text-[14px] font-medium leading-relaxed",
              profile?.bio
                ? "text-black/80 dark:text-white/75"
                : "italic text-black/30 dark:text-white/25",
            )}
          >
            {profile?.bio || "Tap the pencil to add your bio."}
          </p>
        )}
        {bioEditing && (
          <p className="mt-1 text-right text-[11px] text-black/30 dark:text-white/25">
            {bioValue.length}/300
          </p>
        )}
      </div>

      {/* ── Create Custom Workout CTA ── */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={() => {
          haptic("light");
          setWorkoutEditorOpen(true);
        }}
        className="flex items-center gap-4 rounded-[1.6rem] border border-black/8 dark:border-white/8 bg-gradient-to-br from-[#E8F4FD] to-[#F3E8FD] dark:from-[#1A2733] dark:to-[#231A33] p-5 text-left outline-none"
      >
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-white dark:bg-black/30">
          <Dumbbell className="size-6 text-[#1565C0] dark:text-[#90CAF9]" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-black tracking-tight text-black dark:text-white">
            Create Custom Workout
          </p>
          <p className="mt-0.5 text-[12px] text-black/50 dark:text-white/40">
            Design your own routine, then publish it
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-black/30 dark:text-white/30" aria-hidden />
      </motion.button>

      {/* Workout editor */}
      <WorkoutEditorSheet
        open={workoutEditorOpen}
        onClose={() => setWorkoutEditorOpen(false)}
        workout={null}
      />
    </div>
  );
}
