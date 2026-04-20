'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Zap, FolderOpen } from 'lucide-react';

interface WorkspaceSidebarProps {
  workspaceName: string;
}

/**
 * Generic sidebar for non-docs workspaces.
 * Visually matches DocsSidebar's layout (same widths, spacing, fonts)
 * but renders an empty-state message instead of the tree explorer.
 */
export default function WorkspaceSidebar({ workspaceName }: WorkspaceSidebarProps) {
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth);
      setSidebarWidth(width);
      document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
    } else {
      document.documentElement.style.setProperty('--sidebar-width', '280px');
    }
  }, []);

  const startResizing = () => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(200, e.clientX), 600);
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
    }
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    const finalWidth = sidebarRef.current ? parseInt(sidebarRef.current.style.width) : 280;
    setSidebarWidth(finalWidth);
    localStorage.setItem('sidebarWidth', finalWidth.toString());
  };

  return (
    <div
      ref={sidebarRef}
      className="fixed left-0 top-[52px] bottom-0 bg-white border-r border-[var(--border)] flex flex-col z-[50] shadow-sm group/sidebar"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Header — matches DocsSidebar header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] flex items-center gap-2 mb-1">
              Explorer <Zap size={10} className="text-[var(--accent-primary)] animate-pulse" />
            </h3>
            <span className="text-[11px] font-bold text-slate-400 truncate max-w-[160px]">
              {workspaceName}
            </span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 overflow-y-auto px-1.5 py-2 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center text-center px-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mb-5 shadow-sm">
            <FolderOpen size={28} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[13px] font-bold text-[var(--text-secondary)] mb-1.5">
            No pages yet
          </p>
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed max-w-[180px]">
            Create your first page to get started in this workspace.
          </p>
        </div>
      </div>

      {/* Resize Handle — exact same as DocsSidebar */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[var(--accent-primary)]/20 active:bg-[var(--accent-primary)] transition-all duration-300 group-hover/sidebar:opacity-100 opacity-0 z-[100]"
      />
    </div>
  );
}
