"use client";

import { memo, useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import type { AnimationKind } from "@/db/schema";
import { animationUrl } from "@/lib/queries/animations";
import { cn } from "@/lib/utils";

/**
 * Renders any uploaded asset by kind. Lottie is code-split — `lottie-web`
 * only enters the bundle when a Lottie asset actually mounts, and the
 * instance is destroyed on unmount so long feeds never leak animation loops.
 */
export const AnimationPlayer = memo(function AnimationPlayer({
  id,
  kind,
  name,
  className,
}: {
  id: string;
  kind: AnimationKind;
  name: string;
  className?: string;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);
  const url = animationUrl(id);

  useEffect(() => {
    if (kind !== "lottie") return;
    let anim: AnimationItem | null = null;
    let cancelled = false;

    (async () => {
      try {
        const [{ default: lottie }, res] = await Promise.all([
          import("lottie-web"),
          fetch(url),
        ]);
        if (cancelled || !holder.current) return;
        const animationData = await res.json();
        if (cancelled || !holder.current) return;

        anim = lottie.loadAnimation({
          container: holder.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData,
        });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      anim?.destroy(); // critical: prevents rAF loops piling up across renders
    };
  }, [kind, url]);

  if (failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-ink/5 text-[9px] font-bold text-ink/40 dark:bg-white/8 dark:text-snow/40",
          className,
        )}
      >
        n/a
      </div>
    );
  }

  if (kind === "video") {
    return (
      <video
        src={url}
        className={cn("object-cover", className)}
        autoPlay
        loop
        muted
        playsInline
        aria-label={name}
        onError={() => setFailed(true)}
      />
    );
  }

  if (kind === "lottie") {
    return <div ref={holder} className={className} role="img" aria-label={name} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={name}
      className={cn("object-cover", className)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
});
