"use client";

import { useMemo } from "react";
import { ChevronRight, Flame } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { usePetStore } from "@/stores/pet-store";
import { cn } from "@/lib/utils";

export function CalendarSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const streak = usePetStore((s) => s.streak);
  const today = new Date();
  
  // Calculate month data
  const { monthName, days } = useMemo(() => {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const name = monthNames[today.getMonth()];
    
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get the first day of the month (0 = Sun, 1 = Mon, ..., 6 = Sat)
    const firstDayDate = new Date(year, month, 1);
    let firstDayIndex = firstDayDate.getDay();
    // Convert to Monday-first (0 = Mon, 6 = Sun) to match reference image
    firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayDate = today.getDate();
    
    const calendarDays = [];
    
    // Add empty slots for the start of the month
    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push({ empty: true });
    }
    
    // Add the actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = i === todayDate;
      const daysAgo = todayDate - i;
      const isCompleted = daysAgo > 0 && daysAgo <= streak;
      
      calendarDays.push({
        empty: false,
        dateNum: i,
        isToday,
        isCompleted,
      });
    }
    
    return { monthName: name, days: calendarDays };
  }, [streak]); // Recalculate if streak changes

  return (
    <Sheet open={open} onClose={onClose} label="Calendar">
      <div className="flex flex-col h-full w-full mt-2">
        <h2 className="text-2xl font-bold text-ink dark:text-snow mb-4 px-2">
          In Progress
        </h2>
        
        {/* Calendar Card */}
        <div className="bg-[#b2a4ff] rounded-[2rem] p-5 w-full">
          {/* Header */}
          <div className="flex justify-between items-center mb-6 px-1">
            <span className="text-[17px] font-bold text-[#1a1a1a]">
              {monthName}
            </span>
            <button className="text-[#1a1a1a] opacity-60">
              <ChevronRight className="size-5" />
            </button>
          </div>
          
          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1.5 mb-3 px-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div key={day} className="text-center text-[11px] font-bold text-[#1a1a1a] opacity-60">
                {day}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="grid grid-cols-7 gap-1.5 px-1">
            {days.map((day, idx) => {
              if (day.empty) {
                return <div key={`empty-${idx}`} className="size-[42px]" />;
              }
              
              if (day.isCompleted) {
                return (
                  <div 
                    key={`day-${day.dateNum}`}
                    className="size-[42px] rounded-[1rem] bg-[#1a1a1a] flex items-center justify-center shadow-sm"
                  >
                    <Flame className="size-5 text-[#FFD700] fill-[#FFD700]" />
                  </div>
                );
              }
              
              if (day.isToday) {
                return (
                  <div 
                    key={`day-${day.dateNum}`}
                    className="size-[42px] rounded-[1rem] bg-[#1a1a1a] flex items-center justify-center shadow-sm"
                  >
                    <span className="text-[14px] font-bold text-white">{day.dateNum}</span>
                  </div>
                );
              }
              
              return (
                <div 
                  key={`day-${day.dateNum}`}
                  className="size-[42px] rounded-[1rem] bg-white flex items-center justify-center shadow-sm"
                >
                  <span className="text-[14px] font-bold text-[#1a1a1a]">{day.dateNum}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Sheet>
  );
}
