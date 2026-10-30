"use client";

import { memo, useId } from "react";
import { motion } from "framer-motion";
import { Check, Pipette } from "lucide-react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

/** Swatch row + native eyedropper input, used for every color in Settings. */
export const ColorField = memo(function ColorField({
  label,
  hint,
  value,
  presets,
  onChange,
}: {
  label: string;
  hint?: string;
  value: string;
  presets: { name: string; hex: string }[];
  onChange: (hex: string) => void;
}) {
  const id = useId();

  return (
    <div className="surface-solid rounded-[1.4rem] p-3.5">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-ink dark:text-snow">{label}</p>
          {hint && (
            <p className="text-[10.5px] text-ink/45 dark:text-snow/40">{hint}</p>
          )}
        </div>
        {/* native color picker — any color at all */}
        <label
          htmlFor={id}
          className="relative flex size-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-white/70 shadow-inner ring-1 ring-black/10 dark:border-white/20"
          style={{ background: value }}
          title="Pick a custom color"
        >
          <Pipette className="size-4 text-white mix-blend-difference" aria-hidden />
          <input
            id={id}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => haptic("selection")}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label={`${label} custom color`}
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => {
          const active = p.hex.toLowerCase() === value.toLowerCase();
          return (
            <motion.button
              key={p.hex}
              type="button"
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                haptic("selection");
                onChange(p.hex);
              }}
              aria-label={p.name}
              aria-pressed={active}
              title={p.name}
              className={cn(
                "relative flex size-9 cursor-pointer items-center justify-center rounded-full outline-none ring-offset-2 transition-transform focus-visible:ring-2 focus-visible:ring-ink/40 dark:ring-offset-graphite dark:focus-visible:ring-white/50",
                active && "scale-110",
              )}
              style={{ background: p.hex }}
            >
              {active && (
                <motion.span
                  layoutId={`swatch-${label}`}
                  className="absolute inset-0 rounded-full ring-2 ring-ink/50 dark:ring-white/70"
                  transition={{ type: "spring", stiffness: 520, damping: 36 }}
                />
              )}
              {active && <Check className="relative size-4 text-white drop-shadow" aria-hidden />}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
});
