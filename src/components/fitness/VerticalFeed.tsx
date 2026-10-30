"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Flame,
  Clock,
  Zap,
  Sparkles,
  CheckCircle2,
  MoreHorizontal
} from "lucide-react";
import { WorkoutPost } from "@/data/mock-fitness-data";
import { haptic } from "@/lib/haptics";

/* ─── Workout type detection & color coding ─────────────────────── */
type WorkoutType = { label: string; color: string; bgColor: string; borderColor: string };

const WORKOUT_TYPES: { keywords: string[]; type: WorkoutType }[] = [
  {
    keywords: ["hiit", "torch", "explosive", "plyometric", "cardio", "burpee"],
    type: { label: "HIIT", color: "#FF6B6B", bgColor: "rgba(255,107,107,0.15)", borderColor: "rgba(255,107,107,0.3)" },
  },
  {
    keywords: ["yoga", "flow", "mobility", "stretch", "flexibility", "recovery", "active recovery"],
    type: { label: "Yoga & Flow", color: "#FFB347", bgColor: "rgba(255,179,71,0.15)", borderColor: "rgba(255,179,71,0.3)" },
  },
  {
    keywords: ["strength", "hypertrophy", "deadlift", "squat", "bench", "lift", "back", "bicep", "muscle", "power"],
    type: { label: "Strength", color: "#68B5E8", bgColor: "rgba(104,181,232,0.15)", borderColor: "rgba(104,181,232,0.3)" },
  },
  {
    keywords: ["run", "tempo", "sprint", "marathon", "jog", "endurance"],
    type: { label: "Running", color: "#6fe3b1", bgColor: "rgba(111,227,177,0.15)", borderColor: "rgba(111,227,177,0.3)" },
  },
  {
    keywords: ["core", "ab", "plank", "crunch", "oblique"],
    type: { label: "Core", color: "#FF69B4", bgColor: "rgba(255,105,180,0.15)", borderColor: "rgba(255,105,180,0.3)" },
  },
  {
    keywords: ["calisthenics", "muscle-up", "pull-up", "bodyweight", "kettlebell"],
    type: { label: "Calisthenics", color: "#9B59B6", bgColor: "rgba(155,89,182,0.15)", borderColor: "rgba(155,89,182,0.3)" },
  },
];

function detectWorkoutType(title: string, description: string): WorkoutType {
  const text = `${title} ${description}`.toLowerCase();
  for (const entry of WORKOUT_TYPES) {
    for (const kw of entry.keywords) {
      if (text.includes(kw)) return entry.type;
    }
  }
  // Default
  return { label: "Workout", color: "#8b5cf6", bgColor: "rgba(139,92,246,0.15)", borderColor: "rgba(139,92,246,0.3)" };
}

interface VerticalFeedProps {
  posts: WorkoutPost[];
  onStartWorkout?: (post: WorkoutPost) => void;
}

