'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  Loader2, 
  AlertCircle,
  ShieldAlert,
  Search,
  ArrowLeft,
  ChevronDown,
  UserMinus,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToasts } from '@/components/Toast';
import AdminNavbar from '@/components/AdminNavbar';
import Link from 'next/link';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  role: string;
  status: string;
  created_at: string;
}

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);
  
  const router = useRouter();
  const { addToast } = useToasts();
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Auth Check
    const token = localStorage.getItem('portal_token');
    const role = localStorage.getItem('role');
    
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (role !== 'super_admin') {
      addToast('error', 'Access denied: Super Admin only');
      router.push('/docs');
      return;
    }

    fetchAdmins();

    // Click outside dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [router]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const data = await api.get<AdminUser[]>('/admin/users');
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (admin: AdminUser, newRole: string) => {
    if (admin.role === newRole) {
      setOpenDropdown(null);
      return;
    }

    setActionLoading(admin.id);
    setOpenDropdown(null);
    try {
      await api.patch(`/admin/users/${admin.id}/role`, { role: newRole });
      addToast('success', `${admin.name} is now a ${newRole === 'super_admin' ? 'Super Admin' : 'Basic Admin'}`);
      setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, role: newRole } : a));
    } catch (err: any) {
      addToast('error', err.response?.data?.detail || err.message || 'Failed to update role');
    } finally {
      setActionLoading(null);
    }
  };

  const executeDelete = async () => {
    if (!confirmDelete) return;
    
    const { id, name } = confirmDelete;
    setActionLoading(id);
    setConfirmDelete(null);
    
    try {
      await api.delete(`/admin/users/${id}`);
      addToast('success', `${name} has been removed`);
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to remove admin');
    } finally {
      setActionLoading(id === confirmDelete?.id ? null : actionLoading);
      setActionLoading(null);
    }
  };

  const filteredAdmins = admins.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar pageTitle="Manage Team" />
      
      <main className="pt-[80px] pb-12 px-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <Link href="/admin/approvals" className="inline-flex items-center gap-2 text-[12px] font-bold text-[var(--accent-primary)] mb-3 hover:underline group">
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Return to Approvals
            </Link>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                <Users size={20} />
              </div>
              <h1 className="text-[24px] font-[800] text-[var(--text-primary)] tracking-tight">
                Admin Management
              </h1>
            </div>
            <p className="text-[14px] text-[var(--text-secondary)]">Efficiently manage team roles and permissions</p>
          </div>

          <div className="relative group max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Search team..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-white border border-[var(--border)] rounded-xl text-[13px] outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
            <AlertCircle size={18} />
            <span className="text-[14px] font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
            <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">Compiling Team Data...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="py-24 bg-white border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center animate-fade-in shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-1">No admins found</h3>
            <p className="text-[14px] text-[var(--text-secondary)]">Try adjusting your search or approve pending requests.</p>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-visible animate-fade-in">
            <div className="w-full relative overflow-visible">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-slate-50/50 border-b border-[var(--border)]">
                     <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Admin Name</th>
                     <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Contact Info</th>
                     <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Role & Tier</th>
                     <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap">Joined On</th>
                     <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest whitespace-nowrap text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-[var(--border)]">
                   {filteredAdmins.map((admin) => (
                     <tr 
                       key={admin.id} 
                       className={`hover:bg-slate-50/5 transition-colors group relative ${openDropdown === admin.id ? 'z-[70]' : 'z-10'}`}
                     >
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                             <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-[13px] shadow-sm transform transition-transform group-hover:scale-105
                               ${admin.role === 'super_admin' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}
                             `}>
                                {admin.name.charAt(0).toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[14px] font-[800] text-[var(--text-primary)] leading-tight">{admin.name}</span>
                               <span className="text-[11px] text-[var(--text-muted)] font-medium mt-0.5 capitalize">{admin.status}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2 text-[13px] text-slate-600">
                              <Mail size={13} className="text-slate-400" />
                              {admin.email}
                            </div>
                            <div className="flex items-center gap-2 text-[12px] text-slate-400">
                              <Phone size={13} className="text-slate-300" />
                              {admin.phone_number || 'No phone registered'}
                            </div>
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="relative" ref={openDropdown === admin.id ? dropdownRef : null}>
                            <button 
                              onClick={() => setOpenDropdown(openDropdown === admin.id ? null : admin.id)}
                              disabled={actionLoading === admin.id}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all text-[10px] font-black uppercase tracking-wider shadow-sm outline-none
                                ${admin.role === 'super_admin' 
                                  ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' 
                                  : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
                                }
                                ${openDropdown === admin.id ? 'ring-2 ring-indigo-500/20 active:scale-95' : ''}
                              `}
                            >
                              {actionLoading === admin.id ? <Loader2 size={12} className="animate-spin" /> : admin.role === 'super_admin' ? <ShieldAlert size={12} /> : <ShieldCheck size={12} />}
                              {admin.role === 'super_admin' ? 'Super Admin' : 'Basic Admin'}
                              <ChevronDown size={10} className={`ml-1 opacity-40 transition-transform duration-200 ${openDropdown === admin.id ? 'rotate-180' : ''}`} />
                            </button>
   
                            {/* Custom Dropdown */}
                            {openDropdown === admin.id && (
                              <div className="absolute top-10 left-0 w-[180px] bg-white border border-[var(--border)] rounded-[12px] shadow-[0_10px_30px_-5px_rgba(15,23,42,0.25)] z-[80] overflow-hidden animate-slide-up origin-top-left py-1.5">
                                 <button
                                   onClick={() => updateRole(admin, 'super_admin')}
                                   className="flex items-center justify-between w-full px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                 >
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-600 flex items-center justify-center">
                                         <ShieldAlert size={12} />
                                      </div>
                                      <span>Super Admin</span>
                                   </div>
                                   {admin.role === 'super_admin' && <Check size={14} className="text-amber-600" />}
                                 </button>
                                 
                                 <button
                                   onClick={() => updateRole(admin, 'admin')}
                                   className="flex items-center justify-between w-full px-3 py-2 text-[12px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                 >
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-600 flex items-center justify-center">
                                         <ShieldCheck size={12} />
                                      </div>
                                      <span>Basic Admin</span>
                                   </div>
                                   {admin.role === 'admin' && <Check size={14} className="text-indigo-600" />}
                                 </button>
                              </div>
                            )}
                          </div>
                       </td>
                       <td className="px-6 py-5">
                          <div className="flex items-center gap-2 text-[13px] text-slate-600">
                             <Calendar size={14} className="text-slate-400" />
                             {new Date(admin.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                       </td>
                       <td className="px-6 py-5 text-right">
                          <button
                            onClick={() => setConfirmDelete(admin)}
                            disabled={actionLoading !== null || localStorage.getItem('email') === admin.email}
                            className={`h-8 px-4 flex items-center gap-2 rounded-lg font-bold text-[12px] transition-all shadow-sm
                              ${localStorage.getItem('email') === admin.email 
                                ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50' 
                                : 'bg-white border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white'
                              }
                            `}
                          >
                            {actionLoading === admin.id ? (
                               <Loader2 size={14} className="animate-spin" />
                            ) : (
                               <UserMinus size={14} />
                            )}
                            <span>Remove Member</span>
                          </button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </main>

      {/* CUSTOM CONFIRM MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-fade-in-backdrop">
           <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setConfirmDelete(null)} />
           
           <div className="relative w-full max-w-[400px] bg-white rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden animate-modal-pop">
              <div className="p-8">
                 <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 mx-auto">
                    <AlertTriangle size={32} />
                 </div>
                 
                 <div className="text-center mb-8">
                    <h3 className="text-[20px] font-[800] text-slate-900 mb-2">Remove Team Member?</h3>
                    <p className="text-[14px] text-slate-500 leading-relaxed px-4">
                       Are you sure you want to remove <span className="font-bold text-slate-900">{confirmDelete.name}</span>? They will lose all access to the admin portal immediately.
                    </p>
                 </div>
                 
                 <div className="flex flex-col gap-3">
                    <button
                      onClick={executeDelete}
                      className="w-full h-[48px] bg-rose-500 hover:bg-rose-600 text-white font-[700] text-[14px] rounded-[14px] shadow-[0_4px_12px_rgba(244,63,94,0.3)] transition-all active:scale-[0.98]"
                    >
                      Permanently Remove
                    </button>
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="w-full h-[48px] bg-white border border-slate-200 text-slate-600 font-[700] text-[14px] rounded-[14px] hover:bg-slate-50 transition-all"
                    >
                      Cancel
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInBackdrop {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(4px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-fade-in-backdrop {
          animation: fadeInBackdrop 0.3s ease-out forwards;
        }
        .animate-modal-pop {
          animation: modalPop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
