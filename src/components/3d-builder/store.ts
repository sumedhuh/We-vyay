import { create } from "zustand";
import { PRESETS, DEFAULT_PLANK, type AnimConfig, type PresetId } from "./animations";
import { GYM_SEQUENCES } from "./gymExercises";
import { makeBlock, makeExerciseInstance, type WorkoutBlock, type BuilderExercise } from "./data";
import {
  makeWorkout, clonePose, kf, SEQUENCES, FACE_SEQUENCES, mirrorPose, zeroPose, POSE_LIBRARY,
  facePosePresets,
  type Workout, type Keyframe, type Pose, type PoseKey, type Ease, type BreathConfig, type WorkoutMode,
} from "./pose";

// live animation readouts (mutated at 60fps inside the Canvas, polled by the UI)
export const liveStats = {
  mode: "plank" as "plank" | "supine",
  effort: 0,
  plankDepth: 0,
  curl: 0,
  legRaise: 0,
  kneeDrive: 0,
  jointAngle: 170,
  jointLabel: "ELBOW",
  shoulderHeight: 0.6,
  phase: "top" as string,
  phaseFrac: 0,
  velocity: 0,
  kfName: "" as string,
  kfIndex: 0,
  kfTotal: 1,
};

export type CameraPreset = "hero" | "side" | "front" | "top" | "low" | "back" | "close";

const SAVED_KEY = "pushup3d-workouts-v2";

