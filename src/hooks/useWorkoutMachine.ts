import { useReducer, useEffect } from 'react';
import { Haptics } from '../services/haptics';
import { AudioService } from '../services/audio';
import type { ExerciseRow } from '@/db/schema';

export type Phase = 'ready' | 'work' | 'rest' | 'paused' | 'complete';
export type WorkKind = 'reps' | 'timed';

export interface FormCue { id: string; text: string; icon: string; priority: 1 | 2 | 3; severity: 'info' | 'warn'; triggerAt?: number }

export interface Exercise {
  id: string;
  name: string;
  kind: WorkKind;
  sets: number;
  targetReps?: number;
  targetSeconds?: number;
  weight?: { value: number; unit: 'kg' | 'lb' };
  lastTime?: { weight?: number; reps?: number; seconds?: number };
  restSeconds: number;
  cues: FormCue[];
  tempo?: { down: number; pause: number; up: number; top: number };
  mediaSrc: string;
  rawRow?: ExerciseRow;
}

export interface WorkoutState {
  phase: Phase;
  resumePhase?: Exclude<Phase, 'paused'>;
  exerciseIndex: number;
  setIndex: number;
  direction: 1 | -1;
  timerEndsAt?: number;
  loggedSets: Array<{ exerciseId: string; setIndex: number; reps?: number; seconds?: number; weight?: number }>;
  skipped: string[];
  lastAction?: { type: string; payload?: any; prevState: WorkoutState };
  undoToastVisible: boolean;
}

