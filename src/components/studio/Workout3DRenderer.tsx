"use client";

import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment, OrbitControls, ContactShadows } from "@react-three/drei";

interface Props {
  // Expects a Draco-compressed .glb file URL
  workoutUrl: string;
}

function WorkoutModel({ url }: { url: string }) {
  // The 'true' argument (or a specific path) enables the Draco decoder 
  // to decompress the heavily compressed 3D assets on the fly.
  const { scene } = useGLTF(url, true);
  
  // Center and scale the model appropriately in the scene
  return <primitive object={scene} scale={1.5} position={[0, -1, 0]} />;
}

export function Workout3DRenderer({ workoutUrl }: Props) {
  return (
    <div className="relative w-full h-full bg-gradient-to-b from-[#1a1c29] to-[#0a0c10] rounded-3xl overflow-hidden shadow-2xl border border-white/5">
      
      {/* 3D Canvas */}
      <Canvas camera={{ position: [0, 1.5, 4.5], fov: 45 }} className="z-10">
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} castShadow />
        
        {/* Adds realistic reflections and lighting to the 3D model */}
        <Environment preset="city" />
        
        <Suspense fallback={null}>
          <WorkoutModel url={workoutUrl} />
          
          {/* Adds a soft, realistic grounding shadow underneath the character */}
          <ContactShadows position={[0, -1, 0]} opacity={0.6} scale={10} blur={2.5} far={4} color="#000000" />
        </Suspense>
        
        {/* Allow users to rotate around the workout to see form, but lock pan/zoom to prevent losing the model */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          maxDistance={6}
          minDistance={2}
          maxPolarAngle={Math.PI / 2} 
          minPolarAngle={0}
          autoRotate
          autoRotateSpeed={1.0}
        />
      </Canvas>

      {/* Sexy Loading State (shows while the Draco file is downloading/decompressing) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-0">
        <div className="w-8 h-8 border-4 border-lime-500/30 border-t-lime-500 rounded-full animate-spin mb-3"></div>
        <span className="text-lime-500/50 text-[10px] font-black tracking-[0.2em] animate-pulse">
          LOADING DRACO MESH...
        </span>
      </div>
    </div>
  );
}

// Expose a helper to let you pre-fetch models before the user even clicks "Start Workout"
export const preloadWorkoutModel = (url: string) => {
  useGLTF.preload(url, true);
};
