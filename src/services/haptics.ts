export const Haptics = {
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10);
  },
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(20);
  },
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([15, 50, 20]);
  },
  warn: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 40, 30]);
  },
  tick: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(5);
  },
};
