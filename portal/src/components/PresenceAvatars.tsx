'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';

interface AdminPresence {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_active?: string;
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return 'Unknown';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'Active';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

// Color palette for avatars — each admin gets a consistent color
const AVATAR_COLORS = [
  { bg: 'bg-violet-100', text: 'text-violet-600', ring: 'ring-violet-400' },
  { bg: 'bg-sky-100', text: 'text-sky-600', ring: 'ring-sky-400' },
  { bg: 'bg-emerald-100', text: 'text-emerald-600', ring: 'ring-emerald-400' },
  { bg: 'bg-amber-100', text: 'text-amber-600', ring: 'ring-amber-400' },
  { bg: 'bg-rose-100', text: 'text-rose-600', ring: 'ring-rose-400' },
  { bg: 'bg-indigo-100', text: 'text-indigo-600', ring: 'ring-indigo-400' },
  { bg: 'bg-teal-100', text: 'text-teal-600', ring: 'ring-teal-400' },
  { bg: 'bg-pink-100', text: 'text-pink-600', ring: 'ring-pink-400' },
];

function getColorForIndex(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export default function PresenceAvatars() {
  const [admins, setAdmins] = useState<AdminPresence[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const currentEmail = typeof window !== 'undefined' ? localStorage.getItem('email') : '';

  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await api.get<AdminPresence[]>('/admin/users');
        setAdmins(data);
      } catch {
        // Silently fail — this is a non-critical feature
      }
    };

    fetchAdmins();
    // Refresh presence every 60 seconds
    const interval = setInterval(fetchAdmins, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setShowPanel(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (admins.length === 0) return null;

  // Current user first, then others
  const sorted = [...admins].sort((a, b) => {
    if (a.email === currentEmail) return -1;
    if (b.email === currentEmail) return 1;
    return 0;
  });

  const MAX_VISIBLE = 4;
  const visible = sorted.slice(0, MAX_VISIBLE);
  const overflow = sorted.length - MAX_VISIBLE;

  return (
    <div className="relative" ref={panelRef}>
      {/* Stacked Avatars */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="flex items-center -space-x-2 hover:opacity-90 transition-opacity"
        title="Team presence"
      >
        {visible.map((admin, i) => {
          const color = getColorForIndex(i);
          const isMe = admin.email === currentEmail;
          const isActive = admin.status === 'active';
          const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

          return (
            <div key={admin.id} className="relative" style={{ zIndex: MAX_VISIBLE - i }}>
              <div
                className={`w-8 h-8 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[10px] font-[800] border-2 border-white shadow-sm transition-transform hover:scale-110 hover:z-50
                  ${isMe ? 'ring-2 ring-offset-1 ' + color.ring : ''}
                `}
              >
                {initials}
              </div>
              {/* Activity dot */}
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}
              `} />
            </div>
          );
        })}
        {overflow > 0 && (
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-[800] border-2 border-white shadow-sm" style={{ zIndex: 0 }}>
            +{overflow}
          </div>
        )}
      </button>

      {/* Expanded Panel */}
      {showPanel && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowPanel(false)} />
          <div className="absolute right-0 top-11 w-[280px] bg-white border border-[var(--border)] rounded-[16px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] z-20 overflow-hidden animate-slide-up origin-top-right ring-1 ring-black/5">
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-[var(--border)]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-[900] uppercase tracking-[0.15em] text-slate-400">
                  Team Presence
                </h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-bold text-emerald-500">
                    {admins.filter(a => a.status === 'active').length} online
                  </span>
                </div>
              </div>
            </div>

            {/* Admin List */}
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {sorted.map((admin, i) => {
                const color = getColorForIndex(i);
                const isMe = admin.email === currentEmail;
                const isActive = admin.status === 'active';
                const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                const activity = isActive ? 'Active' : timeAgo(admin.last_active || admin.created_at);

                return (
                  <div
                    key={admin.id}
                    className={`flex items-center gap-3 px-4 py-2.5 mx-1.5 rounded-xl transition-colors
                      ${isMe ? 'bg-slate-50' : 'hover:bg-slate-50/60'}
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className={`w-9 h-9 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[11px] font-[800]`}>
                        {initials}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white
                        ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}
                      `} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-[700] text-slate-800 truncate leading-tight">
                          {admin.name}
                        </p>
                        {isMe && (
                          <span className="text-[9px] font-[800] uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-light)] px-1.5 py-0.5 rounded-full shrink-0">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </p>
                    </div>

                    {/* Activity Status */}
                    <div className="shrink-0 text-right">
                      <span className={`text-[11px] font-[700] px-2 py-1 rounded-full
                        ${isActive
                          ? 'text-emerald-600 bg-emerald-50'
                          : 'text-slate-400 bg-slate-50'
                        }
                      `}>
                        {activity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-2.5 bg-slate-50/80 border-t border-[var(--border)]">
              <p className="text-[10px] text-slate-400 font-[700] uppercase tracking-[0.12em] text-center">
                {admins.length} team member{admins.length !== 1 ? 's' : ''} total
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
