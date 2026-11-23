"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  useLoaderStore,
  getPhase,
  getCurrentCopy,
  type LoadingContext,
  type LoadingMode,
} from "@/stores/loader-store";

// ─── Public hook: fire-and-forget loader control ───────────────────────────────

/**
 * useLoader
 *
 * Drop this in any component that triggers async work.
 *
 * @example
 * const { load, finish, fail, updateProgress } = useLoader("workout");
 * load();                        // indeterminate
 * load({ type: "determinate", progress: 0 });
 * updateProgress(0.72);
 * finish();  /  fail("msg");
 */
export function useLoader(context: LoadingContext = "generic") {
  const store = useLoaderStore();
  return {
    load: (mode?: LoadingMode) => store.load({ mode, context }),
    finish: store.finish,
    fail: store.fail,
    retry: store.retry,
    cancel: store.cancel,
    updateProgress: store.updateProgress,
    isLoading: store.status === "loading",
  };
}

// ─── MomentumStroke (SVG path draw/erase animation) ───────────────────────────

function MomentumStroke({
  progress,
  indeterminate,
  dimmed = false,
  reduceMotion = false,
}: {
  progress: number;    // 0–1 (used when !indeterminate)
  indeterminate: boolean;
  dimmed?: boolean;
  reduceMotion?: boolean;
}) {
  // For indeterminate: animate strokeDashoffset
  // The arc has a known path length (~346px for our bezier)
  const PATH_LENGTH = 346;

  // Stroke end position mapped to dash
  const dashOffset = indeterminate ? undefined : PATH_LENGTH * (1 - progress);

  return (
    <svg
      viewBox="0 0 240 120"
      fill="none"
      aria-hidden
      className={cn("w-full h-full", dimmed && "opacity-25")}
    >
      {/* Accent stroke — slightly offset, follows primary */}
      <path
        d="M 20 100 C 60 20 180 20 220 100"
        strokeLinecap="round"
        className={cn(
          "stroke-[var(--u-mint-strong)] dark:stroke-[var(--u-amethyst)]",
          "transition-all duration-300"
        )}
        strokeWidth={3}
        strokeOpacity={dimmed ? 0.15 : 0.35}
        fill="none"
        transform="translate(0, -8)"
        style={
          !reduceMotion && indeterminate
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: 0,
              }
            : !reduceMotion
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: dashOffset,
                transition: "stroke-dashoffset 0.3s linear",
              }
            : undefined
        }
      />

      {/* Primary stroke */}
      <path
        d="M 20 100 C 60 20 180 20 220 100"
        strokeLinecap="round"
        className="stroke-ink dark:stroke-snow"
        strokeWidth={dimmed ? 2 : 4}
        fill="none"
        style={
          !reduceMotion && indeterminate
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: 0,
              }
            : !reduceMotion
            ? {
                strokeDasharray: PATH_LENGTH,
                strokeDashoffset: dashOffset,
                transition: "stroke-dashoffset 0.3s linear",
              }
            : undefined
        }
      />
    </svg>
  );
}

// ─── AnimatedStroke — handles the looping draw/erase for indeterminate ─────────