type Action = 
  | { type: 'START' }
  | { type: 'TICK' }
  | { type: 'DONE_SET' }
  | { type: 'SKIP_REST' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SEEK_BACKWARD' }
  | { type: 'SEEK_FORWARD' }
  | { type: 'SKIP_EXERCISE' }
  | { type: 'UNDO' }
  | { type: 'HIDE_UNDO' };

export function useWorkoutMachine(exercises: Exercise[]) {
  const initialState: WorkoutState = {
    phase: 'ready',
    exerciseIndex: 0,
    setIndex: 0,
    direction: 1,
    timerEndsAt: Date.now() + 3000,
    loggedSets: [],
    skipped: [],
    undoToastVisible: false,
  };

  const reducer = (state: WorkoutState, action: Action): WorkoutState => {
    const ex = exercises[state.exerciseIndex];
    if (!ex) return state;

    switch (action.type) {
      case 'START':
        return { ...state, phase: 'work', timerEndsAt: ex.kind === 'timed' ? Date.now() + (ex.targetSeconds || 0) * 1000 : undefined };
      case 'DONE_SET': {
        const isLastSet = state.setIndex >= ex.sets - 1;
        const isLastEx = state.exerciseIndex >= exercises.length - 1;
        
        const logged = [...state.loggedSets, { exerciseId: ex.id, setIndex: state.setIndex }];
        
        if (isLastSet && isLastEx) {
          return { ...state, phase: 'complete', loggedSets: logged, lastAction: { type: action.type, prevState: state }, undoToastVisible: true };
        }
        
        if (isLastSet) {
          return {
            ...state,
            phase: 'rest',
            timerEndsAt: Date.now() + ex.restSeconds * 1000,
            loggedSets: logged,
            lastAction: { type: action.type, prevState: state },
            undoToastVisible: true,
          };
        }
        
        return {
          ...state,
          phase: 'rest',
          timerEndsAt: Date.now() + ex.restSeconds * 1000,
          loggedSets: logged,
          lastAction: { type: action.type, prevState: state },
          undoToastVisible: true,
        };
      }
      case 'SKIP_REST': {
        const isLastSet = state.setIndex >= ex.sets - 1;
        if (isLastSet) {
          return {
            ...state,
            phase: 'ready',
            exerciseIndex: state.exerciseIndex + 1,
            setIndex: 0,
            direction: 1,
            timerEndsAt: Date.now() + 3000,
            undoToastVisible: false,
          };
        }
        return {
          ...state,
          phase: 'work',
          setIndex: state.setIndex + 1,
          timerEndsAt: ex.kind === 'timed' ? Date.now() + (ex.targetSeconds || 0) * 1000 : undefined,
          undoToastVisible: false,
        };
      }
      case 'PAUSE':
        if (state.phase === 'paused') return state;
        return { ...state, phase: 'paused', resumePhase: state.phase, timerEndsAt: state.timerEndsAt ? state.timerEndsAt - Date.now() : undefined };
      case 'RESUME':
        return { ...state, phase: state.resumePhase || 'ready', resumePhase: undefined, timerEndsAt: state.timerEndsAt ? Date.now() + state.timerEndsAt : undefined };
      case 'SEEK_BACKWARD': {
        if (state.phase === 'paused') {
          return {
            ...state,
            timerEndsAt: state.timerEndsAt ? state.timerEndsAt + 10000 : undefined,
          };
        }
        if (state.phase === 'work' && ex.kind === 'timed' && state.timerEndsAt) {
          return {
            ...state,
            timerEndsAt: state.timerEndsAt + 10000,
          };
        }
        if (state.phase === 'rest' && state.timerEndsAt) {
          return {
            ...state,
            timerEndsAt: state.timerEndsAt + 10000,
          };
        }
        if (state.setIndex > 0) {
          return {
            ...state,
            setIndex: state.setIndex - 1,
            phase: 'work',
          };
        }
        if (state.exerciseIndex > 0) {
          const prevEx = exercises[state.exerciseIndex - 1];
          return {
            ...state,
            exerciseIndex: state.exerciseIndex - 1,
            setIndex: 0,
            phase: 'work',
            direction: -1,
            timerEndsAt: prevEx.kind === 'timed' ? Date.now() + (prevEx.targetSeconds || 30) * 1000 : undefined,
          };
        }
        return state;
      }
      case 'SEEK_FORWARD': {
        if (state.phase === 'paused') {
          if (state.timerEndsAt) {
            const rem = state.timerEndsAt - 10000;
            if (rem <= 0) {
              return reducer({ ...state, timerEndsAt: 0 }, { type: 'RESUME' });
            }
            return { ...state, timerEndsAt: rem };
          }
          return state;
        }
        if (state.phase === 'work' && ex.kind === 'timed' && state.timerEndsAt) {
          const remMs = state.timerEndsAt - Date.now();
          if (remMs <= 10000) {
            return reducer(state, { type: 'DONE_SET' });
          }
          return {
            ...state,
            timerEndsAt: state.timerEndsAt - 10000,
          };
        }
        if (state.phase === 'rest') {
          if (state.timerEndsAt) {
            const remMs = state.timerEndsAt - Date.now();
            if (remMs <= 10000) {
              return reducer(state, { type: 'SKIP_REST' });
            }
            return {
              ...state,
              timerEndsAt: state.timerEndsAt - 10000,
            };
          }
          return reducer(state, { type: 'SKIP_REST' });
        }
        return reducer(state, { type: 'DONE_SET' });
      }
      case 'SKIP_EXERCISE':
        if (state.exerciseIndex >= exercises.length - 1) return { ...state, phase: 'complete' };
        return {
          ...state,
          phase: 'ready',
          exerciseIndex: state.exerciseIndex + 1,
          setIndex: 0,
          direction: 1,
          timerEndsAt: Date.now() + 3000,
          skipped: [...state.skipped, ex.id],
          lastAction: { type: action.type, prevState: state },
          undoToastVisible: true,
        };
      case 'UNDO':
        if (state.lastAction) {
          return { ...state.lastAction.prevState, undoToastVisible: false };
        }
        return state;
      case 'HIDE_UNDO':
        return { ...state, undoToastVisible: false };
      case 'TICK': {
        if (state.phase === 'paused' || state.phase === 'complete' || (state.phase === 'work' && ex.kind === 'reps')) return state;
        if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
          // Auto-advance
          if (state.phase === 'ready') {
            return reducer(state, { type: 'START' });
          }
          if (state.phase === 'work' && ex.kind === 'timed') {
             return reducer(state, { type: 'DONE_SET' });
          }
          if (state.phase === 'rest') {
             return reducer(state, { type: 'SKIP_REST' });
          }
        }
        return state;
      }
      default:
        return state;
    }
  };

  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'TICK' });
    }, 100);
    return () => clearInterval(interval);
  }, [exercises]);

  return { state, dispatch };
}
