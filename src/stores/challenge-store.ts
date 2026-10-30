"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/* ------------------------------------------------------------------ */
/*  Card types — each maps to a unique destruction mechanic            */
/* ------------------------------------------------------------------ */

export type CardType =
  | "stretch-snap"   // Run, Walk, Steps
  | "bubble-pop"     // Study, Read, Pages
  | "burn"           // Code, Work, Focus
  | "chisel"         // Gym, Workout, Lift
  | "exhale"         // Yoga, Meditate, Breathe
  | "liquid-fill"    // Water, Coffee, Hydration
  | "progress-ring"  // Calories, Food, Meal
  | "checklist";     // Default fallback

export type ChallengeTask = {
  id: string;
  label: string;
  emoji: string;
  cardType: CardType;
  /** Pastel background color for the card */
  color: string;
  /** Target quantity (e.g. 50 for "50 pushups", 8 for "8 glasses") */
  target: number;
  /** Unit label for the target */
  unit: string;
  /** Current progress (0 → target) */
  progress: number;
  /** Is this task fully completed? */
  completed: boolean;
  /** Optional deadline (ISO string) for timeline fuse */
  deadline: string | null;
};

export type GullakItem = {
  id: string;
  emoji: string;
  label: string;
  color: string;
};

/* ------------------------------------------------------------------ */
/*  Keyword → Card Type mapping                                        */
/* ------------------------------------------------------------------ */

const KEYWORD_MAP: { keywords: string[]; type: CardType; emoji: string; color: string; defaultUnit: string }[] = [
  {
    keywords: ["run", "walk", "steps", "jog", "sprint", "hike", "cardio"],
    type: "stretch-snap",
    emoji: "👟",
    color: "#FFD5C2",   // Pastel Peach
    defaultUnit: "min",
  },
  {
    keywords: ["read", "study", "pages", "learn", "book", "chapter"],
    type: "bubble-pop",
    emoji: "📚",
    color: "#FFF3CD",   // Pastel Yellow/Parchment
    defaultUnit: "pages",
  },
  {
    keywords: ["code", "work", "laptop", "focus", "deep work", "project", "write"],
    type: "burn",
    emoji: "💻",
    color: "#C8D6E5",   // Pastel Midnight Blue
    defaultUnit: "min",
  },
  {
    keywords: ["gym", "workout", "lift", "push", "pull", "squat", "bench", "deadlift", "exercise", "pushup", "push-up", "pullup"],
    type: "chisel",
    emoji: "🏋️",
    color: "#D5D5D5",   // Pastel Slate
    defaultUnit: "reps",
  },
  {
    keywords: ["yoga", "meditate", "breathe", "stretch", "mindful", "zen", "calm", "relax"],
    type: "exhale",
    emoji: "🧘",
    color: "#D4EDDA",   // Pastel Sage Green
    defaultUnit: "min",
  },
  {
    keywords: ["water", "coffee", "hydration", "drink", "tea", "juice", "smoothie"],
    type: "liquid-fill",
    emoji: "💧",
    color: "#D1ECF1",   // Pastel Cyan
    defaultUnit: "glasses",
  },
  {
    keywords: ["eat", "calories", "food", "meal", "protein", "diet", "nutrition", "breakfast", "lunch", "dinner"],
    type: "progress-ring",
    emoji: "🍽️",
    color: "#FFD6D6",   // Pastel Coral
    defaultUnit: "kcal",
  },
];

const FALLBACK_CARD = {
  type: "checklist" as CardType,
  emoji: "✨",
  color: "#E8DAEF",  // Pastel Lavender
  defaultUnit: "tasks",
};

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

export type PresetId = "morning-grind" | "body-mind" | "active-recovery";

export const CHALLENGE_PRESETS: { id: PresetId; label: string; emoji: string; text: string }[] = [
  {
    id: "morning-grind",
    label: "Morning Grind",
    emoji: "⚡",
    text: "30 min workout, drink 2L water, 10 min meditation",
  },
  {
    id: "body-mind",
    label: "Body & Mind",
    emoji: "🧠",
    text: "Gym session with 50 pushups, read 20 pages, eat a healthy meal",
  },
  {
    id: "active-recovery",
    label: "Active Recovery",
    emoji: "🌿",
    text: "Yoga flow 20 min, walk 5000 steps, drink 8 glasses water",
  },
];

/* ------------------------------------------------------------------ */
/*  Text parser                                                        */
/* ------------------------------------------------------------------ */

let taskIdCounter = 0;

function detectCardType(segment: string): typeof KEYWORD_MAP[number] | null {
  const lower = segment.toLowerCase();
  for (const entry of KEYWORD_MAP) {
    for (const kw of entry.keywords) {
      if (lower.includes(kw)) return entry;
    }
  }
  return null;
}