export function VerticalFeed({ posts, onStartWorkout }: VerticalFeedProps) {
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    haptic("light");
    setLikedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleBookmark = (id: string) => {
    haptic("selection");
    setBookmarkedPosts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex flex-col gap-7 pb-12">
      {posts.map((post, i) => {
        const isLiked = !!likedPosts[post.id];
        const isBookmarked = !!bookmarkedPosts[post.id];

        // Parse likes into numeric format for dynamic update
        const rawLikes = parseFloat(post.metrics.likes.replace("k", "")) * (post.metrics.likes.includes("k") ? 1000 : 1);
        const currentLikesCount = isLiked ? rawLikes + 1 : rawLikes;
        const formattedLikes = currentLikesCount >= 1000 ? `${(currentLikesCount / 1000).toFixed(1)}k` : currentLikesCount;

        const workoutType = detectWorkoutType(post.contentTitle, post.contentDescription);

        return (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="group relative overflow-hidden rounded-[2.2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-2xl transition-all duration-300 hover:shadow-purple-500/10"
            style={{ borderLeft: `3px solid ${workoutType.color}` }}
          >
            {/* Author Header */}
            <div className="p-4 flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-cyan-400">
                  <img
                    src={post.authorAvatarUrl}
                    alt={post.authorName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-zinc-900"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-zinc-900" />
                </div>
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-ink dark:text-snow leading-snug">
                      {post.authorName}
                    </span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/20" />
                  </div>
                  <span className="text-[11px] font-semibold text-ink/50 dark:text-snow/45">
                    {post.timestamp} · Community Trainer
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="p-2 rounded-full text-ink/45 dark:text-snow/40 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>

            {/* Media Canvas with Stats Badges */}
            <div className="aspect-[4/4.5] w-full relative overflow-hidden bg-zinc-900 group">
              <img
                src={post.thumbnailUrl}
                alt={post.contentTitle}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
              />

              {/* Gradient Dark Scrims */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-60" />

              {/* Top Media Tags */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <span
                  className="flex items-center gap-1 px-3 py-1 rounded-full backdrop-blur-md border text-[11px] font-extrabold uppercase tracking-wider"
                  style={{
                    backgroundColor: workoutType.bgColor,
                    borderColor: workoutType.borderColor,
                    color: workoutType.color,
                  }}
                >
                  <Zap className="w-3 h-3" style={{ color: workoutType.color, fill: workoutType.bgColor }} />
                  {workoutType.label}
                </span>

                <button
                  type="button"
                  onClick={() => toggleBookmark(post.id)}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all ${
                    isBookmarked
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/40"
                      : "bg-black/40 text-white/80 hover:bg-black/60"
                  }`}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} />
                </button>
              </div>

              {/* Bottom Media Title Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-left">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                    <Clock className="w-3 h-3" /> 25 MIN
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-amber-500/30">
                    <Flame className="w-3 h-3" /> 340 KCAL
                  </span>
                </div>

                <h3 className="text-xl font-extrabold text-white leading-tight drop-shadow-md">
                  {post.contentTitle}
                </h3>
              </div>
            </div>

            {/* Content & Action Bar */}
            <div className="p-5 flex flex-col gap-4 text-left">
              <p className="text-xs text-ink/75 dark:text-snow/75 leading-relaxed font-medium">
                {post.contentDescription}
              </p>

              {/* Social Metrics & Launch Action */}
              <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center gap-4 text-ink dark:text-snow">
                  {/* Like Button */}
                  <button
                    type="button"
                    onClick={() => toggleLike(post.id)}
                    className="flex items-center gap-1.5 group cursor-pointer"
                  >
                    <motion.div
                      whileTap={{ scale: 1.4 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className={`p-2 rounded-full transition-colors ${
                        isLiked
                          ? "bg-rose-500/15 text-rose-500"
                          : "text-ink/60 dark:text-snow/60 group-hover:bg-rose-500/10 group-hover:text-rose-500"
                      }`}
                    >
                      <Heart className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} />
                    </motion.div>
                    <span className={`text-xs font-bold ${isLiked ? "text-rose-500" : "text-ink/70 dark:text-snow/70"}`}>
                      {formattedLikes}
                    </span>
                  </button>

                  {/* Comment Button */}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 group cursor-pointer text-ink/60 dark:text-snow/60 hover:text-cyan-500 transition-colors"
                  >
                    <div className="p-2 rounded-full group-hover:bg-cyan-500/10 transition-colors">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-ink/70 dark:text-snow/70">
                      {post.metrics.comments}
                    </span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    className="flex items-center gap-1.5 group cursor-pointer text-ink/60 dark:text-snow/60 hover:text-purple-500 transition-colors"
                  >
                    <div className="p-2 rounded-full group-hover:bg-purple-500/10 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-ink/70 dark:text-snow/70">
                      {post.metrics.shares}
                    </span>
                  </button>
                </div>

                {/* Primary Action Button: Start Workout */}
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    haptic("success");
                    if (onStartWorkout) onStartWorkout(post);
                  }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 dark:from-purple-500 dark:via-indigo-500 dark:to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-purple-500/30 cursor-pointer outline-none"
                >
                  <Play className="w-4 h-4" fill="currentColor" />
                  <span>Start Workout</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
