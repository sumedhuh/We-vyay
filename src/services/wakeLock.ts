let wakeLock: WakeLockSentinel | null = null;

export const WakeLockService = {
  request: async () => {
    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      try {
        wakeLock = await (navigator as any).wakeLock.request('screen'); // Note: TypeScript lacks a built-in type for WakeLock, casting is required
      } catch (err) {
        console.error('WakeLock failed', err);
      }
    }
  },
  release: () => {
    if (wakeLock !== null) {
      wakeLock.release().then(() => { wakeLock = null; });
    }
  },
};
