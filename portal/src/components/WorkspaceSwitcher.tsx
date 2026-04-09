'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  ChevronDown, 
  FileText, 
  Plus,
  Loader2,
  Trash2,
  AlertTriangle,
  Pencil,
} from 'lucide-react';
import { api } from '@/lib/api';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export default function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation modal state
  const [deleteTarget, setDeleteTarget] = useState<Workspace | null>(null);
  const [deleting, setDeleting] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // ── Fetch workspaces ──────────────────────────────────────
  const fetchWorkspaces = useCallback(async () => {
    try {
      const data = await api.get<Workspace[]>('/workspaces');
      setWorkspaces(data);
    } catch (err) {
      console.error('Failed to fetch workspaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  // ── Click-outside to close ────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setEditingId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Auto-focus rename input ───────────────────────────────
  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

  // ── Active workspace detection ────────────────────────────
  const getActiveWorkspace = (): Workspace | null => {
    if (!pathname) return workspaces[0] || null;

    // "docs" workspace matches /docs/*
    const docsWs = workspaces.find(w => w.slug === 'docs');
    if (docsWs && pathname.startsWith('/docs')) return docsWs;

    // Other workspaces match /workspace/[slug]
    for (const ws of workspaces) {
      if (ws.slug !== 'docs' && pathname.startsWith(`/workspace/${ws.slug}`)) {
        return ws;
      }
    }

    return workspaces[0] || null;
  };

  const currentWorkspace = getActiveWorkspace();

  // ── Navigation helper ─────────────────────────────────────
  const navigateTo = (ws: Workspace) => {
    if (ws.slug === 'docs') {
      router.push('/docs');
    } else {
      router.push(`/workspace/${ws.slug}`);
    }
  };

  // ── Handle Workspace Click ────────────────────────────────
  const handleWorkspaceClick = (ws: Workspace) => {
    navigateTo(ws);
    setOpen(false);
    setEditingId(null);
  };

  // ── Submit Rename ─────────────────────────────────────────
  const submitRename = async (wsId: string) => {
    const trimmed = editValue.trim();
    if (!trimmed) {
      setEditingId(null);
      return;
    }

    const ws = workspaces.find(w => w.id === wsId);
    if (!ws || trimmed === ws.name) {
      setEditingId(null);
      return;
    }

    // Optimistic update
    setWorkspaces(prev =>
      prev.map(w => (w.id === wsId ? { ...w, name: trimmed } : w))
    );
    setEditingId(null);

    try {
      const result = await api.patch<{ slug: string }>(`/workspaces/${wsId}`, { name: trimmed });
      // Update the slug in local state
      setWorkspaces(prev =>
        prev.map(w => (w.id === wsId ? { ...w, name: trimmed, slug: result.slug } : w))
      );

      // If we are currently on this workspace's route, redirect to the new slug
      if (ws.slug !== 'docs' && pathname?.startsWith(`/workspace/${ws.slug}`)) {
        router.push(`/workspace/${result.slug}`);
      }
    } catch (err) {
      console.error('Failed to rename workspace:', err);
      // Revert on failure
      await fetchWorkspaces();
    }
  };

  // ── Handle Add Workspace ──────────────────────────────────
  const handleAddWorkspace = async () => {
    if (creating) return;
    setCreating(true);

    try {
      const result = await api.post<Workspace>('/workspaces', { name: 'New Workspace' });
      await fetchWorkspaces();
      setOpen(false);
      setEditingId(null);
      router.push(`/workspace/${result.slug}`);
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setCreating(false);
    }
  };

  // ── Handle Delete Workspace ───────────────────────────────
  const handleDeleteClick = (ws: Workspace, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteTarget(ws);
  };

  const confirmDelete = async () => {
    if (!deleteTarget || deleting) return;
    setDeleting(true);

    try {
      await api.delete(`/workspaces/${deleteTarget.id}`);
      
      // If we are currently viewing the deleted workspace, redirect to docs
      if (pathname?.startsWith(`/workspace/${deleteTarget.slug}`)) {
        router.push('/docs');
      }
      
      await fetchWorkspaces();
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    } finally {
      setDeleting(false);
    }
  };

  // ── Skeleton Loader (matches dropdown item height) ────────
  const SkeletonItems = () => (
    <div className="flex flex-col gap-0.5">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-[6px] animate-pulse">
          <div className="w-8 h-8 rounded-[4px] bg-[var(--bg-secondary)] border border-[var(--border)]" />
          <div className="flex-1 min-w-0">
            <div className="h-[13px] w-24 bg-[var(--bg-secondary)] rounded mb-1" />
            <div className="h-[10px] w-16 bg-[var(--bg-hover)] rounded" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => !deleting && setDeleteTarget(null)} 
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-slide-up">
            {/* Header Gradient */}
            <div className="bg-gradient-to-br from-red-50 via-rose-50 to-orange-50 px-7 pt-7 pb-5 border-b border-red-100/60">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white border border-red-200 flex items-center justify-center shadow-[0_4px_14px_rgba(239,68,68,0.12)] shrink-0">
                  <AlertTriangle size={26} className="text-red-500" />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <h2 className="text-[18px] font-[800] text-slate-800 tracking-tight mb-1">
                    Delete Workspace
                  </h2>
                  <p className="text-[13px] text-slate-500 leading-relaxed">
                    This action is <span className="font-bold text-red-500">permanent</span> and cannot be undone.
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="px-7 py-5">
              <div className="bg-slate-50 rounded-xl px-4 py-3.5 border border-slate-100 mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                    <FileText size={18} className="text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-slate-700 truncate">
                      {deleteTarget.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium">
                      /{deleteTarget.slug}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-[13px] text-slate-500 leading-relaxed mb-5">
                All content within <span className="font-semibold text-slate-700">&ldquo;{deleteTarget.name}&rdquo;</span> will 
                be permanently removed. Any pages, notes, and configurations associated with this workspace will be lost forever.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-[14px] font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-b from-red-500 to-red-600 text-white text-[14px] font-bold hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)]"
                >
                  {deleting ? (
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}
                  {deleting ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-7 py-3 bg-gradient-to-r from-red-50/50 to-transparent border-t border-red-100/40">
              <p className="text-[10px] text-red-400 font-black uppercase tracking-[0.15em] flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-red-400" />
                Destructive Operation
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Workspace Switcher Dropdown ── */}
      <div ref={ref} className="relative">
        <button 
          onClick={() => setOpen(!open)}
          className="h-[32px] px-[10px] rounded-[6px] border border-[var(--border)] bg-white flex items-center gap-2 text-[var(--text-primary)] font-medium text-[13px] hover:bg-[var(--bg-secondary)] transition-all"
        >
          <FileText size={14} className="text-[var(--text-secondary)]" />
          <span>{currentWorkspace?.name || 'Workspaces'}</span>
          <ChevronDown 
            size={14} 
            className={`text-[var(--text-muted)] transition-transform duration-150 ${open ? 'rotate-180' : ''}`} 
          />
        </button>

        {open && (
          <div className="absolute top-10 left-0 w-64 bg-white border border-[var(--border)] rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] p-2 animate-scale-in z-[110] overflow-hidden">
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-[0.08em]">Switch Workspace</span>
            </div>
            
            {loading ? (
              <SkeletonItems />
            ) : (
              <div className="flex flex-col gap-0.5">
                {[...workspaces]
                  .sort((a, b) => {
                    if (a.slug === 'docs') return -1;
                    if (b.slug === 'docs') return 1;
                    return 0;
                  })
                  .map((ws) => {
                  const isActive = currentWorkspace?.id === ws.id;
                  const isEditing = editingId === ws.id;
                  const isLocked = ws.slug === 'docs';

                  return (
                    <div
                      key={ws.id}
                      className={`flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all relative group cursor-pointer
                        ${isActive ? 'bg-[var(--bg-active)] text-[var(--accent-primary)] font-medium' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]'}
                      `}
                      onClick={() => !isEditing && handleWorkspaceClick(ws)}
                    >
                      <div className={`w-8 h-8 rounded-[4px] flex items-center justify-center transition-all bg-[var(--bg-secondary)] border border-[var(--border)]
                        ${isActive ? 'bg-[var(--bg-active)] border-[var(--accent-light)]' : ''}
                      `}>
                        <FileText size={16} className={isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]'} />
                      </div>
                      
                      <div className="text-left flex-1 min-w-0">
                        {isEditing ? (
                          <input
                            ref={renameInputRef}
                            className="w-full text-[13px] font-semibold outline-none bg-white border border-[var(--accent-primary)]/30 rounded px-1.5 py-0.5 ring-2 ring-[var(--focus-ring)]"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename(ws.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onBlur={() => submitRename(ws.id)}
                          />
                        ) : (
                          <>
                            <p className="text-[13px] truncate">{ws.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] truncate">
                              {ws.slug === 'docs' ? 'Wiki & Blueprints' : `/${ws.slug}`}
                            </p>
                          </>
                        )}
                      </div>

                      {/* Actions - right side, hidden for locked workspaces */}
                      {!isLocked && !isEditing && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                          <button
                            onClick={(e) => {
                               e.stopPropagation();
                               setEditingId(ws.id);
                               setEditValue(ws.name);
                            }}
                            className="w-7 h-7 rounded-md flex items-center justify-center hover:bg-black/5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all z-10 hover:scale-110"
                            title="Rename workspace"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(ws, e)}
                            className="w-7 h-7 rounded-md flex items-center justify-center bg-red-50 hover:bg-red-100 border border-red-200/60 shadow-sm z-10 hover:scale-110"
                            title="Delete workspace"
                          >
                            <Trash2 size={12} className="text-red-400 hover:text-red-500" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── + Add Workspace Button ── */}
                <button
                  onClick={handleAddWorkspace}
                  disabled={creating}
                  className="flex items-center gap-3 px-3 py-2 rounded-[6px] transition-all text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)] mt-1 border-t border-[var(--border)]/50 pt-2.5"
                >
                  <div className="w-8 h-8 rounded-[4px] flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] border-dashed">
                    {creating ? (
                      <Loader2 size={16} className="text-[var(--text-muted)] animate-spin" />
                    ) : (
                      <Plus size={16} className="text-[var(--text-muted)]" />
                    )}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-[13px] truncate">{creating ? 'Creating...' : 'Add Workspace'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">New collection</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
