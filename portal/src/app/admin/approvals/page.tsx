'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CheckCircle2, 
  XCircle, 
  UserCheck, 
  Users, 
  Calendar, 
  Phone, 
  Mail,
  Loader2,
  AlertCircle,
  Inbox
} from 'lucide-react';
import { api } from '@/lib/api';
import { useToasts } from '@/components/Toast';
import AdminNavbar from '@/components/AdminNavbar';

interface PendingAdmin {
  id: string;
  name: string;
  email: string;
  phone_number: string | null;
  created_at: string;
}

export default function ApprovalsPage() {
  const [admins, setAdmins] = useState<PendingAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const router = useRouter();
  const { addToast } = useToasts();

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

    fetchApprovals();
  }, [router]);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.get<PendingAdmin[]>('/admin/approvals');
      setAdmins(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/approve/${id}`, {});
      addToast('success', 'Admin approved successfully');
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to approve admin');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/reject/${id}`, {});
      addToast('success', 'Admin request rejected');
      setAdmins(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      addToast('error', err.message || 'Failed to reject admin');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <AdminNavbar pageTitle="Admin Approvals" />
      
      <main className="pt-[80px] pb-12 px-6 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/10 flex items-center justify-center text-[var(--accent-primary)]">
              <UserCheck size={20} />
            </div>
            <h1 className="text-[24px] font-[800] text-[var(--text-primary)] tracking-tight">
              Pending Approvals
            </h1>
          </div>
          <p className="text-[14px] text-[var(--text-secondary)]">Manage incoming admin access requests</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in">
            <AlertCircle size={18} />
            <span className="text-[14px] font-medium">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-[var(--accent-primary)] mb-4" size={32} />
            <p className="text-[13px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Loading Requests...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="py-24 bg-white border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
              <Inbox size={32} />
            </div>
            <h3 className="text-[18px] font-bold text-[var(--text-primary)] mb-1">No pending requests</h3>
            <p className="text-[14px] text-[var(--text-secondary)]">Your approval queue is currently empty.</p>
          </div>
        ) : (
          <div className="bg-white border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden animate-fade-in">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-[var(--border)]">
                  <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Phone</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Signed Up</th>
                  <th className="px-6 py-4 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] flex items-center justify-center font-bold text-[12px]">
                             {admin.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[14px] font-bold text-[var(--text-primary)]">{admin.name}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <Mail size={14} className="text-slate-400" />
                          {admin.email}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <Phone size={14} className="text-slate-400" />
                          {admin.phone_number || <span className="text-slate-300 italic">No phone</span>}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2 text-[13px] text-slate-600">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(admin.created_at).toLocaleDateString()}
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(admin.id)}
                            disabled={actionLoading !== null}
                            className="h-8 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoading === admin.id ? (
                               <Loader2 size={14} className="animate-spin" />
                            ) : (
                               <CheckCircle2 size={14} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(admin.id)}
                            disabled={actionLoading !== null}
                            className="h-8 px-4 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {actionLoading === admin.id ? (
                               <Loader2 size={14} className="animate-spin" />
                            ) : (
                               <XCircle size={14} />
                            )}
                            Reject
                          </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
