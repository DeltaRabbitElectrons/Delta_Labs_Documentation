'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  RotateCcw, 
  GitCommit, 
  Loader2, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { api } from '@/lib/api';
import { getColorFromName } from '@/lib/utils';
import LoadingScreen from '@/components/LoadingScreen';

interface Commit {
  sha: string;
  message: string;
  author_name: string;
  author_email: string;
  date: string;
  github_url: string;
}

interface HistoryModalProps {
  slug: string;
  workspace?: string;
  isOpen: boolean;
  onClose: () => void;
  onRevertSuccess?: () => void;
}

export default function HistoryModal({ slug, workspace = 'docs', isOpen, onClose, onRevertSuccess }: HistoryModalProps) {
  const [history, setHistory] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [reverting, setReverting] = useState<string | null>(null);

  const [confirmRevert, setConfirmRevert] = useState<Commit | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.get<{ history: Commit[] }>(`/content/history/${slug}?workspace=${workspace}`)
        .then(res => {
          setHistory(res?.history || []);
        })
        .catch(_err => {
          console.error('History fetch failed:', _err);
          setHistory([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isOpen, slug, workspace]);

  const executeRevert = async () => {
    if (!confirmRevert) return;
    setReverting(confirmRevert.sha);
    try {
      await api.post('/content/revert', { 
        slug, 
        workspace,
        commit_sha: confirmRevert.sha,
        commit_message: `Revert to ${confirmRevert.sha.substring(0, 7)}: ${confirmRevert.message}`
      });
      onRevertSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setReverting(null);
      setConfirmRevert(null);
    }
  };


  const getRelativeTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-[600px] max-h-[75vh] rounded-[12px] border border-[var(--border)] shadow-[0_20px_48px_rgba(0,0,0,0.15)] flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-white shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Commit History</h2>
            <p className="text-[13px] text-[var(--text-muted)] flex items-center gap-1">
              <span>docs</span>
              <ChevronRight size={12} />
              <span>{slug}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--bg-hover)] rounded-[6px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar relative">
          
          {/* Confirmation Overlay */}
          {confirmRevert && (
            <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-[var(--error)]/10 text-[var(--error)] flex items-center justify-center mb-4">
                <RotateCcw size={24} />
              </div>
              <h3 className="text-[18px] font-semibold text-[var(--text-primary)] mb-2">Revert Document?</h3>
              <p className="text-[14px] text-[var(--text-muted)] mb-6 max-w-[300px]">
                You are about to revert <strong>{slug.split('/').pop()}</strong> to the version from <strong>{getRelativeTime(confirmRevert.date)}</strong>. This will push a new commit and publish it live.
              </p>
              <div className="flex items-center gap-3 w-full max-w-[280px]">
                <button
                  onClick={() => setConfirmRevert(null)}
                  disabled={reverting !== null}
                  className="flex-1 py-2.5 rounded-[8px] border border-[var(--border)] text-[14px] font-medium text-[var(--text-primary)] hover:bg-[#f9fafb] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={executeRevert}
                  disabled={reverting !== null}
                  className="flex-1 py-2.5 rounded-[8px] bg-[var(--error)] text-white text-[14px] font-medium hover:bg-[var(--error)]/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {reverting !== null ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    'Yes, Revert'
                  )}
                </button>
              </div>
            </div>
          )}

          {loading ? (
             <LoadingScreen message="Retrieving Audit Log" fullScreen={false} />
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 px-10">
               <p className="text-[var(--text-primary)] font-semibold text-[14px] mb-1">No history found</p>
               <p className="text-[var(--text-muted)] text-[13px]">This document has no recorded snapshots in the version control system.</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {history.map((commit, idx) => {
                const isCurrent = idx === 0;
                const authorInitials = commit.author_name?.[0].toUpperCase() || 'A';
                
                return (
                  <div key={commit.sha} className="group h-[64px] border-b border-[#f3f4f6] flex items-center px-6 hover:bg-[#f9fafb] transition-all relative">
                    <div 
                      className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                      style={{ backgroundColor: getColorFromName(commit.author_name) }}
                    >
                      {authorInitials}
                    </div>
                    
                    <div className="ml-4 flex-1 min-w-0 pr-24">
                       <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[14px] font-medium text-[var(--text-primary)] truncate">{commit.message}</span>
                          {isCurrent && (
                            <span className="px-2 py-0.5 bg-[var(--success)]/10 text-[var(--success)] text-[10px] font-bold uppercase rounded-full border border-[var(--success)]/20">
                              Current
                            </span>
                          )}
                       </div>
                       <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)]">
                          <span>{commit.author_name}</span>
                          <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                          <span>{getRelativeTime(commit.date)}</span>
                          <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                          <a href={commit.github_url} target="_blank" className="font-mono text-[11px] flex items-center gap-1 hover:text-[var(--accent-primary)] transition-colors">
                            <GitCommit size={12} />
                            {commit.sha.substring(0, 7)}
                          </a>
                       </div>
                    </div>

                    {/* Revert Button - Shown on Hover */}
                    {!isCurrent && (
                      <button 
                        onClick={() => setConfirmRevert(commit)}
                        disabled={reverting !== null}
                        className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all text-[13px] font-medium text-[var(--error)] flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] hover:bg-[var(--error)]/5"
                      >
                        <RotateCcw size={14} />
                        <span>Revert</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}
