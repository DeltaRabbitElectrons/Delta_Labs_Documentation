'use client';

import React from 'react';

export interface AdminPresence {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  last_active?: string;
  created_at?: string;
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

// Color palette for avatars
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

export function PresenceList({ 
  admins, 
  currentEmail, 
  maxHeight = '320px' 
}: { 
  admins: AdminPresence[], 
  currentEmail: string | null,
  maxHeight?: string
}) {
  // Real-time activity threshold: 2 minutes
  const isActiveNow = (admin: AdminPresence) => {
    if (!admin.last_active) return false;
    const diff = Date.now() - new Date(admin.last_active).getTime();
    return diff < 120000; // 2 minutes
  };

  // Sort: Me first, then active users, then alphabetical
  const sorted = [...admins].sort((a, b) => {
    if (a.email === currentEmail) return -1;
    if (b.email === currentEmail) return 1;
    
    const aActive = isActiveNow(a);
    const bActive = isActiveNow(b);
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="overflow-y-auto py-1" style={{ maxHeight }}>
      {sorted.map((admin, i) => {
        const color = getColorForIndex(i);
        const isMe = admin.email === currentEmail;
        const initials = admin.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const isActive = isMe || isActiveNow(admin);
        const activity = isActive ? 'Active' : timeAgo(admin.last_active || admin.created_at);

        return (
          <div
            key={admin.id}
            className={`flex items-center gap-2.5 px-3 py-1.5 mx-1 rounded-lg transition-colors
              ${isMe ? 'bg-slate-50' : 'hover:bg-slate-50/60'}
            `}
          >
            <div className="relative shrink-0">
              <div className={`w-7 h-7 rounded-full ${color.bg} ${color.text} flex items-center justify-center text-[10px] font-[800]`}>
                {initials}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white
                ${isActive ? 'bg-emerald-400' : 'bg-slate-300'}
              `} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-bold text-slate-700 truncate leading-tight">
                  {admin.name}
                </p>
                {isMe && (
                  <span className="text-[8px] font-black uppercase tracking-wider text-[var(--accent-primary)] bg-[var(--accent-light)] px-1 py-0.5 rounded-full shrink-0">
                    You
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-bold truncate">
                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
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
  );
}
