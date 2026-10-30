"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe2, Rocket } from "lucide-react";
import { Workout3DRenderer } from "./Workout3DRenderer";
import type { Database } from "../../types/database.types";

type Workout = Database["public"]["Tables"]["workouts"]["Insert"];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onPublish: () => void;
  workoutPreview: Workout | null;
}

export function StudioPublishModal({ isOpen, onClose, onPublish, workoutPreview }: Props) {
  if (!workoutPreview) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-[#0a0c10] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-lime-400" />
                <h2 className="text-white font-black tracking-widest text-sm">PUBLISH WORKOUT</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 bg-white/5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 flex flex-col gap-6">
              <p className="text-white/60 text-sm">
                This workout is about to go live globally. Preview your 3D animation and metadata below.
              </p>

              {/* 3D Preview Wrapper */}
              <div className="w-full aspect-square rounded-3xl overflow-hidden border-2 border-white/5 relative bg-black">
                <Workout3DRenderer workoutUrl={workoutPreview.animation_url} />
                
                {/* Overlay Metadata */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                  <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl">
                    <h3 className="text-white font-bold text-lg leading-tight">
                      {workoutPreview.name}
                    </h3>
                  </div>
                  {workoutPreview.emojis && workoutPreview.emojis.length > 0 && (
                    <div className="flex gap-1 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full">
                      {workoutPreview.emojis.map((emoji, idx) => (
                        <span key={idx} className="text-lg leading-none">{emoji}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Publish Action */}
              <button
                onClick={() => {
                  onPublish();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 text-black font-black text-sm tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_0_20px_rgba(163,230,53,0.3)]"
              >
                <Rocket className="w-5 h-5" />
                CONFIRM & PUBLISH
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
