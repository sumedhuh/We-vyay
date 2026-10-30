"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Play, Video, Sparkles, Send } from "lucide-react";
import { WeekStrip } from "./week-strip";
import { useSettingsStore } from "@/stores/settings-store";
import { StatsChips } from "./stats-chips";
import { useChallengeStore } from "@/stores/challenge-store";
import { haptic } from "@/lib/haptics";
import { CARD_COMPONENTS } from "../challenge/challenge-hero";
import { useFeedQuery } from "@/lib/queries/feed";
import { FeedCard } from "./feed-card";
import { RoutinePlayer } from "@/components/fitness/RoutinePlayer";
import type { Workout } from "@/db/schema";
import { useTheme } from "next-themes";

import type { FeedCardTheme } from "./feed-card";

const VIBRANT_THEMES: FeedCardTheme[] = [
  { bg: "#A792FA", contrastBg: "#FFD700", contrastText: "#1a1a1a" }, // Purple -> Yellow
  { bg: "#FFB84D", contrastBg: "#A5C9FF", contrastText: "#1a1a1a" }, // Orange -> Blue
  { bg: "#A5C9FF", contrastBg: "#FF85EA", contrastText: "#1a1a1a" }, // Blue -> Pink
  { bg: "#FF85EA", contrastBg: "#69F0AE", contrastText: "#1a1a1a" }, // Pink -> Green (Mint)
  { bg: "#4FC3F7", contrastBg: "#FFB84D", contrastText: "#1a1a1a" }, // Cyan -> Orange
  { bg: "#69F0AE", contrastBg: "#FF85EA", contrastText: "#1a1a1a" }, // Green (Mint) -> Pink
];

/** Muted dark-mode variants — same hue families, much lower saturation & brightness */
const DARK_THEMES: FeedCardTheme[] = [
  { bg: "#2A2040", contrastBg: "#3D3520", contrastText: "#e0d8f0" }, // muted purple -> muted gold
  { bg: "#332810", contrastBg: "#1A2A3D", contrastText: "#f0dcc0" }, // muted orange -> muted blue
  { bg: "#1A2A3D", contrastBg: "#3D2040", contrastText: "#c8daf0" }, // muted blue -> muted pink
  { bg: "#3D2040", contrastBg: "#1A3028", contrastText: "#f0c8e0" }, // muted pink -> muted green
  { bg: "#142838", contrastBg: "#332810", contrastText: "#c0dae8" }, // muted cyan -> muted orange
  { bg: "#1A3028", contrastBg: "#3D2040", contrastText: "#c0e8d0" }, // muted green -> muted pink
];

/** Mock workout objects for the plan cards so the routine player has exercises. */
const PLAN_WORKOUTS: Record<string, Workout> = {
  yoga: {
    id: "plan-yoga",
    author: "Tiffany Way",
    authorHandle: "@tiffany",
    avatarHue: 280,
    title: "Yoga Group",
    description: "Medium intensity yoga session focused on flexibility and balance.",
    level: "Intermediate",
    durationMin: 60,
    kcal: 280,
    cover: null,
    coverSeed: "lilac",
    exercises: [
      { name: "Sun Salutation", sets: 3, reps: "5" },
      { name: "Warrior Pose", sets: 2, reps: "45s" },
      { name: "Tree Pose", sets: 2, reps: "30s" },
      { name: "Downward Dog", sets: 3, reps: "40s" },
      { name: "Pigeon Pose", sets: 2, reps: "60s" },
    ],
    vibes: { cardio: 30, strength: 40, mobility: 90, intensity: 35, endurance: 50 },
    premium: false,
    likes: 342,
    liked: false,
    ratingSum: 9,
    ratingCount: 2,
    createdAt: new Date().toISOString(),
  },
  balance: {
    id: "plan-balance",
    author: "Coach Ava",
    authorHandle: "@ava_balance",
    avatarHue: 180,
    title: "Balance",
    description: "Light functional balance and stability training.",
    level: "Beginner",
    durationMin: 90,
    kcal: 200,
    cover: null,
    coverSeed: "sky",
    exercises: [
      { name: "Single Leg Stand", sets: 3, reps: "30s" },
      { name: "Bosu Ball Squat", sets: 3, reps: "12" },
      { name: "Heel-to-Toe Walk", sets: 2, reps: "20" },
      { name: "Side Plank", sets: 2, reps: "30s" },
    ],
    vibes: { cardio: 20, strength: 35, mobility: 80, intensity: 25, endurance: 40 },
    premium: false,
    likes: 198,
    liked: false,
    ratingSum: 5,
    ratingCount: 1,
    createdAt: new Date().toISOString(),
  },
};

