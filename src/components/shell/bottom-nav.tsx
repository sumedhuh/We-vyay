"use client";

import { memo, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  type Transition,
} from "framer-motion";
import { PawPrint, Activity, Users, Settings2, type LucideIcon } from "lucide-react";
import { useUiStore, type TabId } from "@/stores/ui-store";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const NAV_TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: "feed", label: "Feed", icon: Activity },
  { id: "pets", label: "Pets", icon: PawPrint },
  { id: "community", label: "Community", icon: Users },
  { id: "settings", label: "Settings", icon: Settings2 },
];

/**
 * The spring is the whole feel of the nav:
 *  - stiffness 520 gives the pill a fast 90%-of-travel response (~90ms),
 *  - damping 38 leaves just enough energy for a whisper of overshoot,
 *  - mass 0.85 keeps the inertia light so the label "catches up" to the icon
 *    instead of dragging behind it.
 * Because framer-motion integrates velocity between layout changes, rapid
 * tab-hopping never restarts from zero - the pill glides continuously.
 */
const PILL_SPRING: Transition = { type: "spring", stiffness: 520, damping: 38, mass: 0.85 };
const LABEL_SPRING: Transition = { type: "spring", stiffness: 640, damping: 42, mass: 0.7 };

const NavButton = memo(function NavButton({
  id,
  label,
  icon: Icon,
  active,
  onPress,
}: {
  id: TabId;
  label: string;
  icon: LucideIcon;
  active: boolean;
  onPress: (id: TabId) => void;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`panel-${id}`}
      id={`tab-${id}`}
      aria-label={label}
      onClick={() => onPress(id)}
      className={cn(
        "relative flex h-11 cursor-pointer items-center justify-center rounded-full outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
        active
          ? "w-[110px] bg-white text-ink shadow-sm dark:bg-black dark:text-snow"
          : "w-[52px] text-ink/60 hover:bg-black/5 hover:text-ink dark:text-snow/60 dark:hover:bg-white/10 dark:hover:text-snow"
      )}
      whileTap={reduce ? undefined : { scale: 0.9 }}
      transition={PILL_SPRING}
    >
      <span className="relative z-10 flex items-center justify-center gap-1.5">
        <Icon
          className="size-[22px]"
          strokeWidth={active ? 2.5 : 2}
          aria-hidden
        />
        <AnimatePresence initial={false} mode="wait">
          {active && (
            <motion.span
              key="label"
              initial={{ width: 0, opacity: 0, x: -4 }}
              animate={{ width: "auto", opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: -4 }}
              transition={reduce ? { duration: 0.12 } : LABEL_SPRING}
              className="overflow-hidden whitespace-nowrap text-[13px] font-semibold tracking-tight"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </motion.button>
  );
});

export function BottomNav() {
  const activeTab = useUiStore((s) => s.activeTab);
  const setTab = useUiStore((s) => s.setTab);
  const reduce = useReducedMotion();

  const handlePress = useCallback(
    (id: TabId) => {
      haptic("selection");
      setTab(id);
    },
    [setTab],
  );

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <motion.div
        role="tablist"
        aria-label="App sections"
        initial={reduce ? false : { y: 56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...PILL_SPRING, delay: 0.15 }}
        className="surface shadow-soft pointer-events-auto flex items-center gap-1 rounded-full p-1.5"
      >
        {NAV_TABS.map((t) => (
          <NavButton
            key={t.id}
            id={t.id}
            label={t.label}
            icon={t.icon}
            active={activeTab === t.id}
            onPress={handlePress}
          />
        ))}
      </motion.div>
    </nav>
  );
}
