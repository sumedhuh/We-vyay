"use client";

/**
 * Web-native haptics mirroring expo-haptics / react-native-haptic-feedback.
 * Uses the Vibration API where available (Android Chrome, etc.); silently
 * degrades on platforms without support (iOS Safari) — gestures still give
 * full visual spring feedback.
 */
type HapticStyle = "light" | "medium" | "heavy" | "success" | "selection";

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 22,
  success: [10, 40, 18],
  selection: 4,
};

export function haptic(style: HapticStyle = "light") {
  if (typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    /* haptics are a progressive enhancement — never throw in a gesture path */
  }
}