export function FeedScreen() {
  const [hydrated, setHydrated] = useState(false);
  const displayName = useSettingsStore((s) => s.displayName);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Interactive Plan states
  const [showInput, setShowInput] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const tasks = useChallengeStore((s) => s.tasks);
  const submitChallenge = useChallengeStore((s) => s.submitChallenge);

  // Feed Query
  const { data: feedData, fetchNextPage, hasNextPage, isFetchingNextPage } = useFeedQuery();

  // Routine Player
  const [playerOpen, setPlayerOpen] = useState(false);
  const [playerWorkout, setPlayerWorkout] = useState<Workout | null>(null);

  useEffect(() => setHydrated(true), []);

  const todayDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
  }); // e.g. "25 Nov."

  const handleSubmit = useCallback(() => {
    if (!inputText.trim()) return;
    haptic("success");
    submitChallenge(inputText.trim());
    setInputText("");
    setShowInput(false);
  }, [inputText, submitChallenge]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div className="flex flex-col gap-6 relative px-1 pb-24">
      {/* ── Header ── */}
      <header className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="size-12 overflow-hidden rounded-full border border-black/5 dark:border-white/10">
            <img
              src="https://api.dicebear.com/7.x/notionists/svg?seed=sandra&backgroundColor=ffdfbf"
              alt="Profile"
              className="size-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-[22px] font-bold text-black dark:text-white leading-tight tracking-tight">
              Hello, {hydrated ? displayName : "Sandra"}
            </h1>
            <p className="text-[14px] font-medium text-black/50 dark:text-white/50">
              Today {todayDate}
            </p>
          </div>
        </div>
        {/* Search Icon */}
        <button className="flex size-11 items-center justify-center rounded-full border border-black/5 bg-black/5 dark:bg-white/10 dark:border-white/10 outline-none">
          <Search className="size-[22px] text-black dark:text-white" strokeWidth={1.5} />
        </button>
      </header>

      {/* ── Stats Chips ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="relative w-[calc(100%+8px)] -ml-1 overflow-visible"
      >
        {/* Ambient Mesh Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#FFDAB9] rounded-full blur-[90px] opacity-[0.25] pointer-events-none -z-10" />
        <StatsChips />
      </motion.div>

      {/* ── Daily Challenge Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`relative overflow-hidden rounded-[2.5rem] p-6 shadow-sm min-h-[160px] ${isDark ? 'bg-[#2A2040]' : 'bg-[#A792FA]'}`}
      >
        <div className="relative z-10 w-2/3">
          <h2 className={`text-[32px] font-bold leading-[1.05] tracking-tight pl-2 ${isDark ? 'text-[#e0d8f0]' : 'text-[#1a1a1a]'}`}>
            Daily<br />challenge
          </h2>
          <p className={`mt-2 text-[13px] font-medium pl-2 ${isDark ? 'text-[#e0d8f0]/60' : 'text-[#1a1a1a]/70'}`}>
            Do your plan before 09:00 AM
          </p>

          <div className="mt-4 flex items-center">
            {/* 3 User Avatars overlapping */}
            <div className="flex -space-x-2">
              <div className={`size-8 rounded-full border-2 overflow-hidden bg-white ${isDark ? 'border-[#2A2040]' : 'border-[#A792FA]'}`}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mia" className="size-full" alt="user1" />
              </div>
              <div className={`size-8 rounded-full border-2 overflow-hidden bg-white ${isDark ? 'border-[#2A2040]' : 'border-[#A792FA]'}`}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Jack" className="size-full" alt="user2" />
              </div>
              <div className={`size-8 rounded-full border-2 overflow-hidden bg-white ${isDark ? 'border-[#2A2040]' : 'border-[#A792FA]'}`}>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Leo" className="size-full" alt="user3" />
              </div>
            </div>
            <div className={`flex size-8 -ml-2 items-center justify-center rounded-full border-2 text-[11px] font-bold ${isDark ? 'border-[#2A2040] bg-[#1e1635] text-[#c0b8d8]' : 'border-[#A792FA] bg-[#8973d9] text-[#1a1a1a]'}`}>
              +4
            </div>
          </div>
        </div>

        {/* 3D Geometric Graphic Approximation */}
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-[160px] h-[160px] pointer-events-none">
          <div className={`absolute right-6 top-2 size-[70px] rounded-full border-[20px] shadow-md ${isDark ? 'border-[#5a3800]' : 'border-[#FF8C00]'}`} />
          <div className={`absolute right-12 top-14 size-[70px] rounded-2xl rotate-12 shadow-lg ${isDark ? 'bg-[#3a3a40]' : 'bg-[#B0AFAF]'}`} />
          <div className={`absolute right-3 bottom-6 size-12 rounded-full border-[14px] shadow-sm ${isDark ? 'border-[#4a3800]' : 'border-[#FFD700]'}`} />
          <div className={`absolute right-[85px] bottom-[30px] size-[55px] rounded-full shadow-lg ${isDark ? 'bg-[#2a2e35]' : 'bg-[#4A5568]'}`} />
        </div>
      </motion.div>

      {/* ── Date Selector ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <WeekStrip />
      </motion.div>

      {/* ── Your Plan ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[22px] font-bold tracking-tight text-black dark:text-white">
            Your plan
          </h3>
          <button 
            onClick={() => {
              setShowInput(!showInput);
              if (!showInput) {
                setTimeout(() => inputRef.current?.focus(), 50);
              }
            }}
            className="flex size-10 items-center justify-center rounded-full bg-black/5 dark:bg-white/10 text-black dark:text-white transition-colors"
          >
            <Sparkles className="size-5" />
          </button>
        </div>

        {/* Interactive Prompt Input */}
        <AnimatePresence>
          {showInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="relative mb-4 flex items-center rounded-[2rem] bg-black/5 p-2 dark:bg-white/5 border border-black/5 dark:border-white/10 shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="e.g. 50 pushups, drink 8 glasses water..."
                  className="flex-1 bg-transparent px-4 py-2 text-[14px] font-medium text-black outline-none placeholder:text-black/40 dark:text-white dark:placeholder:text-white/40"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!inputText.trim()}
                  className="flex size-10 items-center justify-center rounded-full bg-black text-white disabled:opacity-30 dark:bg-white dark:text-black transition-opacity"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generated Tasks OR Hardcoded fallback */}
        {hydrated && tasks.length > 0 ? (
          <div className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {tasks.filter(t => !t.completed).map((task, i) => {
                const Card = CARD_COMPONENTS[task.cardType] || CARD_COMPONENTS["checklist"];
                return (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, height: 0, marginBottom: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Card task={task} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 h-[280px]">
            {/* Left Large Card - Orange */}
            <div className={`col-span-1 rounded-[2.5rem] p-5 flex flex-col relative overflow-hidden ${isDark ? 'bg-[#332810]' : 'bg-[#FFB84D]'}`}>
              <div className={`self-start rounded-full px-3.5 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-white/70' : 'bg-white/40 text-black/80'}`}>
                Medium
              </div>
              <div className="mt-8">
                <h4 className={`text-[22px] font-bold leading-[1.1] tracking-tight ${isDark ? 'text-[#f0dcc0]' : 'text-black'}`}>
                  Yoga<br />Group
                </h4>
                <div className={`mt-4 flex flex-col gap-0.5 text-[12px] font-medium ${isDark ? 'text-[#f0dcc0]/60' : 'text-black/70'}`}>
                  <span>25 Nov.</span>
                  <span>14:00-15:00</span>
                  <span>A5 room</span>
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2">
                <div className={`size-9 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-white/20'}`}>
                  <img src="https://api.dicebear.com/7.x/notionists/svg?seed=tiffany" className="size-full object-cover" alt="Trainer" />
                </div>
                <div className="flex flex-col">
                  <span className={`text-[9px] font-medium tracking-wide ${isDark ? 'text-white/50' : 'text-black/60'}`}>Trainer</span>
                  <span className={`text-[12px] font-bold leading-tight ${isDark ? 'text-[#f0dcc0]' : 'text-black'}`}>Tiffany Way</span>
                </div>
              </div>
              {/* Start routine button */}
              <button
                onClick={() => {
                  haptic("success");
                  setPlayerWorkout(PLAN_WORKOUTS.yoga);
                  setPlayerOpen(true);
                }}
                className="absolute inset-0 z-10 opacity-0"
                aria-label="Start Yoga routine"
              />
            </div>

            {/* Right Column (Stacked Cards) */}
            <div className="col-span-1 flex flex-col gap-4">
              {/* Top Right Card - Blue */}
              <div className={`flex-1 rounded-[2.5rem] p-5 relative overflow-hidden flex flex-col cursor-pointer ${isDark ? 'bg-[#1A2A3D]' : 'bg-[#A5C9FF]'}`}
                onClick={() => {
                  haptic("success");
                  setPlayerWorkout(PLAN_WORKOUTS.balance);
                  setPlayerOpen(true);
                }}
              >
                <div className={`self-start rounded-full px-3.5 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-white/70' : 'bg-white/40 text-black/80'}`}>
                  Light
                </div>
                <div className="mt-auto z-10 relative">
                  <h4 className={`text-[20px] font-bold leading-tight tracking-tight ${isDark ? 'text-[#c8daf0]' : 'text-black'}`}>
                    Balance
                  </h4>
                  <div className={`mt-1 flex flex-col text-[11px] font-medium ${isDark ? 'text-[#c8daf0]/60' : 'text-black/70'}`}>
                    <span>28 Nov.</span>
                    <span>18:00-19:30</span>
                    <span>A2 room</span>
                  </div>
                </div>
                {/* Abstract graphic */}
                <div className="absolute -right-2 -bottom-2 size-[110px] pointer-events-none">
                  <div className={`absolute right-4 top-0 size-[50px] rounded-full shadow-md ${isDark ? 'bg-[#4a3830]' : 'bg-[#E5B5A3]'}`} />
                  <div className={`absolute right-8 bottom-4 size-[40px] rounded-full shadow-md ${isDark ? 'bg-[#2a3a38]' : 'bg-[#4E7674]'}`} />
                  <div className={`absolute right-4 bottom-2 size-[22px] rounded-full shadow-sm ${isDark ? 'bg-[#4a3518]' : 'bg-[#F4A261]'}`} />
                </div>
              </div>

              {/* Bottom Right Card - Pink - launches first available feed workout */}
              <div className={`h-[76px] rounded-[2rem] flex items-center justify-center gap-3 ${isDark ? 'bg-[#3D2040]' : 'bg-[#FF85EA]'}`}>
                <button
                  onClick={() => {
                    haptic("success");
                    const firstWorkout = feedData?.pages?.[0]?.items?.[0];
                    if (firstWorkout) {
                      setPlayerWorkout(firstWorkout);
                      setPlayerOpen(true);
                    }
                  }}
                  className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-white text-white bg-transparent"
                >
                  <Play className="size-[20px] fill-white" />
                </button>
                <button className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-white text-white bg-transparent">
                  <Video className="size-[20px]" />
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Community Feed ── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col gap-6 mt-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-[22px] font-bold tracking-tight text-black dark:text-white">
            Community feed
          </h3>
        </div>

        {feedData?.pages.flatMap((page) => page.items).map((workout, index) => {
          const themes = isDark ? DARK_THEMES : VIBRANT_THEMES;
          const theme = themes[index % themes.length];
          return (
            <div 
              key={workout.id} 
              className="transition-colors"
            >
              <FeedCard workout={workout} theme={theme} />
            </div>
          );
        })}
        
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="h-14 w-full rounded-full bg-black/5 dark:bg-white/5 font-bold text-black/60 dark:text-white/60"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        )}
      </motion.div>

      {/* ── Routine Player ── */}
      {playerWorkout && (
        <RoutinePlayer
          workout={playerWorkout}
          open={playerOpen}
          onClose={() => {
            setPlayerOpen(false);
            setTimeout(() => setPlayerWorkout(null), 350);
          }}
        />
      )}
    </div>
  );
}
