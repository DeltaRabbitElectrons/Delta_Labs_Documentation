'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DocsHome() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }
    api.get<any[]>('/pages').then(pages => {
      if (pages.length === 0) return;
      const first = pages.sort((a, b) => a.sidebar_position - b.sidebar_position)[0];
      router.replace(`/docs/${first.slug}`);
    }).catch(() => router.push('/login'));
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] animate-fade-in">
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
        Initializing Document Stream
      </p>
      
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.95; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
