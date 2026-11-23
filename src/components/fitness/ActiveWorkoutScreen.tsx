import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  FastForward,
  Check,
  Undo,
  HelpCircle,
  X,
  ChevronRight,
  Timer,
  Orbit,
  Trees,
  Sun,
  Moon,
  Camera,
} from 'lucide-react';
import { springs, swipeVariants } from '../../lib/motion';
import { useWorkoutMachine, Exercise } from '../../hooks/useWorkoutMachine';
import { Haptics } from '../../services/haptics';
import { ExerciseVisual } from './ExerciseVisual';
import { usePushupStore, CameraPreset } from '@/components/3d-builder/store';
import { useSceneStore } from '@/components/3d-builder/scene/store';

/* Pastel palette tokens with saturated accents */
const P = {
  bg: '#FAF7F2',
  card: '#FFFFFF',
  cardBorder: '#EFE7DC',
  lilac: '#C4B5E0',
  lilacDeep: '#7C5CB7',
  lilacSoft: '#EDE7F6',
  green: '#B8D8BA',
  greenDeep: '#16A34A',
  greenSoft: '#DCFCE7',
  peach: '#F8C9B5',
  peachDeep: '#EA580C',
  peachSoft: '#FFF0EB',
  yellow: '#F5E1A4',
  yellowSoft: '#FFF9E6',
  text: '#292524',
  textSoft: '#78716C',
  textMuted: '#A8A29E',
};

// Top corner 3D interactive controls: Auto Orbit, Change Environment, Lighting, Camera
export const TopCorner3DControls = () => {
  const autoRotate = usePushupStore((s) => s.autoRotate);
  const setAutoRotate = usePushupStore((s) => s.setAutoRotate);
  const cameraPreset = usePushupStore((s) => s.cameraPreset);
  const setCameraPreset = usePushupStore((s) => s.setCameraPreset);
  const activeWorld = useSceneStore((s) => s.activeWorld);
  const setWorld = useSceneStore((s) => s.setWorld);
  const nightMode = useSceneStore((s) => s.nightMode);
  const setNightMode = useSceneStore((s) => s.setNightMode);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 1700);
  };

  const handleToggleAutoRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.light();
    const next = !autoRotate;
    setAutoRotate(next);
    showToast(next ? 'Auto Orbit: ON' : 'Auto Orbit: OFF');
  };

  const handleCycleWorld = (e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.light();
    const worlds = ['park', 'rooftop', 'bedroom', 'garage'];
    const curIdx = worlds.indexOf(activeWorld);
    const next = worlds[(curIdx + 1) % worlds.length];
    setWorld(next);
    const names: Record<string, string> = {
      park: 'Park',
      rooftop: 'Rooftop',
      bedroom: 'Bedroom',
      garage: 'Garage',
    };
    showToast(`Environment: ${names[next] || next}`);
  };

  const handleToggleNight = (e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.light();
    const next = !nightMode;
    setNightMode(next);
    showToast(next ? 'Night Mode' : 'Daylight');
  };

  const handleCycleCamera = (e: React.MouseEvent) => {
    e.stopPropagation();
    Haptics.light();
    const presets: CameraPreset[] = ['hero', 'front', 'side', 'top'];
    const curIdx = presets.indexOf(cameraPreset as CameraPreset);
    const next = presets[(curIdx + 1) % presets.length];
    setCameraPreset(next);
    showToast(`View: ${next.toUpperCase()}`);
  };

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end gap-2 z-20">
      {/* Toast pill readout */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, x: 8, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 8, scale: 0.9 }}
            className="px-2.5 py-1 rounded-full text-[11px] font-bold shadow-lg pointer-events-none mb-0.5"
            style={{
              background: '#292524',
              color: '#FFFFFF',
            }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col gap-2">
        {/* 1. Auto Orbit Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleAutoRotate}
          aria-label={autoRotate ? 'Disable auto orbit' : 'Enable auto orbit'}
          title="Auto Orbit"
          className="size-9 rounded-full flex items-center justify-center border shadow-sm transition-all relative"
          style={{
            background: autoRotate
              ? 'linear-gradient(135deg, #10B981, #059669)'
              : 'linear-gradient(135deg, #E0F2FE, #BAE6FD)',
            borderColor: autoRotate ? '#059669' : '#7DD3FC',
            color: autoRotate ? '#FFFFFF' : '#0369A1',
            boxShadow: autoRotate ? '0 0 12px rgba(16, 185, 129, 0.5)' : undefined,
          }}
        >
          <Orbit size={18} className={autoRotate ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
        </motion.button>

        {/* 2. Change Environment Button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCycleWorld}
          aria-label="Change 3D environment"
          title="Change Environment"
          className="size-9 rounded-full flex items-center justify-center border shadow-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #DCFCE7, #BBF7D0)',
            borderColor: '#86EFAC',
            color: '#15803D',
          }}
        >
          <Trees size={17} />
        </motion.button>

        {/* 3. Day / Night Lighting Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleToggleNight}
          aria-label="Toggle day or night lighting"
          title="Lighting Atmosphere"
          className="size-9 rounded-full flex items-center justify-center border shadow-sm transition-all"
          style={{
            background: nightMode
              ? 'linear-gradient(135deg, #312E81, #1E1B4B)'
              : 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
            borderColor: nightMode ? '#6366F1' : '#FCD34D',
            color: nightMode ? '#C7D2FE' : '#B45309',
          }}
        >
          {nightMode ? <Moon size={16} /> : <Sun size={17} />}
        </motion.button>

        {/* 4. Camera Angle Preset */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleCycleCamera}
          aria-label="Switch camera angle"
          title="Camera View"
          className="size-9 rounded-full flex items-center justify-center border shadow-sm transition-all"
          style={{
            background: 'linear-gradient(135deg, #F3E8FF, #E9D5FF)',
            borderColor: '#D8B4FE',
            color: '#7E22CE',
          }}
        >
          <Camera size={16} />
        </motion.button>
      </div>
    </div>
  );
};

