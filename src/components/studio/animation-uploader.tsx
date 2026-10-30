"use client";

import { memo, useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, Trash2, Check, Film, Loader2 } from "lucide-react";
import type { AnimationMeta } from "@/db/schema";
import {
  useAnimationsQuery,
  useUploadAnimation,
  useDeleteAnimation,
} from "@/lib/queries/animations";
import { AnimationPlayer } from "@/components/media/animation-player";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const ACCEPT = ".gif,.webp,.png,.apng,.jpg,.jpeg,.svg,.mp4,.webm,.json";

const LibraryTile = memo(function LibraryTile({
  anim,
  selected,
  onPick,
  onDelete,
}: {
  anim: AnimationMeta;
  selected: boolean;
  onPick: (a: AnimationMeta) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.86 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.86 }}
      transition={{ type: "spring", stiffness: 480, damping: 34 }}
      className="relative"
    >
      <button
        type="button"
        onClick={() => onPick(anim)}
        aria-pressed={selected}
        aria-label={`Use ${anim.name}`}
        className={cn(
          "group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-[1.1rem] border outline-none focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
          selected
            ? "border-mint-deep/70 ring-2 ring-mint-deep/40 dark:border-amethyst/70 dark:ring-amethyst/40"
            : "border-ink/10 dark:border-white/12",
        )}
      >
        <AnimationPlayer
          id={anim.id}
          kind={anim.kind}
          name={anim.name}
          className="size-full bg-ink/[0.04] object-cover dark:bg-white/[0.06]"
        />
        <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/75 to-transparent px-1.5 pb-1 pt-4 text-[9px] font-bold text-white">
          {anim.name}
        </span>
        {selected && (
          <span className="absolute left-1.5 top-1.5 flex size-5 items-center justify-center rounded-full bg-mint-deep text-white dark:bg-amethyst">
            <Check className="size-3" aria-hidden />
          </span>
        )}
      </button>
      <button
        type="button"
        onClick={() => {
          haptic("medium");
          onDelete(anim.id);
        }}
        aria-label={`Delete ${anim.name}`}
        className="absolute right-1.5 top-1.5 flex size-6 cursor-pointer items-center justify-center rounded-full bg-black/45 text-white/85 outline-none backdrop-blur transition-colors hover:bg-red-500"
      >
        <Trash2 className="size-3" aria-hidden />
      </button>
    </motion.div>
  );
});

export const AnimationUploader = memo(function AnimationUploader({
  selectedId,
  onPick,
}: {
  selectedId: string | null;
  onPick: (a: AnimationMeta, fromUpload: boolean) => void;
}) {
  const { data: library = [], isPending } = useAnimationsQuery();
  const upload = useUploadAnimation();
  const del = useDeleteAnimation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pickFromLibrary = useCallback(
    (a: AnimationMeta) => onPick(a, false),
    [onPick],
  );
  // nested dragenter/dragleave events fire constantly; depth counting keeps
  // the highlight stable instead of flickering over child nodes
  const depth = useRef(0);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      setError(null);
      haptic("medium");
      upload.mutate(file, {
        onSuccess: (created) => {
          haptic("success");
          onPick(created, true); // auto-attach the freshly uploaded animation
        },
        onError: (e) => setError(e.message),
      });
    },
    [upload, onPick],
  );

  return (
    <div>
      {/* drag & drop icon zone */}
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          depth.current += 1;
          setDragOver(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          depth.current -= 1;
          if (depth.current <= 0) {
            depth.current = 0;
            setDragOver(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          depth.current = 0;
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop a custom animation, or click to browse"
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[1.3rem] border-2 border-dashed px-4 py-6 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-mint-deep/60 dark:focus-visible:ring-amethyst/60",
          dragOver
            ? "border-mint-deep/70 bg-mint/20 dark:border-amethyst/70 dark:bg-grape/15"
            : "border-ink/15 hover:border-mint-deep/40 dark:border-white/15 dark:hover:border-amethyst/40",
        )}
      >
        <motion.span
          animate={
            upload.isPending
              ? { scale: 1 }
              : dragOver
                ? { y: -4, scale: 1.12 }
                : { y: [0, -5, 0], scale: 1 }
          }
          transition={
            upload.isPending || dragOver
              ? { type: "spring", stiffness: 400, damping: 24 }
              : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }
          }
          className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-mint to-mint-strong text-pine shadow-[0_10px_24px_-10px_rgba(47,191,138,0.8)] dark:from-grape dark:to-iris dark:text-white dark:shadow-[0_10px_24px_-10px_rgba(139,92,246,0.9)]"
        >
          {upload.isPending ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <UploadCloud className="size-5" aria-hidden />
          )}
        </motion.span>
        <p className="text-[12.5px] font-bold text-ink dark:text-snow">
          {upload.isPending
            ? "Uploading…"
            : dragOver
              ? "Release to upload"
              : "Drag & drop your animation"}
        </p>
        <p className="text-[10px] text-ink/45 dark:text-snow/40">
          GIF · WebP · PNG · MP4 · WebM · Lottie JSON — up to 3MB
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
        />
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-2 rounded-xl bg-red-500/10 px-3 py-2 text-[11px] font-semibold text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* library */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink/45 dark:text-snow/40">
          your animations
        </p>
        <span className="text-[10px] font-semibold text-ink/35 dark:text-snow/30">
          {library.length}
        </span>
      </div>

      {isPending ? (
        <div aria-hidden className="mt-2 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="shimmer aspect-square rounded-[1.1rem] bg-ink/[0.05] dark:bg-white/[0.06]"
            />
          ))}
        </div>
      ) : library.length === 0 ? (
        <div className="mt-2 flex flex-col items-center gap-1.5 rounded-[1.1rem] bg-ink/[0.03] px-4 py-5 text-center dark:bg-white/[0.05]">
          <Film className="size-4 text-ink/30 dark:text-snow/30" aria-hidden />
          <p className="text-[11px] font-semibold text-ink/45 dark:text-snow/40">
            Nothing uploaded yet
          </p>
          <p className="text-[10px] text-ink/35 dark:text-snow/30">
            Drop a clip above and it attaches to this move instantly.
          </p>
        </div>
      ) : (
        <div className="mt-2 grid grid-cols-3 gap-2">
          <AnimatePresence initial={false}>
            {library.map((a) => (
              <LibraryTile
                key={a.id}
                anim={a}
                selected={selectedId === a.id}
                onPick={pickFromLibrary}
                onDelete={(id) => del.mutate(id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
});
