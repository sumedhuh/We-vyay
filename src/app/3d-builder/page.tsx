"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { ArrowLeft } from 'lucide-react';

// Dynamically import the minified bundle with SSR disabled.
// This is necessary because the bundle uses WebGL/window objects which aren't available on the server.
const StudioApp = dynamic(() => import('@/components/3d-builder/App'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#111411]">
      <div className="flex flex-col items-center gap-3">
        <div className="size-12 rounded-2xl bg-[#22D8FF]/20 flex items-center justify-center animate-pulse">
          <span className="text-[#22D8FF] text-lg font-black">3D</span>
        </div>
        <p className="text-[#929A91] text-sm font-semibold animate-pulse">Loading Motion Lab…</p>
      </div>
    </div>
  )
});

export default function ThreeDBuilderPage() {
  return (
    <div className="relative w-full h-screen flex flex-col bg-[#111411]">
      {/* Go Back navigation header */}
      <div className="absolute top-3 left-3 z-50">
        <a
          href="/"
          className="group flex items-center gap-2 rounded-xl border border-white/10 bg-[#191D1A]/90 px-3.5 py-2 text-[12px] font-bold text-white/70 backdrop-blur-xl transition-all hover:border-[#22D8FF]/40 hover:bg-[#22D8FF]/10 hover:text-white"
        >
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Go Back</span>
        </a>
      </div>
      <div className="w-full flex-1 overflow-hidden">
        <StudioApp />
      </div>
    </div>
  );
}