function loadSaved(): Workout[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}
function persist(list: Workout[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-rep", name: "First Blood", desc: "Complete your first rep", icon: "🎯" },
  { id: "reps-10", name: "Warming Up", desc: "Complete 10 reps", icon: "🔥" },
  { id: "reps-25", name: "On Fire", desc: "Complete 25 reps", icon: "⚡" },
  { id: "reps-50", name: "Machine", desc: "Complete 50 reps", icon: "🤖" },
  { id: "combo-3", name: "Combo ×3", desc: "Chain 3 quick reps", icon: "💥" },
  { id: "combo-5", name: "Combo ×5", desc: "Chain 5 quick reps", icon: "🌪️" },
  { id: "level-2", name: "Level Up", desc: "Reach level 2", icon: "⭐" },
  { id: "speedster", name: "Speedster", desc: "Train at 1.5× speed", icon: "🚀" },
];

export const XP_PER_REP = 25;
export const COMBO_WINDOW_MS = 4000;
export const xpForLevel = (level: number) => level * 500;

export interface PushupState {
  uiTheme: "gamer" | "pastel";
  playing: boolean;
  speed: number;
  reps: number;
  // gamification
  xp: number;
  level: number;
  streak: number;
  goal: number;
  combo: number;
  bestCombo: number;
  lastRepAt: number;
  lastGain: { xp: number; combo: number; key: number } | null;
  levelUpFlash: { level: number; key: number } | null;
  newAchievement: { id: string; key: number } | null;
  achievements: string[];
  dismissLevelUp: () => void;
  dismissAchievement: () => void;
  setGoal: (v: number) => void;
  autoRotate: boolean;
  cameraPreset: CameraPreset;
  skinTone: string;
  shirtColor: string;
  shortsColor: string;
  showGrid: boolean;
  showTrail: boolean;
  showAngles: boolean;
  showAnalysis: boolean;
  showBreath: boolean;
  slowMo: boolean;
  // preset (built-in) motion
  presetId: PresetId | "custom";
  anim: AnimConfig;
  // studio / custom workout
  useCustom: boolean;
  workout: Workout;
  selectedKF: number;
  setMode: (m: WorkoutMode) => void;
  savedWorkouts: Workout[];
  studioOpen: boolean;
  // appearance panel
  colorPanelOpen: boolean;
  setColorPanelOpen: (v: boolean) => void;
  // actions
  setPlaying: (v: boolean) => void;
  togglePlaying: () => void;
  setSpeed: (v: number) => void;
  incrementReps: () => void;
  resetReps: () => void;
  setAutoRotate: (v: boolean) => void;
  setCameraPreset: (v: CameraPreset) => void;
  setSkinTone: (v: string) => void;
  setShirtColor: (v: string) => void;
  setShortsColor: (v: string) => void;
  setShowGrid: (v: boolean) => void;
  setShowTrail: (v: boolean) => void;
  setShowAngles: (v: boolean) => void;
  setShowAnalysis: (v: boolean) => void;
  setShowBreath: (v: boolean) => void;
  setSlowMo: (v: boolean) => void;
  setUiTheme: (v: "gamer" | "pastel") => void;
  applyPreset: (id: PresetId) => void;
  setAnim: (patch: Partial<AnimConfig>) => void;
  setBase: (base: AnimConfig["base"]) => void;
  // studio
  setStudioOpen: (v: boolean) => void;
  setUseCustom: (v: boolean) => void;
  setWorkout: (patch: Partial<Workout>) => void;
  setName: (v: string) => void;
  patchPose: (patch: Partial<Pose>) => void;
  patchSelected: (patch: Partial<Keyframe>) => void;
  selectKF: (i: number) => void;
  addKF: (name?: string) => void;
  dupKF: (i?: number) => void;
  delKF: (i?: number) => void;
  moveKF: (i: number, dir: -1 | 1) => void;
  stampPose: (poseId: string) => void;
  loadSequence: (seqId: string) => void;
  mirrorKF: () => void;
  resetKF: () => void;
  setBreath: (patch: Partial<BreathConfig>) => void;
  newWorkout: () => void;
  saveWorkout: () => void;
  loadWorkout: (id: string) => void;
  deleteWorkout: (id: string) => void;
}

export const SKIN_TONES = ["#8d5a3b", "#c6865a", "#6b4226", "#e8b48c", "#4a2f1d"];
export const SHIRT_COLORS = ["#ffc32b", "#ff4d2e", "#c6ff2e", "#8b5cf6", "#22d3ee", "#f4f1e8"];
export const SHORTS_COLORS = ["#f3f4f6", "#111827", "#1e293b", "#3f3f46", "#052e16"];

const updKF = (w: Workout, i: number, patch: Partial<Keyframe>): Workout => ({
  ...w,
  keyframes: w.keyframes.map((k, j) => (j === i ? { ...k, ...patch } : k)),
});

export const usePushupStore = create<PushupState>((set) => ({
  uiTheme: "gamer",
  playing: true,
  speed: 1,
  reps: 0,
  xp: 0,
  level: 1,
  streak: 1,
  goal: 30,
  combo: 0,
  bestCombo: 0,
  lastRepAt: 0,
  lastGain: null,
  levelUpFlash: null,
  newAchievement: null,
  achievements: [],
  dismissLevelUp: () => set({ levelUpFlash: null }),
  dismissAchievement: () => set({ newAchievement: null }),
  setGoal: (v) => set({ goal: v }),
  autoRotate: false,
  cameraPreset: "hero",
  skinTone: "#8d5a3b",
  shirtColor: "#ffc32b",  // polished golden-yellow top — pops off the purple floor
  shortsColor: "#f3f4f6", // clean white shorts for maximum separation
  showGrid: true,
  showTrail: true,
  showAngles: true,
  showAnalysis: true,
  showBreath: true,
  slowMo: false,
  presetId: "pushup",
  anim: { ...DEFAULT_PLANK },
  useCustom: false,
  workout: makeWorkout("Push-Up"),
  selectedKF: 0,
  setMode: (m) => set((s) => ({ workout: makeWorkout(s.workout.name || "My Workout", m), selectedKF: 0, useCustom: true })),
  savedWorkouts: loadSaved(),
  studioOpen: false,
  colorPanelOpen: false,
  setColorPanelOpen: (v) => set({ colorPanelOpen: v }),

  setPlaying: (v) => set({ playing: v }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setSpeed: (v) => set({ speed: v }),
  incrementReps: () =>
    set((s) => {
      const now = Date.now();
      const combo = now - s.lastRepAt < COMBO_WINDOW_MS ? s.combo + 1 : 1;
      const gain = XP_PER_REP + Math.min((combo - 1) * 5, 50);
      const xp = s.xp + gain;
      const level = Math.floor(xp / 500) + 1;
      const leveled = level > s.level;
      const reps = s.reps + 1;
      const bestCombo = Math.max(s.bestCombo, combo);
      const unlocked = new Set(s.achievements);
      const check = (id: string, ok: boolean) => { if (ok && !unlocked.has(id)) unlocked.add(id); };
      check("first-rep", reps >= 1);
      check("reps-10", reps >= 10);
      check("reps-25", reps >= 25);
      check("reps-50", reps >= 50);
      check("combo-3", combo >= 3);
      check("combo-5", combo >= 5);
      check("level-2", level >= 2);
      check("speedster", s.speed >= 1.5);
      const fresh = [...unlocked].find((id) => !s.achievements.includes(id));
      return {
        reps,
        xp,
        level,
        combo,
        bestCombo,
        lastRepAt: now,
        lastGain: { xp: gain, combo, key: now },
        levelUpFlash: leveled ? { level, key: now } : s.levelUpFlash,
        newAchievement: fresh ? { id: fresh, key: now } : s.newAchievement,
        achievements: [...unlocked],
      };
    }),
  resetReps: () => set({ reps: 0, combo: 0 }),
  setAutoRotate: (v) => set({ autoRotate: v }),
  setCameraPreset: (v) => set({ cameraPreset: v }),
  setSkinTone: (v) => set({ skinTone: v }),
  setShirtColor: (v) => set({ shirtColor: v }),
  setShortsColor: (v) => set({ shortsColor: v }),
  setShowGrid: (v) => set({ showGrid: v }),
  setShowTrail: (v) => set({ showTrail: v }),
  setShowAngles: (v) => set({ showAngles: v }),
  setShowAnalysis: (v) => set({ showAnalysis: v }),
  setShowBreath: (v) => set({ showBreath: v }),
  setSlowMo: (v) => set({ slowMo: v }),
  setUiTheme: (v) => set({ uiTheme: v }),

  applyPreset: (id) => set({ presetId: id, anim: { ...PRESETS[id] }, playing: true, useCustom: false }),
  setAnim: (patch) => set((s) => ({ anim: { ...s.anim, ...patch }, presetId: "custom", useCustom: false })),
  setBase: (base) =>
    set((s) => ({
      anim: {
        ...s.anim, base,
        ...(base === "plank"
          ? { fromCurl: 0, toCurl: 0, fromLegRaise: 0, toLegRaise: 0 }
          : { fromDepth: 0, toDepth: 0, pike: 0, kneeDrive: 0 }),
      },
      presetId: "custom",
      useCustom: false,
    })),

  setStudioOpen: (v) => set({ studioOpen: v }),
  setUseCustom: (v) => set({ useCustom: v, ...(v ? { playing: true } : {}) }),

  setWorkout: (patch) => set((s) => ({ workout: { ...s.workout, ...patch } })),
  setName: (v) => set((s) => ({ workout: { ...s.workout, name: v } })),
  patchPose: (patch) =>
    set((s) => {
      const i = Math.min(s.selectedKF, s.workout.keyframes.length - 1);
      const k = s.workout.keyframes[i];
      if (!k) return {};
      return { workout: updKF(s.workout, i, { pose: { ...k.pose, ...patch } }) };
    }),
  patchSelected: (patch) =>
    set((s) => ({ workout: updKF(s.workout, Math.min(s.selectedKF, s.workout.keyframes.length - 1), patch) })),
  selectKF: (i) => set({ selectedKF: Math.max(0, i) }),

  addKF: (name) =>
    set((s) => {
      const i = Math.min(s.selectedKF, s.workout.keyframes.length - 1);
      const src = s.workout.keyframes[i];
      const nk = kf(name ?? `Pose ${s.workout.keyframes.length + 1}`, src ? clonePose(src.pose) : clonePose(s.workout.keyframes[0]?.pose ?? ({} as Pose)), 0.7, 0.35);
      const kfs = [...s.workout.keyframes];
      kfs.splice(i + 1, 0, nk);
      return { workout: { ...s.workout, keyframes: kfs }, selectedKF: i + 1 };
    }),
  dupKF: (i) =>
    set((s) => {
      const idx = i ?? s.selectedKF;
      const src = s.workout.keyframes[idx];
      if (!src) return {};
      const kfs = [...s.workout.keyframes];
      kfs.splice(idx + 1, 0, { ...src, id: `k${Date.now().toString(36)}`, pose: clonePose(src.pose) });
      return { workout: { ...s.workout, keyframes: kfs }, selectedKF: idx + 1 };
    }),
  delKF: (i) =>
    set((s) => {
      const idx = i ?? s.selectedKF;
      if (s.workout.keyframes.length <= 1) return {};
      const kfs = s.workout.keyframes.filter((_, j) => j !== idx);
      return { workout: { ...s.workout, keyframes: kfs }, selectedKF: Math.max(0, Math.min(idx, kfs.length - 1)) };
    }),
  moveKF: (i, dir) =>
    set((s) => {
      const j = i + dir;
      if (j < 0 || j >= s.workout.keyframes.length) return {};
      const kfs = [...s.workout.keyframes];
      [kfs[i], kfs[j]] = [kfs[j], kfs[i]];
      return { workout: { ...s.workout, keyframes: kfs }, selectedKF: j };
    }),
  stampPose: (poseId) =>
    set((s) => {
      const preset = POSE_LIBRARY.find((p) => p.id === poseId)?.pose ?? facePosePresets.find((p) => p.id === poseId)?.pose;
      if (!preset) return {};
      const i = Math.min(s.selectedKF, s.workout.keyframes.length - 1);
      const k = s.workout.keyframes[i];
      if (!k) return {};
      return { workout: updKF(s.workout, i, { pose: clonePose(preset), name: k.name }) };
    }),
  loadSequence: (seqId) =>
    set((s) => {
      const seq = [...SEQUENCES, ...GYM_SEQUENCES].find((q) => q.id === seqId);
      const face = FACE_SEQUENCES.find((q) => q.id === seqId);
      if (!seq && !face) return {};
      const built = seq
        ? {
            ...s.workout,
            keyframes: seq.build(),
            mode: "body" as const,
            guides: undefined,
            equipment: seq.equipment ?? "none",
            equipments: (seq as any).equipments ?? (seq.equipment ? [seq.equipment] : []),
          }
        : face!.build();
      return {
        workout: { ...built, name: s.workout.name === "My Workout" ? built.name : s.workout.name },
        selectedKF: 0,
        useCustom: true,
        playing: true,
      };
    }),
  mirrorKF: () =>
    set((s) => {
      const i = Math.min(s.selectedKF, s.workout.keyframes.length - 1);
      const k = s.workout.keyframes[i];
      if (!k) return {};
      return { workout: updKF(s.workout, i, { pose: mirrorPose(k.pose) }) };
    }),
  resetKF: () =>
    set((s) => {
      const i = Math.min(s.selectedKF, s.workout.keyframes.length - 1);
      return { workout: updKF(s.workout, i, { pose: zeroPose() }) };
    }),
  setBreath: (patch) => set((s) => ({ workout: { ...s.workout, breath: { ...s.workout.breath, ...patch } } })),
  newWorkout: () => set({ workout: makeWorkout("My Workout"), selectedKF: 0, useCustom: true, playing: true }),
  saveWorkout: () =>
    set((s) => {
      const stamped = { ...s.workout, createdAt: Date.now() };
      const ex = s.savedWorkouts.findIndex((w) => w.id === stamped.id);
      const next = ex >= 0 ? s.savedWorkouts.map((w, i) => (i === ex ? stamped : w)) : [...s.savedWorkouts, stamped];
      persist(next);
      return { savedWorkouts: next };
    }),
  loadWorkout: (id) =>
    set((s) => {
      const w = s.savedWorkouts.find((q) => q.id === id);
      if (!w) return {};
      return { workout: JSON.parse(JSON.stringify(w)), selectedKF: 0, useCustom: true, playing: true };
    }),
  deleteWorkout: (id) =>
    set((s) => {
      const next = s.savedWorkouts.filter((w) => w.id !== id);
      persist(next);
      return { savedWorkouts: next };
    }),
}));

export type { Ease, PoseKey };

export interface BuilderState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  
  workoutName: string;
  setWorkoutName: (name: string) => void;
  
  blocks: WorkoutBlock[];
  reorderBlocks: (activeId: string, overId: string) => void;
  resetBuilder: () => void;
  loadDemo: () => void;
  
  mobilePreviewOpen: boolean;
  toggleMobilePreview: (v: boolean) => void;
  
  pickerOpen: boolean;
  pickerTargetBlockId: string | null;
  openPicker: (blockId?: string) => void;
  closePicker: () => void;
  
  search: string;
  setSearch: (s: string) => void;
  
  muscleFilters: string[];
  toggleMuscleFilter: (m: string) => void;
  
  equipmentFilters: string[];
  toggleEquipmentFilter: (e: string) => void;

  movementFilters: string[];
  toggleMovementFilter: (m: string) => void;
  
  clearFilters: () => void;
  
  addExercise: (exerciseId: string, targetBlockId?: string | null) => void;
  updateExercise: (blockId: string, exerciseId: string, patch: Partial<BuilderExercise>) => void;
  removeExercise: (blockId: string, exerciseId: string) => void;
  moveExerciseWithinBlock: (blockId: string, fromIndex: number, toIndex: number) => void;
  
  splitBlock: (blockId: string, exerciseIndex: number) => void;
  removeBlock: (blockId: string) => void;
  duplicateBlock: (blockId: string) => void;
  updateBlock: (blockId: string, patch: Partial<WorkoutBlock>) => void;
  addBlock: (exerciseId: string) => void;
}

export const useBuilderStore = create<BuilderState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  workoutName: "My Workout",
  setWorkoutName: (name) => set({ workoutName: name }),
  blocks: [],
  reorderBlocks: (activeId, overId) => set((state) => {
    const oldIndex = state.blocks.findIndex(b => String(b.id) === activeId);
    const newIndex = state.blocks.findIndex(b => String(b.id) === overId);
    if (oldIndex < 0 || newIndex < 0) return {};
    const blocks = [...state.blocks];
    const [moved] = blocks.splice(oldIndex, 1);
    blocks.splice(newIndex, 0, moved);
    return { blocks };
  }),
  resetBuilder: () => set({ blocks: [], workoutName: "My Workout" }),
  loadDemo: () => set({ 
    workoutName: "Full Body Blast", 
    blocks: [makeBlock("pushup"), makeBlock("goblet-squat")] 
  }),
  mobilePreviewOpen: false,
  toggleMobilePreview: (v) => set({ mobilePreviewOpen: v }),
  pickerOpen: false,
  pickerTargetBlockId: null,
  openPicker: (blockId) => set({ pickerOpen: true, pickerTargetBlockId: blockId || null }),
  closePicker: () => set({ pickerOpen: false, pickerTargetBlockId: null }),
  search: "",
  setSearch: (s) => set({ search: s }),
  muscleFilters: [],
  toggleMuscleFilter: (m) => set((s) => ({
    muscleFilters: s.muscleFilters.includes(m) ? s.muscleFilters.filter(x => x !== m) : [...s.muscleFilters, m]
  })),
  equipmentFilters: [],
  toggleEquipmentFilter: (e) => set((s) => ({
    equipmentFilters: s.equipmentFilters.includes(e) ? s.equipmentFilters.filter(x => x !== e) : [...s.equipmentFilters, e]
  })),
  movementFilters: [],
  toggleMovementFilter: (m) => set((s) => ({
    movementFilters: s.movementFilters.includes(m) ? s.movementFilters.filter(x => x !== m) : [...s.movementFilters, m]
  })),
  clearFilters: () => set({ muscleFilters: [], equipmentFilters: [], movementFilters: [], search: "" }),
  addExercise: (exerciseId, targetBlockId) => set((s) => {
    if (targetBlockId) {
      return {
        blocks: s.blocks.map(b => 
          b.id === targetBlockId 
            ? { ...b, type: b.exercises.length > 0 ? "group" : "single", exercises: [...b.exercises, makeExerciseInstance(exerciseId)] } 
            : b
        )
      };
    }
    return { blocks: [...s.blocks, makeBlock(exerciseId)] };
  }),
  updateExercise: (blockId, exId, patch) => set((s) => ({
    blocks: s.blocks.map(b => b.id === blockId ? {
      ...b, exercises: b.exercises.map(ex => ex.id === exId ? { ...ex, ...patch } : ex)
    } : b)
  })),
  removeExercise: (blockId, exId) => set((s) => ({
    blocks: s.blocks.map(b => b.id === blockId ? {
      ...b, exercises: b.exercises.filter(ex => ex.id !== exId)
    } : b).filter(b => b.exercises.length > 0)
  })),
  moveExerciseWithinBlock: (blockId, from, to) => set((s) => ({
    blocks: s.blocks.map(b => {
      if (b.id !== blockId) return b;
      const ex = [...b.exercises];
      const [moved] = ex.splice(from, 1);
      ex.splice(to, 0, moved);
      return { ...b, exercises: ex };
    })
  })),
  splitBlock: (blockId, exIndex) => set((s) => {
    const block = s.blocks.find(b => b.id === blockId);
    if (!block || exIndex <= 0 || exIndex >= block.exercises.length) return {};
    const b1 = { ...block, exercises: block.exercises.slice(0, exIndex), type: exIndex === 1 ? "single" : "group" } as WorkoutBlock;
    const b2 = { ...block, id: `blk${Date.now()}`, exercises: block.exercises.slice(exIndex), type: block.exercises.length - exIndex === 1 ? "single" : "group" } as WorkoutBlock;
    const blocks = [...s.blocks];
    const idx = blocks.findIndex(b => b.id === blockId);
    blocks.splice(idx, 1, b1, b2);
    return { blocks };
  }),
  removeBlock: (blockId) => set((s) => ({
    blocks: s.blocks.filter(b => b.id !== blockId)
  })),
  duplicateBlock: (blockId) => set((s) => {
    const block = s.blocks.find(b => b.id === blockId);
    if (!block) return {};
    const dup = { ...block, id: `blk${Date.now()}`, exercises: block.exercises.map(e => ({ ...e, id: `ex${Math.random()}` })) };
    const blocks = [...s.blocks];
    blocks.splice(blocks.findIndex(b => b.id === blockId) + 1, 0, dup);
    return { blocks };
  }),
  updateBlock: (blockId, patch) => set((s) => ({
    blocks: s.blocks.map(b => b.id === blockId ? { ...b, ...patch } : b)
  })),
  addBlock: (exId) => set((s) => ({ blocks: [...s.blocks, makeBlock(exId)] }))
}));
