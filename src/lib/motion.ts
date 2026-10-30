import { Variants } from 'framer-motion';

export const springs = {
  ui: { type: 'spring', stiffness: 500, damping: 36, mass: 0.8 },
  layout: { type: 'spring', stiffness: 380, damping: 34 },
  alert: { type: 'spring', stiffness: 420, damping: 28 },
} as const;

export const swipeVariants: Variants = {
  enter: (direction: number) => ({ x: direction * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -48, opacity: 0 }),
};
