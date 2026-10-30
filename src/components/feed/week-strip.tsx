"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { usePetStore } from "@/stores/pet-store";
import { cn } from "@/lib/utils";
import { haptic } from "@/lib/haptics";
import { CalendarSheet } from "./calendar-sheet";

/**
 * WeekStrip — Day-of-week calendar with star badges for completed days.
 * Inspired by the Move/Sync reference (Image 3).
 */
export function WeekStrip() {
  const [hydrated, setHydrated] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const streak = usePetStore((s) => s.streak);
  const lastVisit = usePetStore((s) => s.lastVisit);
  useEffect(() => setHydrated(true), []);

  const today = new Date();
  const todayDay = today.getDay(); // 0 = Sun

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Build the week with completion status
  const week = DAYS.map((label, i) => {
    const isToday = i === todayDay;
    // Days before today within streak range are "completed"
    const daysAgo = (todayDay - i + 7) % 7;
    const completed = hydrated && daysAgo > 0 && daysAgo <= streak;
    const isFuture = i > todayDay;

    // Get date number for this day of the week
    const date = new Date(today);
    date.setDate(today.getDate() - (todayDay - i));
    const dateNum = date.getDate();

    return { label, dateNum, isToday, completed, isFuture };
  });

  return (
    <>
      <button 
        type="button"
        onClick={() => {
          haptic("light");
          setCalendarOpen(true);
        }}
        className="flex items-center justify-between w-full outline-none"
      >
        {week.map((day, i) => (
          <div key={i} className="flex flex-col items-center pointer-events-none">
          <motion.div
            className={cn(
              "relative flex flex-col items-center justify-center gap-1 rounded-full p-2 w-[46px] h-[72px] border",
              day.isToday
                ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                : "bg-white text-black border-black/10 dark:bg-black dark:text-white dark:border-white/20"
            )}
            whileTap={{ scale: 0.95 }}
          >
            {/* Dot (could represent completed, here just for visual match) */}
            <div
              className={cn(
                "size-1.5 rounded-full",
                day.isToday ? "bg-white dark:bg-black" : "bg-black/40 dark:bg-white/40"
              )}
            />
            {/* Day label */}
            <span
              className={cn(
                "text-[11px] font-medium tracking-tight",
                day.isToday ? "text-white dark:text-black" : "text-black/40 dark:text-white/40"
              )}
            >
              {day.label}
            </span>
            {/* Date circle/text */}
            <span
              className={cn(
                "text-[15px] font-semibold tracking-tight",
                day.isToday ? "text-white dark:text-black" : "text-black dark:text-white"
              )}
            >
              {day.dateNum}
            </span>
          </motion.div>
        </div>
      ))}
      </button>

      <CalendarSheet 
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />
    </>
  );
}
