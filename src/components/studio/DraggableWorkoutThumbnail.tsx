"use client";

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Database } from "../../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];

interface Props {
  workout: Workout;
}

export function DraggableWorkoutThumbnail({ workout }: Props) {
  // Hook up dnd-kit for silky smooth drag-and-drop
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: workout.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Add a nice visual pop when actively dragging
    scale: isDragging ? 1.05 : 1, 
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        relative w-32 h-32 rounded-2xl overflow-hidden cursor-grab shadow-lg
        border-2 transition-colors duration-200 bg-neutral-900
        ${isDragging ? "border-emerald-500 shadow-emerald-500/20" : "border-neutral-800 hover:border-neutral-600"}
      `}
    >
      {/* 1. Static Snapshot of 3D Animation */}
      {workout.thumbnail_url && (
        <img
          src={workout.thumbnail_url}
          alt={workout.name}
          className="absolute inset-0 w-full h-full object-cover opacity-80"
          draggable={false} // Important: prevents default browser ghost image dragging
        />
      )}

      {/* 2. Emoji Overlay */}
      <div className="absolute top-2 right-2 flex gap-1 bg-black/60 px-2 py-1 rounded-full backdrop-blur-md">
        {workout.emojis && workout.emojis.length > 0 ? (
          workout.emojis.map((emoji, index) => (
            <span key={index} className="text-sm leading-none">{emoji}</span>
          ))
        ) : (
          <span className="text-sm leading-none">🏋️</span>
        )}
      </div>

      {/* 3. Workout Name overlay (Dynamic Gradient for readability) */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-8">
        <p className="text-white text-xs font-bold truncate drop-shadow-md">
          {workout.name}
        </p>
      </div>
    </div>
  );
}
