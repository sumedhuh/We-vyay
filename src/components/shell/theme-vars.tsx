"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { buildRamp } from "@/lib/color";

/**
 * Writes the user's accent ramps onto :root as CSS custom properties.
 * Tailwind's theme tokens (`--color-mint`, `--color-grape`, …) are declared
 * as `var(--u-*)`, so changing these repaints every gradient, ring, chart and
 * button in one style recalculation — no re-render, no reload.
 */
export function ThemeVars() {
  const lightAccent = useSettingsStore((s) => s.lightAccent);
  const darkAccent = useSettingsStore((s) => s.darkAccent);
  const avatarColor = useSettingsStore((s) => s.avatarColor);

  useEffect(() => {
    const root = document.documentElement;
    const light = buildRamp(lightAccent);
    const dark = buildRamp(darkAccent);

    // light-mode ramp (mint family by default)
    root.style.setProperty("--u-mint", light.base);
    root.style.setProperty("--u-mint-strong", light.strong);
    root.style.setProperty("--u-mint-deep", light.deep);
    root.style.setProperty("--u-mist", light.tint);
    root.style.setProperty("--u-foam", light.soft);

    // dark-mode ramp (purple family by default)
    root.style.setProperty("--u-grape", dark.base);
    root.style.setProperty("--u-iris", dark.deep);
    root.style.setProperty("--u-amethyst", dark.strong);
    root.style.setProperty("--u-lilac", dark.tint);

    root.style.setProperty("--u-avatar", avatarColor);
  }, [lightAccent, darkAccent, avatarColor]);

  return null;
}
