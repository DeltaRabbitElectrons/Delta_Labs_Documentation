'use client';

import React from 'react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({ 
  message = "Initializing Document Stream", 
  fullScreen = true 
}: LoadingScreenProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'min-h-screen fixed inset-0 z-[500] bg-[#f8fafc]' : 'w-full py-20'} animate-fade-in`}>
      <div className="relative flex items-center justify-center mb-6">
        {/* Spinning Outer Ring */}
        <div className="absolute w-20 h-20 border-2 border-[var(--accent-primary)]/10 rounded-full" />
        <div className="absolute w-20 h-20 border-t-2 border-[var(--accent-primary)] rounded-full animate-spin" />
        
        {/* Pulsing Logo Core */}
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center relative z-10 animate-pulse-subtle">
           <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
      </div>
      
      <p className="text-[13px] font-semibold text-[var(--accent-primary)]/60 tracking-widest uppercase animate-pulse">
        {message}
      </p>
    </div>
  );
}