function AnimatedStroke({
  indeterminate,
  progress,
  reduceMotion,
  dimmed,
}: {
  indeterminate: boolean;
  progress: number;
  reduceMotion: boolean;
  dimmed?: boolean;
}) {
  const PATH_LENGTH = 346;

  if (reduceMotion) {
    // Static stroke + subtle opacity pulse via CSS
    return (
      <div className="w-[240px] h-[120px] animate-pulse-soft opacity-80">
        <MomentumStroke
          progress={1}
          indeterminate={false}
          dimmed={dimmed}
          reduceMotion
        />
      </div>
    );
  }

  if (!indeterminate) {
    // Determinate: just the SVG with CSS transition on dashoffset
    return (
      <div className="w-[240px] h-[120px]">
        <MomentumStroke
          progress={progress}
          indeterminate={false}
          dimmed={dimmed}
          reduceMotion={false}
        />
      </div>
    );
  }

  // Indeterminate: Framer Motion drives the draw/erase loop
  // strokeDashoffset: PATH_LENGTH (nothing) → 0 (full) → then strokeStart advances via a second value trick
  // We use two stacked motions: draw-on (offset 0) then erase (offset goes negative / we use a mask rect approach)
  // Simplest reliable approach: animate a clip-path percentage on a wrapper div.
  return (
    <div className="relative w-[240px] h-[120px]">
      {/* Accent */}
      <svg viewBox="0 0 240 120" fill="none" aria-hidden className="absolute inset-0 w-full h-full">
        <motion.path
          d="M 20 100 C 60 20 180 20 220 100"
          strokeLinecap="round"
          className="stroke-[var(--u-mint-strong)] dark:stroke-[var(--u-amethyst)]"
          strokeWidth={3}
          strokeOpacity={0.3}
          fill="none"
          transform="translate(0, -8)"
          strokeDasharray={PATH_LENGTH}
          animate={{
            strokeDashoffset: [PATH_LENGTH, 0, 0, -PATH_LENGTH, PATH_LENGTH],
            opacity: [0, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: 2.4,
            ease: ["easeInOut", "easeInOut", "easeIn", "linear", "linear"],
            times: [0, 0.38, 0.54, 0.82, 1],
            repeat: Infinity,
            repeatDelay: 0.15,
            delay: 0.3,
          }}
        />
      </svg>

      {/* Primary */}
      <svg viewBox="0 0 240 120" fill="none" aria-hidden className="absolute inset-0 w-full h-full">
        <motion.path
          d="M 20 100 C 60 20 180 20 220 100"
          strokeLinecap="round"
          className="stroke-ink dark:stroke-snow"
          strokeWidth={4}
          fill="none"
          strokeDasharray={PATH_LENGTH}
          animate={{
            strokeDashoffset: [PATH_LENGTH, 0, 0, -PATH_LENGTH, PATH_LENGTH],
            opacity: [0, 1, 1, 0.7, 0],
          }}
          transition={{
            duration: 2.4,
            ease: ["easeInOut", "easeInOut", "easeIn", "linear", "linear"],
            times: [0, 0.38, 0.54, 0.82, 1],
            repeat: Infinity,
            repeatDelay: 0.15,
          }}
        />
      </svg>
    </div>
  );
}

// ─── Progress bar ──────────────────────────────────────────────────────────────

function MomentumProgressBar({
  mode,
  reduceMotion,
}: {
  mode: LoadingMode;
  reduceMotion: boolean;
}) {
  const isIndeterminate = mode.type === "indeterminate";
  const progress = mode.type === "determinate" ? mode.progress : 0;

  return (
    <div className="relative h-[2px] w-[180px] overflow-hidden rounded-full bg-ink/10 dark:bg-snow/10">
      {isIndeterminate ? (
        reduceMotion ? (
          <div className="absolute inset-y-0 left-0 w-[40%] rounded-full bg-[var(--u-mint-strong)] dark:bg-[var(--u-amethyst)]" />
        ) : (
          <motion.div
            className="absolute inset-y-0 w-[40%] rounded-full bg-[var(--u-mint-strong)] dark:bg-[var(--u-amethyst)]"
            animate={{ left: ["-45%", "105%"] }}
            transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
          />
        )
      ) : (
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-[var(--u-mint-strong)] dark:bg-[var(--u-amethyst)]"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ duration: 0.3, ease: "linear" }}
        />
      )}
    </div>
  );
}

// ─── Long-wait slow-network copy ──────────────────────────────────────────────

const SLOW_NETWORK_COPY = [
  "Slow connection — still working",
  "Your data is safe, hang tight",
  "Almost there",
];

// ─── Main MomentumLoader overlay ──────────────────────────────────────────────

/**
 * MomentumLoader
 *
 * Drop this once at the app shell level (already added to app-shell.tsx).
 * It reads from the global loader-store — no props needed.
 *
 * For screen-level placement wrap in a relative container and add
 * className="absolute inset-0 z-50" via the `className` prop.
 */
export function MomentumLoader({ className }: { className?: string }) {
  const {
    status,
    mode,
    context,
    elapsed,
    showCancel,
    copyIndex,
    errorMessage,
    retry,
    cancel,
  } = useLoaderStore();

  const shouldReduceMotion = useReducedMotion() ?? false;
  const phase = getPhase(elapsed);
  const isIndeterminate = mode.type === "indeterminate";
  const progress = mode.type === "determinate" ? mode.progress : 0;

  // Flicker gate: only mount after 500 ms of loading
  const gateOpen = useFadeGate(status === "loading");

  const currentCopy =
    phase === "long" && elapsed % 4 < 2
      ? SLOW_NETWORK_COPY[Math.floor(elapsed / 8) % SLOW_NETWORK_COPY.length]
      : getCurrentCopy(context, copyIndex);

  const visible = (status === "loading" && gateOpen) || status === "success" || status === "error";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="momentum-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "absolute inset-0 z-50 flex flex-col items-center justify-center",
            "bg-paper/95 dark:bg-void/95 backdrop-blur-sm",
            className
          )}
          role="status"
          aria-live="polite"
          aria-label={
            status === "error"
              ? errorMessage
              : isIndeterminate
              ? `Loading, please wait. ${currentCopy}`
              : `Loading ${Math.round(progress * 100)} percent. ${currentCopy}`
          }
        >
          {status === "loading" && (
            <LoadingBody
              mode={mode}
              currentCopy={currentCopy}
              phase={phase}
              showCancel={showCancel}
              reduceMotion={shouldReduceMotion}
              onCancel={cancel}
            />
          )}

          {status === "success" && (
            <SuccessBody reduceMotion={shouldReduceMotion} />
          )}

          {status === "error" && (
            <ErrorBody
              message={errorMessage}
              reduceMotion={shouldReduceMotion}
              onRetry={retry}
              onCancel={cancel}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Loading body ──────────────────────────────────────────────────────────────

function LoadingBody({
  mode,
  currentCopy,
  phase,
  showCancel,
  reduceMotion,
  onCancel,
}: {
  mode: LoadingMode;
  currentCopy: string;
  phase: "short" | "medium" | "long";
  showCancel: boolean;
  reduceMotion: boolean;
  onCancel: () => void;
}) {
  const isIndeterminate = mode.type === "indeterminate";
  const progress = mode.type === "determinate" ? mode.progress : 0;

  return (
    <div className="flex flex-col items-center gap-6 px-8">
      {/* Stroke */}
      <AnimatedStroke
        indeterminate={isIndeterminate}
        progress={progress}
        reduceMotion={reduceMotion}
      />

      {/* Copy — fades between values */}
      <AnimatePresence mode="wait">
        <motion.p
          key={currentCopy}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35 }}
          className="text-[14px] font-medium text-ink/70 dark:text-snow/70 text-center max-w-[200px] leading-snug"
        >
          {currentCopy}
        </motion.p>
      </AnimatePresence>

      {/* Progress bar (medium+ only) */}
      {(phase === "medium" || phase === "long") && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <MomentumProgressBar mode={mode} reduceMotion={reduceMotion} />
        </motion.div>
      )}

      {/* Cancel */}
      <AnimatePresence>
        {showCancel && (
          <motion.button
            key="cancel"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            type="button"
            onClick={onCancel}
            className={cn(
              "mt-2 min-h-[44px] min-w-[44px] px-4 rounded-full",
              "text-[13px] font-semibold text-ink/50 dark:text-snow/50",
              "hover:text-ink dark:hover:text-snow transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--u-mint-deep)]"
            )}
            aria-label="Cancel loading"
          >
            Cancel
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Success body ──────────────────────────────────────────────────────────────

function SuccessBody({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col items-center gap-4"
      role="status"
      aria-label="Ready. Let's go."
    >
      <div className="w-[240px] h-[120px]">
        <MomentumStroke progress={1} indeterminate={false} reduceMotion={reduceMotion} />
      </div>
      <p className="text-[16px] font-semibold text-[var(--u-mint-deep)] dark:text-[var(--u-amethyst)]">
        Ready. Let&apos;s go.
      </p>
    </motion.div>
  );
}

// ─── Error body ────────────────────────────────────────────────────────────────

function ErrorBody({
  message,
  reduceMotion,
  onRetry,
  onCancel,
}: {
  message: string;
  reduceMotion: boolean;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-5 px-8 max-w-[280px]"
      role="alert"
    >
      <div className="w-[240px] h-[120px] opacity-25">
        <MomentumStroke progress={0.55} indeterminate={false} dimmed reduceMotion={reduceMotion} />
      </div>

      <p className="text-[14px] text-ink/80 dark:text-snow/80 text-center leading-relaxed">
        {message}
      </p>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onRetry}
          className={cn(
            "min-h-[44px] px-5 rounded-full",
            "bg-[var(--u-mint-deep)] dark:bg-[var(--u-grape)] text-white",
            "text-[13px] font-semibold",
            "hover:opacity-90 active:scale-95 transition-all",
            "focus-visible:outline-2 focus-visible:outline-offset-2"
          )}
        >
          Try Again
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={cn(
            "min-h-[44px] px-4 rounded-full",
            "text-[13px] font-medium text-ink/50 dark:text-snow/50",
            "hover:text-ink dark:hover:text-snow transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2"
          )}
        >
          Go Back
        </button>
      </div>
    </motion.div>
  );
}

// ─── Flicker gate hook ────────────────────────────────────────────────────────

/**
 * Returns true only after 500 ms of continuous `active=true`.
 * Prevents a flash for fast loads that resolve in under 500 ms.
 */
function useFadeGate(active: boolean): boolean {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (active) {
      timerRef.current = setTimeout(() => setOpen(true), 500);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setOpen(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active]);

  return open;
}

// ─── Convenience: inline MomentumLoader for per-screen use ────────────────────

/**
 * ScreenLoader
 *
 * Wraps any screen content and overlays the loader when status is active.
 * Uses the global store just like MomentumLoader but scoped within a container.
 *
 * @example
 * <ScreenLoader context="workout">
 *   <WorkoutContent />
 * </ScreenLoader>
 */
export function ScreenLoader({
  children,
  context,
  className,
}: {
  children: React.ReactNode;
  context?: LoadingContext;
  className?: string;
}) {
  const { status } = useLoaderStore();
  const showOverlay = status !== "idle" && status !== "cancelled";

  return (
    <div className={cn("relative", className)}>
      {children}
      {showOverlay && <MomentumLoader />}
    </div>
  );
}
