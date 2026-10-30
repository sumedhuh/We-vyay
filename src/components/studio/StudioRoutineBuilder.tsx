"use client";

import React, { useState } from "react";
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  arrayMove 
} from "@dnd-kit/sortable";
import { DraggableWorkoutThumbnail } from "./DraggableWorkoutThumbnail";
import type { Database } from "../../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Row"];

interface Props {
  initialWorkouts: Workout[];
}

export function StudioRoutineBuilder({ initialWorkouts }: Props) {
  const [workouts, setWorkouts] = useState(initialWorkouts);

  // Configure sensors to ensure scrolling works on mobile without instantly triggering a drag
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setWorkouts((items) => {
        const oldIndex = items.findIndex((w) => w.id === active.id);
        const newIndex = items.findIndex((w) => w.id === over.id);
        // This utility beautifully animates the array swap
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="w-full bg-black/40 backdrop-blur-xl p-6 rounded-[2rem] border border-white/10 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-white text-sm font-black tracking-widest flex items-center gap-2">
          <span className="text-emerald-400 text-lg">⚡</span> ROUTINE SEQUENCE
        </h3>
        <span className="text-white/40 text-xs font-bold bg-white/5 px-3 py-1 rounded-full">
          {workouts.length} EXERCISES
        </span>
      </div>
      
      {/* Horizontal Drag and Drop List */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext 
            items={workouts.map(w => w.id)} 
            strategy={horizontalListSortingStrategy}
          >
            {workouts.map((workout) => (
              <DraggableWorkoutThumbnail key={workout.id} workout={workout} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
