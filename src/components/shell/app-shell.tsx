"use client";

import { useEffect, useState, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, X, User, Users } from "lucide-react";
import { useUiStore, type TabId } from "@/stores/ui-store";
import { usePetStore } from "@/stores/pet-store";
import { useSettingsStore } from "@/stores/settings-store";
import { BottomNav, NAV_TABS } from "./bottom-nav";
import { ThemeToggle } from "./theme-toggle";
import { ToastRail } from "./toasts";
import { PetCameo } from "@/components/pets/pet-cameo";
import { ThemeVars } from "./theme-vars";
import { cn } from "@/lib/utils";
import { ProSheet } from "@/components/pro/pro-screen";
import { MomentumLoader } from "@/components/loading/momentum-loader";
import dynamic from "next/dynamic";

function TabSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-4 p-4 animate-pulse pt-8">
      <div className="h-48 w-full rounded-[2rem] bg-white/5" />
      <div className="h-32 w-full rounded-3xl bg-white/5" />
      <div className="h-32 w-full rounded-3xl bg-white/5" />
    </div>
  );
}

const PetsScreen = dynamic(() => import("@/components/pets/pets-screen").then(mod => mod.PetsScreen), {
  loading: () => <TabSkeleton />,
});
const FeedScreen = dynamic(() => import("@/components/feed/feed-screen").then(mod => mod.FeedScreen), {
  loading: () => <TabSkeleton />,
});
const StudioScreen = dynamic(() => import("@/components/studio/studio-screen").then(mod => mod.StudioScreen), {
  loading: () => <TabSkeleton />,
});
const CommunityScreen = () => {
  return (
    <div className="flex h-[calc(100vh-200px)] w-full flex-col items-center justify-center text-center px-6">
      <Users className="size-16 text-ink/20 dark:text-snow/20" />
      <p className="mt-4 text-[13px] font-bold text-ink/40 dark:text-snow/40 uppercase tracking-widest">
        content is coming here
      </p>
    </div>
  );
};

const SettingsScreen = dynamic(() => import("@/components/settings/settings-screen").then(mod => mod.SettingsScreen), {
  loading: () => <TabSkeleton />,
});
const MyWorkoutsScreen = dynamic(() => import("@/components/workouts/my-workouts-screen").then(mod => mod.MyWorkoutsScreen), {
  loading: () => <TabSkeleton />,
});
const ProfileScreen = dynamic(() => import("@/components/profile/profile-screen").then(mod => mod.ProfileScreen), {
  loading: () => <TabSkeleton />,
});

const SCREENS: Record<TabId, ReactNode> = {
  pets: <PetsScreen />,
  feed: <FeedScreen />,
  community: <CommunityScreen />,
  settings: <SettingsScreen />,
  workouts: <MyWorkoutsScreen />,
};

