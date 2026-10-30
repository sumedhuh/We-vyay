import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { Pause, Play, Volume2, VolumeX, FastForward, Check, Undo, HelpCircle, X, ChevronRight, Timer } from 'lucide-react';
import { springs, swipeVariants } from '../../lib/motion';
import { useWorkoutMachine, Exercise } from '../../hooks/useWorkoutMachine';
import { Haptics } from '../../services/haptics';
import { ExerciseVisual } from './ExerciseVisual';

const cn = (...classes: string[]) => classes.filter(Boolean).join(' ');

/* ─── Pastel palette tokens ─── */
const P = {
  bg: '#FAF7F2',          // warm off-white / parchment
  card: '#FFFFFF',
  cardBorder: '#F0EBE3',
  lilac: '#C4B5E0',       // soft lilac
  lilacDeep: '#9B86C6',
  lilacSoft: '#EDE7F6',
  green: '#B8D8BA',       // pale green
  greenDeep: '#7FB885',
  greenSoft: '#E8F5E9',
  peach: '#F8C9B5',       // light peach
  peachDeep: '#E8A68C',
  peachSoft: '#FFF0EB',
  yellow: '#F5E1A4',      // muted yellow
  yellowSoft: '#FFF9E6',
  text: '#3D3A36',        // warm charcoal
  textSoft: '#8E8880',    // muted warm grey
  textMuted: '#B5AFA7',
};

// --- PROGRESS BAR ---
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
          style={{ background: `linear-gradient(90deg, ${P.lilac}, ${P.peach})` }}
          initial={false}
          animate={{ scaleX: i < currentIndex ? 1 : i === currentIndex ? (completed % 1 || 0.02) : 0 }}
          transition={springs.layout}
        />
      </div>
    ))}
  </div>
);

// --- HEADER ---
const Header = ({ onPause, onToggleSound, muted, timerSeconds, showTimer, onEnd, isPaused }: any) => (
  <header className="px-4 pt-3 pb-1 flex items-center justify-between relative z-20">
    {/* Left: Pause/Play */}
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onPause}
      aria-label={isPaused ? 'Resume' : 'Pause'}
      className="flex items-center justify-center size-10 rounded-full border transition-colors"
      style={{ background: 'rgba(255,255,255,0.7)', borderColor: P.cardBorder, color: P.text }}
    >
      {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
    </motion.button>

    {/* Center: Dynamic Island Timer */}
    <AnimatePresence>
      {showTimer && (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.7, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.7, y: -8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="px-4 py-1.5 rounded-full font-mono font-semibold text-sm flex items-center gap-1.5 border"
          style={{ background: P.lilacSoft, color: P.lilacDeep, borderColor: P.lilac + '40' }}
        >
          <Timer size={13} style={{ opacity: 0.6 }} />
          {timerSeconds}s
        </motion.div>
      )}
    </AnimatePresence>

    {/* Right: Sound + Close */}
    <div className="flex items-center gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onToggleSound}
        aria-pressed={!muted}
        className="flex items-center justify-center size-10 rounded-full border transition-colors"
        style={{ background: 'rgba(255,255,255,0.7)', borderColor: P.cardBorder, color: P.text }}
      >
        {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onEnd}
        aria-label="End Workout"
        className="flex items-center justify-center size-10 rounded-full border transition-colors"
        style={{ background: P.peachSoft, borderColor: P.peach + '60', color: P.peachDeep }}
      >
        <X size={18} />
      </motion.button>
    </div>
  </header>
);

