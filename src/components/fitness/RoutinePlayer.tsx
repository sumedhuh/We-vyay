import React from 'react';
import type { Workout } from "@/db/schema";
import { ActiveWorkoutScreen } from './ActiveWorkoutScreen';
import type { Exercise } from '../../hooks/useWorkoutMachine';
import { AnimatePresence, motion } from 'framer-motion';

export function RoutinePlayer({
  workout,
  open,
  onClose,
}: {
  workout: Workout;
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  // Map the database ExerciseRow into the Exercise format expected by useWorkoutMachine
  const exercises: Exercise[] = (workout.exercises || []).map((ex: any, i: number) => {
    const isTime = ex.mode === 'time' || (ex.reps && ex.reps.includes('s'));
    return {
      id: `ex-${i}`,
      name: ex.name,
      kind: isTime ? 'timed' : 'reps',
      sets: ex.sets || 3,
      targetReps: isTime ? undefined : parseInt(ex.reps) || 12,
      targetSeconds: isTime ? parseInt(ex.reps) || 60 : undefined,
      restSeconds: 30,
      cues: [],
      mediaSrc: '',
      rawRow: ex
    };
  });

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-[var(--bg)]"
        >
          {exercises.length > 0 ? (
            <ActiveWorkoutScreen exercises={exercises} onClose={onClose} />
          ) : (
             <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500">
               <p>No exercises found in this workout.</p>
               <button onClick={onClose} className="px-6 py-2 bg-slate-200 rounded-full font-bold">Close</button>
             </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

