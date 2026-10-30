import { create } from 'zustand';
import { Database } from '../types/database.types';

type Workout = Database['public']['Tables']['workouts']['Row'];

interface CreatorStore {
  // A dictionary (map) to hold the workouts the user is currently building or editing
  draftWorkouts: Record<string, Workout>;
  
  // Action to add or update a workout instantly in the UI (Optimistic update)
  addOptimisticWorkout: (workout: Workout) => void;
  
  // Action to remove a workout from the local drafts
  removeDraftWorkout: (workoutId: string) => void;
  
  // Clear all drafts when exiting the studio
  clearDrafts: () => void;
}

export const useCreatorStore = create<CreatorStore>((set) => ({
  draftWorkouts: {},
  
  addOptimisticWorkout: (workout) => set((state) => ({
    draftWorkouts: { 
      ...state.draftWorkouts, 
      [workout.id]: workout 
    }
  })),
  
  removeDraftWorkout: (workoutId) => set((state) => {
    const newDrafts = { ...state.draftWorkouts };
    delete newDrafts[workoutId];
    return { draftWorkouts: newDrafts };
  }),
  
  clearDrafts: () => set({ draftWorkouts: {} }),
}));
