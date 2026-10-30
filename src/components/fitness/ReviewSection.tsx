"use client";

import React from "react";
import { motion } from "framer-motion";
import { Star, MessageSquareQuote, CheckCircle2, Sparkles } from "lucide-react";
import { Review } from "@/data/mock-fitness-data";

interface ReviewSectionProps {
  reviews: Review[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  const avgRating = reviews.reduce((acc, rev) => acc + rev.starRating, 0) / reviews.length;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((r) => Math.round(r.starRating) === stars).length;
    return {
      stars,
      count,
      percentage: (count / reviews.length) * 100,
    };
  });

  return (
    <section className="py-6 text-left">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-cyan-500/20 text-purple-600 dark:text-purple-300 border border-purple-300/40">
            <MessageSquareQuote className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-ink dark:text-snow leading-none">
              Community Reviews
            </h2>
            <p className="text-xs font-semibold text-ink/50 dark:text-snow/45 mt-1">
              Real feedback from active athletes
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          <Sparkles className="w-3 h-3 text-amber-400" />
          98% Satisfaction
        </span>
      </div>

      {/* Aggregate Score Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-6 rounded-[2rem] bg-white/70 dark:bg-zinc-900/70 backdrop-blur-2xl border border-black/5 dark:border-white/10 shadow-xl">
        <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-black/[0.06] dark:border-white/[0.08] pb-4 md:pb-0 pr-0 md:pr-6">
          <span className="text-5xl font-black tracking-tight text-ink dark:text-snow">
            {avgRating.toFixed(1)}
          </span>
          <div className="flex text-amber-400 my-2 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-4 h-4"
                fill={i < Math.floor(avgRating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-xs text-ink/60 dark:text-snow/55 font-bold">
            Based on {reviews.length} Verified Reviews
          </span>
        </div>

        <div className="md:col-span-2 flex flex-col gap-2 justify-center">
          {distribution.map((dist) => (
            <div key={dist.stars} className="flex items-center gap-3 text-xs font-bold text-ink/60 dark:text-snow/55">
              <span className="w-3 text-right">{dist.stars}</span>
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <div className="flex-1 h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${dist.percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 * dist.stars }}
                  className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full"
                />
              </div>
              <span className="w-8 text-left text-[11px] font-semibold opacity-70">
                {dist.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal Scrollable Review Cards */}
      <div className="flex overflow-x-auto gap-4 pb-6 no-scrollbar snap-x pt-1">
        {reviews.map((review, idx) => (
          <motion.div
            key={review.reviewId}
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: idx * 0.08 }}
            className="surface min-w-[290px] max-w-[310px] p-5 rounded-3xl snap-start flex flex-col justify-between border border-black/5 dark:border-white/10 shadow-lg hover:border-purple-400/40 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={review.avatarUrl}
                      alt={review.username}
                      className="w-10 h-10 rounded-full object-cover border border-purple-300/40"
                    />
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-500 fill-cyan-500/20 absolute -bottom-0.5 -right-0.5" />
                  </div>
                  <div className="flex flex-col">
                    <h4 className="font-extrabold text-sm text-ink dark:text-snow leading-tight">
                      {review.username}
                    </h4>
                    <span className="text-[11px] font-medium text-ink/50 dark:text-snow/45">
                      {review.datePosted}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex text-amber-400 mb-3 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5"
                    fill={i < Math.floor(review.starRating) ? "currentColor" : "none"}
                  />
                ))}
              </div>

              <p className="text-xs text-ink/80 dark:text-snow/80 leading-relaxed font-medium">
                "{review.reviewText}"
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-[10px] font-bold text-purple-600 dark:text-purple-300">
              <span>Verified Athlete</span>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/10">Helpful</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