// Progress bar
const ProgressBar = ({ total, completed, currentIndex }: { total: number; completed: number; currentIndex: number }) => (
  <div
    className="w-full flex gap-[3px] px-5"
    style={{ paddingTop: 'max(env(safe-area-inset-top, 12px), 8px)' }}
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={completed}
  >
    {Array.from({ length: total }).map((_, i) => (
      <div key={i} className="h-[5px] flex-1 rounded-full overflow-hidden" style={{ background: P.cardBorder }}>
        <motion.div
          className="h-full rounded-full origin-left"
          style={{ background: 'linear-gradient(90deg, #A855F7, #F97316)' }}
          initial={false}
          animate={{ scaleX: i < currentIndex ? 1 : i === currentIndex ? (completed % 1 || 0.02) : 0 }}
          transition={springs.layout}
        />
      </div>
    ))}
  </div>
);

// Header: Clean and colorful with no duplicate pause button
const Header = ({ onToggleSound, muted, timerSeconds, showTimer, onEnd }: any) => (
  <header className="px-4 pt-3 pb-1 flex items-center justify-between relative z-20">
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleSound}
        aria-pressed={!muted}
        className="flex items-center justify-center size-10 rounded-full border shadow-xs transition-colors"
        style={{
          background: 'linear-gradient(135deg, #EDE7F6, #DDD3F5)',
          borderColor: '#C4B5E0',
          color: '#6D28D9',
        }}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </motion.button>
    </div>

    {/* Center: Dynamic Island Timer */}
    <AnimatePresence>
      {showTimer && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.7, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="px-4 py-1.5 rounded-full font-mono font-semibold text-sm flex items-center gap-1.5 border shadow-xs"
          style={{
            background: 'linear-gradient(135deg, #EDE7F6, #FCE7F3)',
            color: '#7C5CB7',
            borderColor: '#C4B5E0',
          }}
        >
          <Timer size={13} style={{ opacity: 0.7 }} />
          {timerSeconds}s
        </motion.div>
      )}
    </AnimatePresence>

    {/* Right: Close button */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onEnd}
        aria-label="End Workout"
        className="flex items-center justify-center size-10 rounded-full border shadow-xs transition-colors"
        style={{
          background: 'linear-gradient(135deg, #FFE4E6, #FECDD3)',
          borderColor: '#FDA4AF',
          color: '#E11D48',
        }}
      >
        <X size={18} />
      </motion.button>
    </div>
  </header>
);

