'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { getColorFromName, formatRelativeTime } from '@/lib/utils';
import { api } from './api';
import { draftStore } from '@/lib/draftStore';
import { Pencil, Clock, User } from 'lucide-react';

export interface ChangeLogEntry {
  block_id: string;
  admin_name: string;
  admin_email: string;
  admin_avatar: string;
  edited_at: string;
  field: string;
}

function AttributionBadge({
  changeInfo,
  hovered,
}: {
  changeInfo: ChangeLogEntry;
  hovered: boolean;
}) {
  return (
    <div
      className={`absolute -right-3 top-[-40px] flex items-center gap-3 px-4 py-2 bg-white/90 backdrop-blur-md border border-[var(--border)] rounded-[12px] shadow-xl transition-all duration-300 pointer-events-none z-[60] origin-bottom-right ring-1 ring-black/5
        ${hovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}
      `}
    >
      <div
        className="w-7 h-7 rounded-[8px] flex items-center justify-center text-[11px] font-black text-white shadow-lg overflow-hidden relative"
        style={{ backgroundColor: getColorFromName(changeInfo.admin_name) }}
      >
        <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent" />
        <span className="relative z-10">{changeInfo.admin_avatar}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-[var(--text-primary)] leading-none mb-1 flex items-center gap-1.5 uppercase tracking-wider">
          <User size={10} strokeWidth={3} /> {changeInfo.admin_name}
        </span>
        <span className="text-[9px] text-[var(--text-muted)] font-bold leading-none flex items-center gap-1.5 uppercase tracking-widest">
          <Clock size={10} strokeWidth={3} /> {formatRelativeTime(changeInfo.edited_at)}
        </span>
      </div>
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] ml-1 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
    </div>
  );
}

interface EditableBlockProps {
  blockId: string;
  field: string;
  initialValue: string;
  slug: string;
  workspace?: string;
  isMarkdown?: boolean;
  className?: string;
  changeInfo?: ChangeLogEntry;
  onSaveSuccess?: (blockId: string, newValue: string) => void;
}

export default function EditableBlock({
  blockId,
  field,
  initialValue,
  slug,
  workspace = 'docs',
  isMarkdown: _isMarkdown = false,
  className = "",
  changeInfo,
  onSaveSuccess: _onSaveSuccess,
}: EditableBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const originalRef = useRef(initialValue);

  useEffect(() => {
    originalRef.current = initialValue;
    const draft = draftStore.getField(slug, field, workspace);
    const displayValue = draft !== null ? draft : initialValue;
    
    if (ref.current && !editing) {
      ref.current.innerText = displayValue;
    }
  }, [initialValue, editing, slug, field, workspace]);

  const handleClick = () => {
    if (editing) return;
    setEditing(true);
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(ref.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const registerWithStore = useCallback((newValue: string) => {
    // Persist to draft store so it survives refreshes/navigation
    draftStore.saveField(slug, field, newValue, originalRef.current, workspace);
  }, [slug, field, workspace]);

  const handleBlur = () => {
    setEditing(false);
    if (ref.current) registerWithStore(ref.current.innerText);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !_isMarkdown) {
      e.preventDefault();
      ref.current?.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (ref.current) ref.current.innerText = originalRef.current;
      ref.current?.blur();
      pendingChanges.removeChange("page", `${slug}:${field}`);
    }
  };

  return (
    <div
      className={`relative group/editable transition-all duration-300 ${editing ? 'z-50' : 'z-auto'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        ref={ref}
        className={`${className} outline-none cursor-text transition-all duration-300 relative border-b-2 border-transparent
          ${editing ? 'border-[var(--accent-primary)] bg-[var(--bg-active)] px-4 -mx-4 py-2 -my-2 rounded-t-[12px] shadow-lg' : 'hover:border-blue-100'}
        `}
        contentEditable={editing}
        suppressContentEditableWarning
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {initialValue}
      </div>

      {/* Hover Icon Indicator */}
      {hovered && !editing && (
        <div className="absolute top-1/2 -translate-y-1/2 left-[-32px] w-6 h-6 flex items-center justify-center animate-fade-in text-[var(--accent-primary)]">
           <Pencil size={14} className="opacity-40 animate-pulse" />
        </div>
      )}

      {/* Attribution Badge */}
      {changeInfo && !editing && (
        <AttributionBadge changeInfo={changeInfo} hovered={hovered} />
      )}
    </div>
  );
}
