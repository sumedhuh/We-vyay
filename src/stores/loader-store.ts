"use client";

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LoadingMode =
  | { type: "indeterminate" }
  | { type: "determinate"; progress: number }; // progress: 0–1

export type LoadingStatus = "idle" | "loading" | "success" | "error" | "cancelled";

export type LoadingContext =
  | "workout"     // "Getting your session ready"
  | "sync"        // "Syncing your progress"
  | "plan"        // "Building your program"
  | "video"       // "Fetching your workout"
  | "feed"        // "Loading the feed"
  | "generic";    // fallback

export interface LoaderState {
  status: LoadingStatus;
  mode: LoadingMode;
  context: LoadingContext;
  errorMessage: string;
  elapsed: number; // seconds since load() called
  showCancel: boolean;
  copyIndex: number;
}

interface LoaderActions {
  load: (opts?: { mode?: LoadingMode; context?: LoadingContext }) => void;
  updateProgress: (progress: number) => void;
  finish: () => void;
  fail: (message?: string) => void;
  retry: () => void;
  cancel: () => void;
  _tick: () => void;
  _showCancel: () => void;
  _nextCopy: () => void;
}

// ─── Microcopy ────────────────────────────────────────────────────────────────

export const COPY_SEQUENCES: Record<LoadingContext, string[]> = {
  workout:  ["Getting your session ready", "Loading your exercises", "Almost warmed up"],
  sync:     ["Syncing your progress", "Pulling in your data", "Connecting to devices"],
  plan:     ["Building your program", "Personalising your plan", "Almost ready"],
  video:    ["Fetching your workout", "Downloading video", "Buffering your session"],
  feed:     ["Loading the feed", "Fetching new moves", "Almost there"],
  generic:  ["Getting things ready", "Almost there", "Hang tight"],
};

// ─── Store ────────────────────────────────────────────────────────────────────

let _tickTimer: ReturnType<typeof setInterval> | null = null;
let _copyTimer: ReturnType<typeof setInterval> | null = null;
let _cancelTimer: ReturnType<typeof setTimeout> | null = null;

function clearAllTimers() {
  if (_tickTimer) { clearInterval(_tickTimer); _tickTimer = null; }
  if (_copyTimer) { clearInterval(_copyTimer); _copyTimer = null; }
  if (_cancelTimer) { clearTimeout(_cancelTimer); _cancelTimer = null; }
}

export const useLoaderStore = create<LoaderState & LoaderActions>((set, get) => ({
  // ── Initial state
  status: "idle",
  mode: { type: "indeterminate" },
  context: "generic",
  errorMessage: "",
  elapsed: 0,
  showCancel: false,
  copyIndex: 0,

  // ── Actions
  load({ mode = { type: "indeterminate" as const }, context = "generic" as LoadingContext } = {}) {
    clearAllTimers();
    set({ status: "loading", mode, context, elapsed: 0, showCancel: false, copyIndex: 0, errorMessage: "" });

    // Elapsed ticker — drives phase escalation in the view
    _tickTimer = setInterval(() => get()._tick(), 1000);
    // Copy rotation every 4 s
    _copyTimer = setInterval(() => get()._nextCopy(), 4000);
    // Cancel button at 8 s
    _cancelTimer = setTimeout(() => get()._showCancel(), 8000);
  },

  updateProgress(progress) {
    const { status } = get();
    if (status !== "loading") return;
    set({ mode: { type: "determinate", progress: Math.max(0, Math.min(1, progress)) } });
  },

  finish() {
    clearAllTimers();
    set({ status: "success" });
    // Auto-idle after success animation plays (600 ms)
    setTimeout(() => {
      if (get().status === "success") set({ status: "idle" });
    }, 900);
  },

  fail(message = "Couldn't connect. Check your signal.") {
    clearAllTimers();
    set({ status: "error", errorMessage: message });
  },

  retry() {
    const { context, mode } = get();
    get().load({ mode, context });
  },

  cancel() {
    clearAllTimers();
    set({ status: "cancelled" });
    setTimeout(() => {
      if (get().status === "cancelled") set({ status: "idle" });
    }, 400);
  },

  _tick() {
    set((s) => ({ elapsed: s.elapsed + 1 }));
  },

  _showCancel() {
    set({ showCancel: true });
  },

  _nextCopy() {
    const { context, copyIndex } = get();
    const seq = COPY_SEQUENCES[context];
    set({ copyIndex: (copyIndex + 1) % seq.length });
  },
}));

// ─── Derived helpers (use in components) ──────────────────────────────────────

export type LoadingPhase = "short" | "medium" | "long";

export function getPhase(elapsed: number): LoadingPhase {
  if (elapsed < 3) return "short";
  if (elapsed < 10) return "medium";
  return "long";
}

export function getCurrentCopy(context: LoadingContext, index: number): string {
  const seq = COPY_SEQUENCES[context];
  return seq[index % seq.length];
}