// --- MAIN SCREEN ---
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

  const nextExName = exercises[state.exerciseIndex + 1]?.name || 'Finish';
  const isLast = state.exerciseIndex >= exercises.length - 1;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="flex flex-col h-dvh w-full max-w-[430px] mx-auto overflow-hidden relative select-none touch-none md:h-[calc(100dvh-2.5rem)] md:rounded-[2.5rem] md:shadow-2xl"
        style={{
          touchAction: 'none',
          fontFamily: 'var(--font-sora, Inter, system-ui, sans-serif)',
          background: P.bg,
          color: P.text,
        }}
      >
        <ProgressBar total={exercises.length} completed={state.exerciseIndex} currentIndex={state.exerciseIndex} />

        <Header
          onPause={() => dispatch({ type: state.phase === 'paused' ? 'RESUME' : 'PAUSE' })}
          onToggleSound={() => setMuted(!muted)}
          muted={muted}
          timerSeconds={timeLeft}
          showTimer={displayPhase === 'work' && ex?.kind === 'timed'}
          onEnd={onClose}
          isPaused={state.phase === 'paused'}
        />

        {/* ─── Main Content Area ─── */}
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
                background: P.card,
                boxShadow: '0 6px 24px -8px rgba(61, 58, 54, 0.08), 0 1px 3px rgba(61, 58, 54, 0.04)',
                border: `1px solid ${P.cardBorder}`,
              }}
            >
              {/* ─── 3D Animation Area ─── */}
              <div className="flex-1 relative min-h-0" style={{ background: P.yellowSoft }}>
                {ex?.rawRow && <ExerciseVisual exercise={ex.rawRow} isActive={state.phase === 'work'} />}

                {/* Form Cue Badge */}
                {displayPhase === 'work' && ex?.cues && ex.cues[0] && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={springs.alert}
                    style={{
                      transformOrigin: 'top right',
                      background: P.yellowSoft,
                      borderColor: P.yellow,
                      color: '#9E8A4F',
                    }}
                    className="absolute top-3 right-3 border px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <HelpCircle size={14} /> {ex.cues[0].text}
                  </motion.div>
                )}

                {/* Paused Overlay */}
                {state.phase === 'paused' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center z-10"
                    style={{ background: 'rgba(250, 247, 242, 0.65)', backdropFilter: 'blur(6px)' }}
                  >
                    <motion.div
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className="size-14 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: P.lilac }}
                      >
                        <Pause size={24} className="text-white" fill="white" />
                      </div>
                      <span className="text-sm font-bold uppercase tracking-wider" style={{ color: P.textSoft }}>
                        Paused
                      </span>
                    </motion.div>
                  </motion.div>
                )}
              </div>

              {/* ─── Data Panel ─── */}
              <div className="px-4 py-3" style={{ background: P.card, borderTop: `1px solid ${P.cardBorder}` }}>
                {displayPhase === 'work' && ex && (
                  <div className="flex items-center justify-between gap-3">
                    {/* Left: Exercise info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: P.textMuted }}>
                          Set {state.setIndex + 1}/{ex.sets}
                        </span>
                        <div className="flex gap-1 ml-1">
                          {Array.from({ length: ex.sets }).map((_, i) => (
                            <div
                              key={i}
                              className="size-1.5 rounded-full transition-colors"
                              style={{
                                background: i < state.setIndex ? P.lilac : i === state.setIndex ? P.lilacDeep : P.cardBorder,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-[15px] font-semibold truncate leading-tight" style={{ color: P.text }}>
                        {ex.name}
                      </p>
                    </div>

                    {/* Right: Count */}
                    <div className="flex items-baseline gap-1 shrink-0">
                      {ex.kind === 'reps' ? (
                        <>
                          <span className="text-2xl font-extrabold tabular-nums" style={{ color: P.text }}>{ex.targetReps}</span>
                          <span className="text-xs font-bold uppercase" style={{ color: P.textMuted }}>reps</span>
                          {ex.weight && (
                            <span
                              className="ml-1.5 px-1.5 py-0.5 rounded-md text-xs font-bold"
                              style={{ background: P.greenSoft, color: P.greenDeep }}
                            >
                              {ex.weight.value}{ex.weight.unit}
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-2xl font-extrabold tabular-nums" style={{ color: P.text }}>{timeLeft}</span>
                          <span className="text-xs font-bold uppercase" style={{ color: P.textMuted }}>sec</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {displayPhase === 'rest' && (
                  <div className="flex flex-col gap-2.5">
                    {/* Rest Timer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <motion.span
                          key={timeLeft}
                          initial={{ scale: 1.15, opacity: 0.7 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-3xl font-extrabold tabular-nums"
                          style={{ color: P.lilacDeep }}
                        >
                          {timeLeft}
                        </motion.span>
                        <span className="text-sm font-bold" style={{ color: P.textMuted }}>sec rest</span>
                      </div>
                      {/* Mini progress ring */}
                      <div className="size-9 relative">
                        <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="14" fill="none" stroke={P.cardBorder} strokeWidth="3" />
                          <motion.circle
                            cx="18" cy="18" r="14"
                            fill="none"
                            stroke="url(#restGradPastel)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeDasharray={88}
                            animate={{ strokeDashoffset: 88 * (1 - Math.min(timeLeft / 30, 1)) }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                          />
                          <defs>
                            <linearGradient id="restGradPastel" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor={P.lilac} />
                              <stop offset="100%" stopColor={P.peach} />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>

                    {/* Up Next Card */}
                    <div
                      className="flex items-center gap-3 p-2.5 rounded-2xl border"
                      style={{ background: P.greenSoft, borderColor: P.green + '40' }}
                    >
                      <div
                        className="size-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: P.green + '50' }}
                      >
                        <ChevronRight size={16} style={{ color: P.greenDeep }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: P.textMuted }}>Up next</p>
                        <p className="text-sm font-semibold truncate" style={{ color: P.text }}>{nextExName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ─── Bottom Dock ─── */}
        <BottomDock
          phase={state.phase}
          displayPhase={displayPhase}
          exKind={ex?.kind}
          onPrimary={onNext}
          onPause={() => dispatch({ type: 'PAUSE' })}
          onResume={() => dispatch({ type: 'RESUME' })}
          onSkip={onSkip}
          onEnd={onClose}
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
              style={{ background: P.text, color: P.bg }}
            >
              <span className="text-sm font-medium">Set completed</span>
              <button onClick={() => dispatch({ type: 'UNDO' })} className="flex items-center gap-1.5 font-bold text-sm" style={{ color: P.lilac }}>
                <Undo size={16} /> Undo
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}

// --- BOTTOM DOCK ---
const BottomDock = ({ phase, displayPhase, exKind, onPrimary, onPause, onResume, onSkip, onEnd, nextLabel, isLast }: any) => {
  const handlePrimary = () => {
    if (phase === 'paused') return onResume();
    if (phase === 'work' && exKind === 'timed') return onPause();
    if (phase === 'rest') return onSkip();
    return onPrimary();
  };

  const getButton = () => {
    if (phase === 'paused') return { icon: <Play size={20} />, text: 'Resume', bg: `linear-gradient(135deg, ${P.lilac}, ${P.lilacDeep})`, shadow: P.lilac + '40' };
    if (phase === 'work' && exKind === 'timed') return { icon: <Pause size={20} />, text: 'Pause', bg: `linear-gradient(135deg, ${P.peach}, ${P.peachDeep})`, shadow: P.peach + '40' };
    if (phase === 'work') return { icon: <Check size={20} strokeWidth={3} />, text: 'Done', bg: `linear-gradient(135deg, ${P.lilac}, ${P.lilacDeep})`, shadow: P.lilac + '40' };
    if (phase === 'rest') return { icon: <FastForward size={20} />, text: 'Skip Rest', bg: `linear-gradient(135deg, ${P.green}, ${P.greenDeep})`, shadow: P.green + '40' };
    return { icon: <Play size={20} />, text: 'Start', bg: `linear-gradient(135deg, ${P.lilac}, ${P.lilacDeep})`, shadow: P.lilac + '40' };
  };

  const btn = getButton();

  return (
    <div className="px-5 pt-2 flex flex-col gap-2 relative z-10" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 14px), 10px)' }}>
      <motion.button
        whileTap={{ scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        onClick={handlePrimary}
        className="w-full h-[56px] rounded-2xl font-bold text-base text-white flex items-center justify-center gap-2"
        style={{
          background: btn.bg,
          boxShadow: `0 8px 24px -6px ${btn.shadow}`,
        }}
      >
        {btn.icon}
        {btn.text}
      </motion.button>

      {/* Skip link */}
      <button
        onClick={onSkip}
        className="flex items-center justify-center gap-1 font-semibold text-xs h-[28px] transition-colors"
        style={{ color: P.textMuted }}
      >
        <FastForward size={12} />
        {isLast ? 'Finish Workout' : `Skip to ${nextLabel}`}
      </button>
    </div>
  );
};
