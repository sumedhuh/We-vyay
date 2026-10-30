"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Box, Circle, Sun, Palette, MousePointer2, Play, Move3d,
  Layers, Rotate3d, Maximize, Type, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { useUiStore } from '@/stores/ui-store';

export default function StudioApp() {
  const [activeTool, setActiveTool] = useState('select');
  const [activeTab, setActiveTab] = useState('properties');
  const [isMounted, setIsMounted] = useState(false);
  const pushToast = useUiStore(s => s.pushToast);

  useEffect(() => setIsMounted(true), []);

  if (!isMounted) return null;

  const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'move', icon: Move3d, label: 'Translate' },
    { id: 'rotate', icon: Rotate3d, label: 'Rotate' },
    { id: 'scale', icon: Maximize, label: 'Scale' },
    { divider: true, id: 'd1' },
    { id: 'box', icon: Box, label: 'Add Cube' },
    { id: 'sphere', icon: Circle, label: 'Add Sphere' },
    { id: 'text', icon: Type, label: 'Add Text' },
    { divider: true, id: 'd2' },
    { id: 'light', icon: Sun, label: 'Add Light' },
    { id: 'material', icon: Palette, label: 'Materials' }
  ];

  const handleToolClick = (id: string) => {
    haptic("light");
    setActiveTool(id);
  };

  const handleSimulate = () => {
    haptic("success");
    pushToast({ title: "Simulation Started", message: "Physics engine is running", tone: "mint" });
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-white dark:bg-ink text-ink dark:text-snow">
      {/* Topbar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink/10 dark:border-white/10 px-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-xl bg-mint-deep/20 text-mint-deep dark:bg-amethyst/20 dark:text-amethyst">
            <Box className="size-4" />
          </div>
          <h1 className="font-display text-lg font-bold italic tracking-tight">Studio Builder</h1>
        </div>
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSimulate}
            className="flex items-center gap-2 rounded-full bg-ink/5 px-4 py-1.5 text-sm font-bold transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/20"
          >
            <Play className="size-3.5" />
            Simulate
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              haptic("medium");
              pushToast({ title: "Saved", message: "Project saved successfully", tone: "mint" });
            }}
            className="flex items-center gap-2 rounded-full bg-mint px-4 py-1.5 text-sm font-bold text-pine transition-colors hover:bg-mint-deep dark:bg-amethyst dark:text-void dark:hover:bg-amethyst/80"
          >
            <Check className="size-3.5" />
            Save Project
          </motion.button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Toolbar */}
        <aside className="w-16 shrink-0 flex flex-col items-center border-r border-ink/10 dark:border-white/10 py-4 gap-2 bg-ink/[0.02] dark:bg-white/[0.02]">
          {tools.map(t => t.divider ? (
            <div key={t.id} className="w-8 h-px bg-ink/10 dark:bg-white/10 my-1" />
          ) : (
            <button
              key={t.id}
              onClick={() => handleToolClick(t.id as string)}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl transition-all",
                activeTool === t.id
                  ? "bg-mint-deep/20 text-mint-deep dark:bg-amethyst/20 dark:text-amethyst"
                  : "text-ink/60 hover:bg-ink/5 hover:text-ink dark:text-snow/60 dark:hover:bg-white/10 dark:hover:text-snow"
              )}
              title={t.label}
            >
              {t.icon && <t.icon className="size-5" strokeWidth={activeTool === t.id ? 2.5 : 2} />}
            </button>
          ))}
        </aside>

        {/* 3D Viewport (Placeholder) */}
        <main className="relative flex-1 bg-ink/[0.03] dark:bg-[#09090b] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" 
               style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
          />
          
          <motion.div 
            animate={{ 
              rotateX: [0, 10, -10, 0],
              rotateY: [0, 360],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="relative size-64"
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
          >
            {/* Simple CSS 3D Cube representation */}
            <div className="absolute inset-0 border-2 border-mint-deep/30 dark:border-amethyst/30 rounded-3xl bg-mint-deep/10 dark:bg-amethyst/10 backdrop-blur-sm flex items-center justify-center shadow-[0_0_50px_rgba(47,191,138,0.2)] dark:shadow-[0_0_50px_rgba(139,92,246,0.2)]">
              <Move3d className="size-16 text-mint-deep/50 dark:text-amethyst/50" />
            </div>
          </motion.div>

          <div className="absolute bottom-6 flex flex-col items-center gap-2">
            <span className="rounded-full bg-white/80 dark:bg-ink/80 px-4 py-2 text-xs font-semibold backdrop-blur-md shadow-sm border border-ink/5 dark:border-white/5 text-ink/70 dark:text-snow/70">
              3D Canvas Runtime initialized
            </span>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        <aside className="w-72 shrink-0 flex flex-col border-l border-ink/10 dark:border-white/10 bg-white dark:bg-ink">
          <div className="flex h-12 items-center border-b border-ink/10 dark:border-white/10 px-2">
            {['properties', 'scene'].map(tab => (
              <button
                key={tab}
                onClick={() => {
                  haptic("light");
                  setActiveTab(tab);
                }}
                className={cn(
                  "flex-1 rounded-lg py-1.5 text-xs font-bold capitalize transition-colors",
                  activeTab === tab
                    ? "bg-ink/5 text-ink dark:bg-white/10 dark:text-snow"
                    : "text-ink/50 hover:text-ink/80 dark:text-snow/50 dark:hover:text-snow/80"
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === 'properties' ? (
              <>
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-ink/40 dark:text-snow/40 flex items-center gap-2">
                    <Move3d className="size-3" /> Transform
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {['X', 'Y', 'Z'].map(axis => (
                      <div key={axis} className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-ink/50 dark:text-snow/50">{axis}</label>
                        <input 
                          type="text" 
                          defaultValue="0.0" 
                          className="w-full rounded-md border border-ink/10 bg-ink/[0.02] px-2 py-1.5 text-xs font-semibold text-ink outline-none focus:border-mint-deep dark:border-white/10 dark:bg-white/[0.02] dark:text-snow dark:focus:border-amethyst" 
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-ink/40 dark:text-snow/40 flex items-center gap-2">
                    <Palette className="size-3" /> Material
                  </h3>
                  <div className="rounded-xl border border-ink/10 p-3 dark:border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink/80 dark:text-snow/80">Base Color</span>
                      <div className="size-6 rounded-md bg-mint-deep shadow-inner dark:bg-amethyst cursor-pointer border border-ink/10 dark:border-white/10" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-ink/60 dark:text-snow/60">Roughness</span>
                        <span className="text-[11px] font-bold text-ink/80 dark:text-snow/80">0.2</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
                        <div className="h-full w-[20%] bg-mint-deep dark:bg-amethyst rounded-full" />
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-ink/60 dark:text-snow/60">Metalness</span>
                        <span className="text-[11px] font-bold text-ink/80 dark:text-snow/80">0.8</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-ink/10 dark:bg-white/10 overflow-hidden">
                        <div className="h-full w-[80%] bg-mint-deep dark:bg-amethyst rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                {['Camera', 'DirectionalLight', 'Cube_01', 'Floor'].map((item, i) => (
                  <div key={i} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-ink/5 dark:hover:bg-white/10">
                    <Layers className="size-4 text-ink/40 dark:text-snow/40" />
                    <span className="text-xs font-bold text-ink/80 dark:text-snow/80">{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
