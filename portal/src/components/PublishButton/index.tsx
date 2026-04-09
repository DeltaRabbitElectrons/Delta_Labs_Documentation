'use client';

import React, { useState, useEffect } from 'react';
import { 
  Rocket, 
  Check, 
  Loader2, 
  Circle, 
  AlertCircle, 
  ChevronDown,
  Info
} from 'lucide-react';
import { pendingChanges } from '@/lib/pendingChanges';
import { draftStore } from '@/lib/draftStore';
import { useParams, usePathname } from 'next/navigation';

type PublishState = 'idle' | 'pending' | 'publishing' | 'success' | 'error';

export default function PublishButton() {
  const [state, setState] = useState<PublishState>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [showProgress, setShowProgress] = useState(false);

  const params = useParams();
  const pathname = usePathname();
  const workspaceSlug = pathname?.startsWith('/workspace/') ? (params.slug as string) : 'docs';

  useEffect(() => {
    const unsub = pendingChanges.subscribe(() => {
      const count = pendingChanges.getPendingCount();
      setPendingCount(count);

      // Directly check draftStore for real changes (localStorage-backed)
      const hasChanges = draftStore.hasChanges(workspaceSlug);
      setState((prev: PublishState) => {
        // Don't override publishing/success/error states
        if (prev === 'publishing' || prev === 'success' || prev === 'error') return prev;
        return hasChanges ? 'pending' : 'idle';
      });
    });

    // Also check on mount in case drafts already exist in localStorage
    const hasChanges = draftStore.hasChanges(workspaceSlug);
    if (hasChanges) {
      setPendingCount(pendingChanges.getPendingCount() || 1);
      setState('pending');
    }

    return () => { unsub(); };
  }, [workspaceSlug]);

  // Safety net: periodically check for draft changes (catches edge cases)
  useEffect(() => {
    const interval = setInterval(() => {
      const hasChanges = draftStore.hasChanges(workspaceSlug);
      setState((prev: PublishState) => {
        if (prev === 'publishing' || prev === 'success' || prev === 'error') return prev;
        if (hasChanges && prev === 'idle') {
          setPendingCount(Object.keys(draftStore.getAllPages(workspaceSlug)).length + (draftStore.getSidebar(workspaceSlug) ? 1 : 0));
          return 'pending';
        }
        if (!hasChanges && prev === 'pending') return 'idle';
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [workspaceSlug]);

  const handlePublish = async () => {
    if (state !== 'pending') return;
    
    setState('publishing');
    setShowProgress(true);
    
    try {
      await draftStore.publishChanges(workspaceSlug);
      
      // 🚀 Trigger the static-site rebuild
      // This will call the FastAPI endpoint which fires the Vercel deploy hook
      try {
        const token = localStorage.getItem('delta_token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/workspaces/trigger-rebuild`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Static site rebuild triggered successfully');
      } catch (triggerErr) {
        console.error('Failed to trigger rebuild:', triggerErr);
        // We don't fail the whole operation if just the rebuild trigger fails,
        // but the user might not see live changes immediately.
      }

      setState('success');
      setTimeout(() => {
        setState('idle');
        setShowProgress(false);
      }, 3000);
    } catch (err) {
      console.error('Publish failed:', err);
      setState('error');
      setTimeout(() => setState('pending'), 4000);
    }
  };

  return (
    <div className="relative flex items-center gap-1 group">
      <button 
        onClick={handlePublish}
        disabled={state !== 'pending'}
        className={`
          flex items-center gap-3 h-10 px-5 rounded-[10px] font-bold text-[11px] uppercase tracking-wider transition-all relative overflow-hidden ring-4 ring-transparent
          ${state === 'idle' && 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)] opacity-80 cursor-not-allowed scale-[0.98]'}
          ${state === 'pending' && 'bg-[var(--accent-primary)] text-white shadow-[0_8px_20px_-4px_rgba(23,74,95,0.35)] hover:scale-105 active:scale-95 group-hover:ring-[var(--accent-primary)]/10'}
          ${state === 'publishing' && 'bg-[var(--accent-primary)] text-white opacity-90 cursor-wait'}
          ${state === 'success' && 'bg-[var(--success)] text-white shadow-xl shadow-green-100'}
          ${state === 'error' && 'bg-[var(--error)] text-white shadow-xl shadow-red-100'}
        `}
      >
        <div className="relative z-10 flex items-center gap-2.5">
          {state === 'idle' && <Circle size={16} strokeWidth={3} />}
          {state === 'pending' && <Rocket size={16} strokeWidth={2.5} className="animate-bounce" />}
          {state === 'publishing' && <Loader2 size={16} className="animate-spin" strokeWidth={3} />}
          {state === 'success' && <Check size={16} strokeWidth={3} />}
          {state === 'error' && <AlertCircle size={16} strokeWidth={3} />}
          
          <span>
            {state === 'idle' && 'In Sync'}
            {state === 'pending' && `Deploy Update (${pendingCount})`}
            {state === 'publishing' && 'Rebuilding...'}
            {state === 'success' && 'Transmission Success'}
            {state === 'error' && 'Retry Sync'}
          </span>
        </div>
        
        {/* Animated Background Glow for Pending State */}
        {state === 'pending' && (
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        )}
      </button>

      {/* Info Tooltip (Pop it on hover if pending) */}
      {state === 'pending' && (
        <div className="absolute top-12 right-0 w-[200px] bg-white border border-[var(--border)] rounded-[12px] p-4 shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all pointer-events-none z-[120] ring-1 ring-black/5 flex flex-col items-center text-center">
           <Info size={24} className="text-[var(--accent-primary)] mb-2" />
           <p className="text-[12px] text-[var(--text-secondary)] font-medium leading-relaxed">
             <span className="text-[var(--text-primary)] font-bold">{pendingCount} pending changes</span> are ready for deployment to the live environment.
           </p>
        </div>
      )}

      {/* Success Indicator for Site Build */}
      {state === 'success' && (
        <div className="absolute -top-1 right-[-4px] w-3 h-3 bg-white rounded-full flex items-center justify-center shadow-sm">
           <div className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-ping" />
        </div>
      )}
    </div>
  );
}