// Rest Block Component
export const RestBlock = ({
  timeLeft,
  totalRest = 30,
  nextExName,
}: {
  timeLeft: number;
  totalRest?: number;
  nextExName: string;
}) => {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-between p-6 relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF5EF 100%)' }}
    >
      {/* Top corner 3D interactive controls */}
      <TopCorner3DControls />

      {/* Header text with exact required wording and line return */}
      <div className="flex flex-col items-center text-center pt-2 z-10">
        <h2
          className="text-2xl font-black tracking-tight"
          style={{ color: P.text }}
        >
          Breathe for a minute
        </h2>
        <p
          className="text-sm font-semibold mt-1 tracking-wide"
          style={{ color: '#7C5CB7' }}
        >
          Take a breathing
        </p>
      </div>

      {/* Breathing Circle Container zooming in and zooming out */}
      <div className="relative flex items-center justify-center my-auto py-8">
        {/* Outer soft breathing aura (zooms in and zooms out) */}
        <motion.div
          animate={{
            scale: [1, 1.35, 1],
            opacity: [0.35, 0.75, 0.35],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute size-64 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(196, 181, 224, 0.45) 20%, rgba(248, 201, 181, 0.35) 60%, transparent 75%)',
          }}
        />

        {/* Middle pulsing ring */}
        <motion.div
          animate={{
            scale: [0.95, 1.2, 0.95],
            opacity: [0.45, 0.85, 0.45],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute size-52 rounded-full border-2 border-dashed pointer-events-none"
          style={{
            borderColor: '#9B86C6',
            background: 'rgba(237, 231, 246, 0.4)',
          }}
        />

        {/* Core Animated Breathing Circle with Timer */}
        <motion.div
          animate={{
            scale: [0.92, 1.15, 0.92],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative size-44 rounded-full flex flex-col items-center justify-center shadow-xl border-4"
          style={{
            background: 'linear-gradient(135deg, #EDE7F6 0%, #FCE7F3 100%)',
            borderColor: '#FFFFFF',
            boxShadow: '0 16px 36px -8px rgba(124, 92, 183, 0.35)',
          }}
        >
          {/* 30s Circular Countdown Progress SVG */}
          <svg className="absolute inset-0 size-full -rotate-90 p-1" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#EFE7DC"
              strokeWidth="4"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="url(#restCircleGrad)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={276.46}
              animate={{
                strokeDashoffset: 276.46 * (1 - Math.min(timeLeft / totalRest, 1)),
              }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            <defs>
              <linearGradient id="restCircleGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#F97316" />
              </linearGradient>
            </defs>
          </svg>

          {/* Countdown timer running */}
          <motion.span
            key={timeLeft}
            initial={{ scale: 1.1, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-black tabular-nums tracking-tight font-mono z-10"
            style={{ color: P.text }}
          >
            {timeLeft}
          </motion.span>
          <span
            className="text-[11px] font-bold uppercase tracking-widest mt-0.5 z-10"
            style={{ color: '#7C5CB7' }}
          >
            Seconds
          </span>
        </motion.div>
      </div>

      {/* Inhale/Exhale rhythm label */}
      <motion.div
        animate={{
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="text-xs font-black uppercase tracking-widest mb-3 z-10"
        style={{ color: '#7C5CB7' }}
      >
        Inhale · Exhale
      </motion.div>

      {/* Up Next Card */}
      <div
        className="w-full max-w-[320px] p-3.5 rounded-2xl border flex items-center gap-3 z-10 shadow-xs"
        style={{
          background: 'linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)',
          borderColor: '#86EFAC',
        }}
      >
        <div
          className="size-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#16A34A', color: '#FFFFFF' }}
        >
          <ChevronRight size={18} strokeWidth={2.8} />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span
            className="text-[10px] font-black uppercase tracking-wider block"
            style={{ color: '#15803D' }}
          >
            Up Next
          </span>
          <p className="text-sm font-bold truncate" style={{ color: '#14532D' }}>
            {nextExName}
          </p>
        </div>
      </div>
    </div>
  );
};

// Seek Backward Button: colorful lilac-indigo, placed at left side of Pause
export const SeekBackwardButton = ({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    disabled={disabled}
    aria-label="Seek backward 10 seconds"
    title="Rewind 10 seconds"
    className="flex flex-col items-center justify-center size-14 rounded-full border shadow-md transition-transform"
    style={{
      background: 'linear-gradient(135deg, #EDE7F6 0%, #D8CEF0 100%)',
      borderColor: 'rgba(155, 134, 198, 0.55)',
      color: '#6D28D9',
      boxShadow: '0 4px 14px -2px rgba(109, 40, 217, 0.22)',
    }}
  >
    <RotateCcw size={20} strokeWidth={2.4} />
    <span className="text-[10px] font-black tracking-tight leading-none mt-0.5">10s</span>
  </motion.button>
);

// Play / Pause Button: central primary playback control
export const PlayPauseButton = ({
  isPaused,
  onClick,
}: {
  isPaused: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.93 }}
    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    onClick={onClick}
    aria-label={isPaused ? 'Resume workout' : 'Pause workout'}
    title={isPaused ? 'Resume workout' : 'Pause workout'}
    className="flex items-center justify-center size-16 rounded-full font-bold text-white shadow-xl transition-all"
    style={{
      background: isPaused
        ? 'linear-gradient(135deg, #A855F7 0%, #7C3AED 100%)'
        : 'linear-gradient(135deg, #F87171 0%, #EA580C 100%)',
      boxShadow: isPaused
        ? '0 10px 28px -4px rgba(124, 58, 237, 0.45)'
        : '0 10px 28px -4px rgba(234, 88, 12, 0.45)',
    }}
  >
    {isPaused ? (
      <Play size={26} fill="currentColor" className="ml-1" />
    ) : (
      <Pause size={26} fill="currentColor" />
    )}
  </motion.button>
);

// Seek Forward Button: colorful peach-coral, placed at right side of Pause
export const SeekForwardButton = ({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    whileTap={{ scale: 0.92 }}
    onClick={onClick}
    disabled={disabled}
    aria-label="Seek forward 10 seconds"
    title="Forward 10 seconds"
    className="flex flex-col items-center justify-center size-14 rounded-full border shadow-md transition-transform"
    style={{
      background: 'linear-gradient(135deg, #FFF0EB 0%, #FED7AA 100%)',
      borderColor: 'rgba(251, 146, 60, 0.55)',
      color: '#C2410C',
      boxShadow: '0 4px 14px -2px rgba(194, 65, 12, 0.22)',
    }}
  >
    <RotateCw size={20} strokeWidth={2.4} />
    <span className="text-[10px] font-black tracking-tight leading-none mt-0.5">10s</span>
  </motion.button>
);

// Bottom Dock: Seek buttons flanking the Play/Pause button directly at its sides
const BottomDock = ({
  phase,
  displayPhase,
  exKind,
  onPrimary,
  onPause,
  onResume,
  onSeekBackward,
  onSeekForward,
  onSkip,
  nextLabel,
  isLast,
}: any) => {
  const isPaused = phase === 'paused';
  const handlePlayPause = () => {
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  return (
    <div
      className="px-5 pt-2 flex flex-col gap-2 relative z-10"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 14px), 10px)' }}
    >
      {/* Reps work phase: prominent Done Set button above controls */}
      {displayPhase === 'work' && exKind === 'reps' && !isPaused && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onPrimary}
          className="w-full h-[48px] rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md mb-1"
          style={{
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            boxShadow: '0 8px 20px -6px rgba(109, 40, 217, 0.45)',
          }}
        >
          <Check size={18} strokeWidth={3} />
          Done Set
        </motion.button>
      )}

      {/* Rest phase: Skip Rest button above controls */}
      {displayPhase === 'rest' && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onSkip}
          className="w-full h-[48px] rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md mb-1"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            boxShadow: '0 8px 20px -6px rgba(5, 150, 105, 0.45)',
          }}
        >
          <FastForward size={18} />
          Skip Rest
        </motion.button>
      )}

      {/* Symmetrical Workout Controls: SeekBackward on left, Pause in center, SeekForward on right */}
      <div className="flex items-center justify-center gap-6 py-1">
        <SeekBackwardButton onClick={onSeekBackward} />
        <PlayPauseButton isPaused={isPaused} onClick={handlePlayPause} />
        <SeekForwardButton onClick={onSeekForward} />
      </div>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="flex items-center justify-center gap-1 font-semibold text-xs h-[24px] transition-colors mt-0.5"
        style={{ color: P.textMuted }}
      >
        <FastForward size={12} />
        {isLast ? 'Finish Workout' : `Skip to ${nextLabel}`}
      </button>
    </div>
  );
};

// Main Screen
export function ActiveWorkoutScreen({ exercises, onClose }: { exercises: Exercise[]; onClose: () => void }) {
  const { state, dispatch } = useWorkoutMachine(exercises);
  const [muted, setMuted] = useState(false);

  const displayPhase = state.phase === 'paused' ? (state.resumePhase || 'ready') : state.phase;
  const ex = exercises[state.exerciseIndex];

  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (state.timerEndsAt && state.phase !== 'paused') {
        const sec = Math.max(0, Math.ceil((state.timerEndsAt - Date.now()) / 1000));
        setTimeLeft(sec);
        if (sec <= 3 && sec > 0) Haptics.tick();
        if (sec === 0 && state.phase !== 'complete') Haptics.success();
      }
    }, 100);
    return () => clearInterval(t);
  }, [state.timerEndsAt, state.phase]);

  const onNext = () => { Haptics.medium(); dispatch({ type: 'DONE_SET' }); };
  const onSkip = () => { Haptics.warn(); dispatch({ type: 'SKIP_EXERCISE' }); };
  const onSeekBackward = () => { Haptics.light(); dispatch({ type: 'SEEK_BACKWARD' }); };
  const onSeekForward = () => { Haptics.light(); dispatch({ type: 'SEEK_FORWARD' }); };

  const nextExName = exercises[state.exerciseIndex + 1]?.name || 'Finish';
  const isLast = state.exerciseIndex >= exercises.length - 1;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="flex flex-col h-dvh w-full max-w-[430px] mx-auto overflow-hidden relative select-none touch-none md:h-[calc(100dvh-2.5rem)] md:rounded-[2.5rem] md:shadow-2xl"
        style={{
          touchAction: 'none',
          fontFamily: 'var(--font-sora, Inter, system-ui, sans-serif)',
          background: 'linear-gradient(180deg, #FDFBF7 0%, #F5EFEB 100%)',
          color: P.text,
        }}
      >
        <ProgressBar total={exercises.length} completed={state.exerciseIndex} currentIndex={state.exerciseIndex} />

        <Header
          onToggleSound={() => setMuted(!muted)}
          muted={muted}
          timerSeconds={timeLeft}
          showTimer={displayPhase === 'work' && ex?.kind === 'timed'}
          onEnd={onClose}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 flex flex-col px-4 pb-2 gap-2 overflow-hidden">
          <AnimatePresence mode="popLayout" custom={state.direction} initial={false}>
            <motion.div
              key={ex?.id + displayPhase}
              custom={state.direction}
              variants={swipeVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={springs.layout}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => { if (info.offset.x < -80) onSkip(); }}
              className="flex-1 flex flex-col rounded-[28px] overflow-hidden"
              style={{
                background: '#FFFFFF',
                boxShadow: '0 8px 30px -8px rgba(61, 58, 54, 0.12), 0 1px 3px rgba(61, 58, 54, 0.05)',
                border: `1px solid ${P.cardBorder}`,
              }}
            >
              {displayPhase === 'rest' ? (
                /* Rest Block Interstitial with breathing circle and 30s countdown */
                <RestBlock
                  timeLeft={timeLeft}
                  totalRest={ex?.restSeconds || 30}
                  nextExName={nextExName}
                />
              ) : (
                <>
                  {/* Visual Animation Area */}
                  <div
                    className="flex-1 relative min-h-0"
                    style={{
                      background: 'linear-gradient(180deg, #F3F0FF 0%, #EDE9FE 50%, #FAF5FF 100%)',
                    }}
                  >
                    {ex?.rawRow && <ExerciseVisual exercise={ex.rawRow} isActive={state.phase === 'work'} />}

                    {/* Top corner 3D interactive controls: Auto Orbit, Change Environment, Lighting, Camera */}
                    <TopCorner3DControls />

                    {/* Paused Overlay */}
                    {state.phase === 'paused' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center z-30"
                        style={{ background: 'rgba(250, 247, 242, 0.7)', backdropFilter: 'blur(8px)' }}
                      >
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <div
                            className="size-16 rounded-full flex items-center justify-center shadow-xl"
                            style={{ background: 'linear-gradient(135deg, #A855F7, #7C3AED)' }}
                          >
                            <Pause size={28} className="text-white" fill="white" />
                          </div>
                          <span className="text-sm font-black uppercase tracking-wider" style={{ color: '#6D28D9' }}>
                            Paused
                          </span>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>

                  {/* Data Panel with warm colorful accents */}
                  <div
                    className="px-4 py-3"
                    style={{
                      background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFBF8 100%)',
                      borderTop: `1px solid ${P.cardBorder}`,
                    }}
                  >
                    {ex && (
                      <div className="flex items-center justify-between gap-3">
                        {/* Left: Exercise info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: '#7C5CB7' }}>
                              Set {state.setIndex + 1}/{ex.sets}
                            </span>
                            <div className="flex gap-1 ml-1">
                              {Array.from({ length: ex.sets }).map((_, i) => (
                                <div
                                  key={i}
                                  className="size-1.5 rounded-full transition-colors"
                                  style={{
                                    background: i < state.setIndex ? '#C4B5E0' : i === state.setIndex ? '#7C3AED' : '#E5E7EB',
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-[15px] font-bold truncate leading-tight" style={{ color: P.text }}>
                            {ex.name}
                          </p>
                        </div>

                        {/* Right: Count */}
                        <div className="flex items-baseline gap-1 shrink-0">
                          {ex.kind === 'reps' ? (
                            <>
                              <span className="text-2xl font-black tabular-nums" style={{ color: P.text }}>{ex.targetReps}</span>
                              <span className="text-xs font-bold uppercase" style={{ color: '#78716C' }}>reps</span>
                              {ex.weight && (
                                <span
                                  className="ml-1.5 px-2 py-0.5 rounded-md text-xs font-black shadow-xs"
                                  style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC' }}
                                >
                                  {ex.weight.value}{ex.weight.unit}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="text-2xl font-black tabular-nums" style={{ color: P.text }}>{timeLeft}</span>
                              <span className="text-xs font-bold uppercase" style={{ color: '#78716C' }}>sec</span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Dock with PlayPauseButton, SeekBackwardButton, SeekForwardButton side by side */}
        <BottomDock
          phase={state.phase}
          displayPhase={displayPhase}
          exKind={ex?.kind}
          onPrimary={onNext}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onResume={() => dispatch({ type: 'RESUME' })}
          onSeekBackward={onSeekBackward}
          onSeekForward={onSeekForward}
          onSkip={onSkip}
          nextLabel={nextExName}
          isLast={isLast}
        />

        {/* Undo Toast */}
        <AnimatePresence>
          {state.undoToastVisible && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-28 left-4 right-4 p-3.5 rounded-2xl flex justify-between items-center shadow-xl z-30"
              style={{ background: '#292524', color: '#FAF7F2' }}
            >
              <span className="text-sm font-medium">Set completed</span>
              <button onClick={() => dispatch({ type: 'UNDO' })} className="flex items-center gap-1.5 font-bold text-sm" style={{ color: '#C4B5E0' }}>
                <Undo size={16} /> Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