function KeepAliveTab({
  id,
  activeId,
  children,
}: {
  id: TabId;
  activeId: TabId;
  children: ReactNode;
}) {
  const isActive = id === activeId;
  const [isCached, setIsCached] = useState(isActive);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (isActive && !isCached) {
    setIsCached(true);
  }

  useEffect(() => {
    if (isActive) {
      if (timerRef.current) clearTimeout(timerRef.current);
    } else {
      if (isCached) {
        timerRef.current = setTimeout(() => {
          setIsCached(false);
        }, 10000); // Remove from cache after 10 seconds
      }
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isActive, isCached]);

  if (!isCached) return null;

  return (
    <section
      id={`panel-${id}`}
      role="tabpanel"
      aria-labelledby={`tab-${id}`}
      hidden={!isActive}
      className={cn(
        "no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain px-5 pb-36 pt-2",
        isActive ? "block" : "hidden",
      )}
    >
      {children}
    </section>
  );
}

/**
 * App canvas: a phone-class column centered on desktop with ambient set
 * dressing around it. Screens stay mounted (hidden, not unmounted) so tab
 * switches are truly zero-lag — scroll positions and local state survive.
 */
export function AppShell() {
  const [hydrated, setHydrated] = useState(false);
  const activeTab = useUiStore((s) => s.activeTab);
  const studioOpen = useUiStore((s) => s.studioOpen);
  const closeStudio = useUiStore((s) => s.closeStudio);
  const profileOpen = useUiStore((s) => s.profileOpen);
  const openProfile = useUiStore((s) => s.openProfile);
  const closeProfile = useUiStore((s) => s.closeProfile);
  const streak = usePetStore((s) => s.streak);
  const touchDaily = usePetStore((s) => s.touchDaily);

  useEffect(() => {
    setHydrated(true);
    touchDaily(); // streak bookkeeping runs once per session, offline-safe
  }, [touchDaily]);

  // Before hydration, render the deterministic default (feed) so server and
  // client markup match; persisted tab resumes a frame later.
  const active: TabId = hydrated ? activeTab : "feed";

  return (
    <main className="relative flex min-h-dvh items-center justify-center">
      <ThemeVars />
      {/* ambient orbs behind the canvas (desktop set dressing) */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-drift absolute -left-32 top-[8%] size-[26rem] rounded-full bg-mint/50 blur-3xl dark:bg-grape/25" />
        <div className="animate-float-slow absolute -right-24 bottom-[4%] size-[22rem] rounded-full bg-mist/70 blur-3xl dark:bg-iris/20" />
      </div>

      {/* editorial rails — desktop only */}
      <div aria-hidden className="pointer-events-none fixed bottom-10 left-10 hidden max-w-52 select-none lg:block">
        <p className="font-display text-4xl italic leading-[1.05] text-ink/80 dark:text-snow/75">
          move
          <br />
          together.
        </p>
        <p className="mt-3 text-[11px] font-medium uppercase tracking-[0.22em] text-ink/40 dark:text-snow/35">
          Social fitness, zero lag
        </p>
      </div>
      <div aria-hidden className="pointer-events-none fixed bottom-10 right-10 hidden select-none text-right lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink/40 dark:text-snow/35">
          vyay club
        </p>
        <p className="font-display mt-2 text-2xl italic text-ink/70 dark:text-snow/60">est. 2026</p>
      </div>

      {/* the app canvas */}
      <div className="surface-solid relative flex h-dvh w-full max-w-[430px] flex-col overflow-hidden shadow-2xl md:my-5 md:h-[calc(100dvh-2.5rem)] md:rounded-[2.5rem] md:border md:border-black/10 dark:md:border-white/10">
        {/* header */}
        <header className="relative z-30 flex items-center justify-between px-5 pb-2 pt-[max(1.1rem,env(safe-area-inset-top))]">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-[26px] italic leading-none text-ink dark:text-snow">
              vyay
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.28em] text-ink/40 dark:text-snow/40">
              club
            </span>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile avatar button */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={openProfile}
              aria-label="View profile"
              className="flex size-10 items-center justify-center rounded-full border border-black/8 dark:border-white/10 bg-black/4 dark:bg-white/5 outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/50"
            >
              <User className="size-4.5 text-ink/60 dark:text-snow/60" aria-hidden />
            </motion.button>
            <PetCameo size={28} showMessage={false} />
            <motion.div
              layout
              className="surface-solid flex h-10 items-center gap-1.5 rounded-full px-3 text-[13px] font-bold text-ink dark:text-snow"
              title="Daily streak"
            >
              <Flame className="size-5 text-[#FF8C00] fill-[#FF8C00]/20" />
              <span aria-label={`${hydrated ? streak : 1} day streak`}>
                {hydrated ? streak : 1}
              </span>
            </motion.div>
            <ThemeToggle />
          </div>
        </header>

        {/* keep-alive panels */}
        <div className="relative min-h-0 flex-1">
          {NAV_TABS.map((t) => (
            <KeepAliveTab key={t.id} id={t.id} activeId={active}>
              {SCREENS[t.id]}
            </KeepAliveTab>
          ))}
        </div>

        <ToastRail />
        <ProSheet />

        {/* Global Momentum Loader — driven by loader-store, shown over the whole canvas */}
        <MomentumLoader />

        {/* Studio overlay */}
        <AnimatePresence>
          {studioOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="absolute inset-0 z-50 overflow-y-auto overscroll-contain bg-paper px-5 pb-36 pt-4 dark:bg-void no-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={closeStudio}
                  className="flex size-8 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <X className="size-4 text-ink dark:text-snow" />
                </button>
              </div>
              <StudioScreen />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile overlay */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="absolute inset-0 z-50 overflow-y-auto overscroll-contain bg-paper px-5 pb-36 pt-4 dark:bg-void no-scrollbar"
            >
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={closeProfile}
                  aria-label="Close profile"
                  className="flex size-8 items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <X className="size-4 text-ink dark:text-snow" />
                </button>
                <span className="text-[13px] font-bold text-ink/60 dark:text-snow/60">Profile</span>
                <div className="size-8" aria-hidden />
              </div>
              <ProfileScreen />
            </motion.div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </main>
  );
}
