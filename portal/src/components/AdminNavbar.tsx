'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  History, 
  Eye, 
  LogOut, 
  UserCheck,
  Users,
  ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import WorkspaceSwitcher from './WorkspaceSwitcher';
import PublishButton from './PublishButton';
import { PresenceList, AdminPresence } from './PresenceAvatars';
import { api } from '@/lib/api';

interface AdminNavbarProps {
  pageTitle?: string;
  onShowHistory?: () => void;
  viewLiveUrl?: string;
}

export default function AdminNavbar({ 
  pageTitle, 
  onShowHistory, 
  viewLiveUrl 
}: AdminNavbarProps) {
  const router = useRouter();
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [admins, setAdmins] = useState<AdminPresence[]>([]);
  
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        const data = await api.get<AdminPresence[]>('/admin/users');
        setAdmins(data);
      } catch {
        // Silently fail
      }
    };

    const sendHeartbeat = async () => {
      try {
        await api.post('/admin/heartbeat', {});
      } catch {
        // Heartbeat failed
      }
    };

    fetchAdmins();
    sendHeartbeat();

    // Heartbeat every 5 seconds for real-time feel
    const interval = setInterval(() => {
      fetchAdmins();
      sendHeartbeat();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setUserName(localStorage.getItem('name') || 'Admin');
    setUserEmail(localStorage.getItem('email') || 'team@delta-labs.ai');
    setUserRole(localStorage.getItem('role') || 'admin');
    
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setScrolled(window.scrollY > 20);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    localStorage.clear();
    router.push('/login');
  };

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <nav className={`fixed top-0 left-0 right-0 h-[52px] z-[100] transition-all duration-500 ease-out flex items-center px-5 gap-5 border-b
      ${scrolled 
        ? 'bg-white/70 backdrop-blur-xl border-[var(--border)] shadow-[0_1px_8px_rgba(0,0,0,0.03)]' 
        : 'bg-white border-transparent shadow-none'
      }`}
    >
      {/* Brand area */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 flex items-center justify-center p-0.5 transform transition-transform hover:scale-110 duration-300">
           <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col">
           <span className="text-[13px] font-[800] tracking-tight text-[var(--accent-primary)] leading-none mb-0.5">DELTA LABS</span>
           <span className="text-[10px] font-bold text-[var(--text-muted)] tracking-widest uppercase leading-none">Admin</span>
        </div>
        <div className="h-5 w-px bg-[var(--border)] mx-1 opacity-50" />
        <WorkspaceSwitcher />
      </div>

      {/* Contextual Path */}
      <div className="flex-1 flex items-center gap-3 overflow-hidden ml-2">
        {pageTitle && (
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)]/10 shadow-sm animate-fade-in">
             <div className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] font-black uppercase tracking-[0.1em]">
               <span>Nodes</span>
               <ChevronRight size={12} className="opacity-50" />
             </div>
             <span className="text-[13px] font-bold text-[var(--text-primary)] truncate max-w-[180px]">
               {pageTitle}
             </span>
             <div className="h-3 w-px bg-[var(--border)] opacity-30" />
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--accent-primary)] text-white text-[9px] font-black uppercase tracking-widest shadow-sm">
                <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                Live
             </div>
          </div>
        )}
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3 shrink-0">
        {onShowHistory && (
          <button 
            onClick={onShowHistory}
            className="h-8 px-4 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-light)] rounded-full border border-[var(--border)] hover:border-[var(--accent-primary)]/20 transition-all duration-300 font-bold text-[11px] uppercase tracking-wider group"
          >
            <History size={14} className="group-hover:rotate-[-45deg] transition-transform duration-500" />
            <span className="hidden sm:block">History Log</span>
          </button>
        )}

        {viewLiveUrl && (
          <a 
            href={viewLiveUrl} 
            target="_blank" 
            className="h-8 px-4 flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-light)] rounded-full border border-[var(--border)] hover:border-[var(--accent-primary)]/20 transition-all duration-300 font-bold text-[11px] uppercase tracking-wider group"
          >
            <Eye size={14} className="group-hover:scale-125 transition-transform" />
            <span className="hidden sm:block">View Live Site</span>
          </a>
        )}

        <div className="h-6 w-px bg-[var(--border)] mx-1" />
        <PublishButton />
        <div className="h-6 w-px bg-[var(--border)] mx-1" />

        <div className="flex items-center gap-1.5 group relative">
           <button 
             onClick={() => setShowUserMenu(!showUserMenu)}
             className={`p-[2px] rounded-full transition-all duration-300 transform active:scale-95
               ${showUserMenu ? 'bg-[var(--accent-primary)] ring-4 ring-[var(--focus-ring)] shadow-lg' : 'bg-[var(--border)] hover:bg-[var(--accent-primary)]/20 shadow-sm'}
             `}
           >
             <div className="w-8 h-8 rounded-full flex items-center justify-center p-0.5 relative overflow-hidden">
                <div className={`w-full h-full rounded-full flex items-center justify-center transition-colors duration-300 ${showUserMenu ? 'bg-white' : 'bg-[var(--accent-primary)]'}`}>
                   <span className={`text-[11px] font-[800] tracking-widest mb-[-1px] transition-colors duration-300 ${showUserMenu ? 'text-[var(--accent-primary)]' : 'text-white'}`}>
                      {initials}
                   </span>
                </div>
             </div>
           </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-11 w-[260px] bg-white border border-[var(--border)] rounded-[16px] shadow-[0_20px_60px_-15px_rgba(15,23,42,0.25)] z-20 overflow-hidden animate-slide-up origin-top-right ring-1 ring-black/5">
                <div className="p-5 bg-gradient-to-br from-[var(--bg-secondary)] to-white border-b border-[var(--border)]">
                   <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center text-white font-bold text-sm shadow-[0_4px_12px_rgba(23,74,95,0.25)]">
                         {initials}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                         <p className="text-[14px] font-[800] text-[var(--text-primary)] leading-tight">{userName}</p>
                         <p className="text-[11px] text-[var(--text-muted)] font-medium truncate mt-0.5">{userEmail}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-2">
                      <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border transition-all
                        ${userRole === 'super_admin' 
                          ? 'bg-amber-50 text-amber-600 border-amber-200 shadow-[0_2px_4px_rgba(217,119,6,0.1)]' 
                          : 'bg-[var(--accent-light)] text-[var(--accent-primary)] border-[var(--accent-primary)]/10'
                        }
                      `}>
                         {userRole === 'super_admin' ? 'Super Admin' : 'Basic Admin'}
                      </div>
                      <div className="px-2 py-0.5 rounded-full bg-[#f1f5f9] text-slate-500 text-[9px] font-black uppercase tracking-wider">
                         Secure Edge
                      </div>
                   </div>
                </div>
                
                 <div className="p-2 flex flex-col gap-1">
                   {/* Team Presence in Menu */}
                   <div className="px-3 py-1.5 flex items-center justify-between">
                     <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Team Presence</span>
                     <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                       <span className="text-[9px] font-bold text-emerald-500">Live</span>
                     </div>
                   </div>
                   <PresenceList admins={admins} currentEmail={userEmail} maxHeight="180px" />
                   
                   <div className="h-px bg-[var(--border)] mx-3 my-1 opacity-50" />

                   {userRole === 'super_admin' && (
                     <>
                       <div className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Management</div>
                       <button 
                         onClick={() => { router.push('/admin/approvals'); setShowUserMenu(false); }}
                         className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-black text-[var(--accent-primary)] hover:bg-[var(--accent-light)] rounded-[10px] transition-all group/approvals"
                       >
                         <div className="w-7 h-7 rounded-[8px] bg-[var(--accent-primary)]/10 flex items-center justify-center transition-all group-hover/approvals:scale-110">
                            <UserCheck size={16} />
                         </div>
                         <span>Pending Approvals</span>
                       </button>

                       <button 
                         onClick={() => { router.push('/admin/manage-admins'); setShowUserMenu(false); }}
                         className="flex items-center gap-3 w-full px-3 py-2 text-[13px] font-black text-indigo-600 hover:bg-indigo-50 rounded-[10px] transition-all group/manage"
                       >
                         <div className="w-7 h-7 rounded-[8px] bg-indigo-100 flex items-center justify-center transition-all group-hover/manage:scale-110">
                            <Users size={16} />
                         </div>
                         <span>Manage Admins</span>
                       </button>

                       <div className="h-px bg-[var(--border)] mx-3 my-1 opacity-50" />
                     </>
                   )}

                   <div className="px-3 py-2 text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Session Management</div>
                   
                   <button 
                     onClick={handleSignOut}
                     className="flex items-center gap-3 w-full px-3 py-2.5 text-[13px] font-black text-[var(--error)] hover:bg-[var(--error)]/5 rounded-[10px] transition-all group/signout"
                   >
                     <div className="w-7 h-7 rounded-[8px] bg-[var(--error)]/10 flex items-center justify-center transition-all group-hover/signout:scale-110">
                        <LogOut size={16} />
                     </div>
                     <span>Complete Session</span>
                   </button>
                </div>
                
                <div className="px-5 py-3 bg-[var(--bg-secondary)] text-center">
                   <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-[0.2em]">Node 44.2.1-SECURE</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