function extractQuantity(segment: string): { value: number; unit: string } | null {
  // Match patterns like "50 pushups", "2L water", "5000 steps", "30 min", "20 pages"
  const patterns = [
    /(\d+(?:\.\d+)?)\s*(?:l|liters?|litres?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:k|kg|kilos?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:min|mins?|minutes?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:hr|hrs?|hours?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:reps?|sets?|times?|pushups?|push-ups?|pullups?|pull-ups?|squats?|burpees?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:pages?|chapters?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:glasses?|cups?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:steps?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:kcal|cal|calories?)\b/i,
    /(\d+(?:\.\d+)?)\s*(?:km|miles?)\b/i,
    // Bare number at start
    /^(\d+(?:\.\d+)?)\b/,
  ];

  for (const pat of patterns) {
    const match = segment.match(pat);
    if (match) {
      const value = parseFloat(match[1]);
      if (value > 0) {
        // Extract the unit from after the number
        const afterNum = segment.slice(match.index! + match[0].length).trim();
        const unitWord = afterNum.split(/\s/)[0] || "";
        return { value, unit: unitWord || "×" };
      }
    }
  }
  return null;
}

export function parseChallenge(text: string): ChallengeTask[] {
  // Split on commas, "and", newlines, semicolons
  const segments = text
    .split(/[,;\n]+|(?:\band\b)/gi)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

  if (segments.length === 0) return [];

  return segments.map((seg) => {
    const match = detectCardType(seg);
    const qty = extractQuantity(seg);
    const cardInfo = match || FALLBACK_CARD;

    return {
      id: `task-${++taskIdCounter}-${Date.now()}`,
      label: seg.replace(/^\d+\s*/, "").trim() || seg,
      emoji: cardInfo.emoji,
      cardType: cardInfo.type,
      color: cardInfo.color,
      target: qty?.value || 1,
      unit: qty?.unit || cardInfo.defaultUnit,
      progress: 0,
      completed: false,
      deadline: null,
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

type ChallengeState = {
  /** Raw input text */
  challengeText: string;
  /** Parsed tasks for today */
  tasks: ChallengeTask[];
  /** Items collected in the Gullak vault */
  gullakItems: GullakItem[];
  /** Whether all tasks are done */
  allCompleted: boolean;
  /** Whether the Gullak has been crushed today */
  crushed: boolean;
  /** The date these tasks were created (for daily reset) */
  challengeDate: string | null;

  /** Set raw text and parse into tasks */
  submitChallenge: (text: string) => void;
  /** Load a preset */
  loadPreset: (presetId: PresetId) => void;
  /** Update progress on a task */
  updateProgress: (taskId: string, progress: number) => void;
  /** Mark a task as completed */
  completeTask: (taskId: string) => void;
  /** Crush the Gullak (all done) */
  crushGullak: () => void;
  /** Clear today's challenge */
  clearChallenge: () => void;
};

export const useChallengeStore = create<ChallengeState>()(
  persist(
    (set, get) => ({
      challengeText: "",
      tasks: [],
      gullakItems: [],
      allCompleted: false,
      crushed: false,
      challengeDate: null,

      submitChallenge: (text) => {
        const tasks = parseChallenge(text);
        set({
          challengeText: text,
          tasks,
          gullakItems: [],
          allCompleted: false,
          crushed: false,
          challengeDate: new Date().toDateString(),
        });
      },

      loadPreset: (presetId) => {
        const preset = CHALLENGE_PRESETS.find((p) => p.id === presetId);
        if (preset) get().submitChallenge(preset.text);
      },

      updateProgress: (taskId, progress) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, progress: Math.min(progress, t.target) } : t,
          ),
        }));
      },

      completeTask: async (taskId) => {
        const s = get();
        const task = s.tasks.find((t) => t.id === taskId);
        if (!task || task.completed) return;

        const newGullakItem: GullakItem = {
          id: task.id,
          emoji: task.emoji,
          label: task.label,
          color: task.color,
        };

        const updatedTasks = s.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: true, progress: t.target } : t,
        );

        const allDone = updatedTasks.every((t) => t.completed);

        set({
          tasks: updatedTasks,
          gullakItems: [...s.gullakItems, newGullakItem],
          allCompleted: allDone,
        });

        // Trigger global confetti dynamically
        try {
          const confettiModule = await import("canvas-confetti");
          const fireConfetti = confettiModule.default || confettiModule;
          fireConfetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: [task.color, "#ffffff", "#FFD700"]
          });
        } catch (e) {
          console.error("Confetti failed", e);
        }
      },

      crushGullak: () => {
        set({ crushed: true });
      },

      clearChallenge: () => {
        set({
          challengeText: "",
          tasks: [],
          gullakItems: [],
          allCompleted: false,
          crushed: false,
          challengeDate: null,
        });
      },
    }),
    {
      name: "vyay-challenge-v1",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
