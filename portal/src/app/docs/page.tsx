'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export default function DocsHome() {
  const router = useRouter();

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }
    // Fetch the sidebar for the "docs" workspace to find the real first page in the tree
    api.get('/sidebar?workspace=docs').then((res: any) => {
      const tree = res.tree || [];
      const JUNK_SLUG_RE = /^(new-?page-?\d*|untitled-?\d*|page-?\d*|new-?\d*|tmp-?\d*|[a-z0-9])$/i;
      
      const findFirstPage = (nodes: any[]): string | null => {
        for (const n of nodes) {
          if (n.type === 'page' && n.slug && !JUNK_SLUG_RE.test(n.slug.split('/').pop() || '')) return n.slug;
          if (n.children) {
            const r = findFirstPage(n.children);
            if (r) return r;
          }
        }
        return null;
      };

      const firstPage = findFirstPage(tree);
      if (firstPage) {
        router.replace(`/docs/${firstPage}`);
      }
    }).catch(() => router.push('/login'));
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc] animate-fade-in">
      <div className="relative flex items-center justify-center mb-6">
        {/* Spinning Outer Ring */}
        <div className="absolute w-20 h-20 border-2 border-[var(--accent-primary)]/10 rounded-full" />
        <div className="absolute w-20 h-20 border-t-2 border-[var(--accent-primary)] rounded-full animate-spin" />
        
        {/* Pulsing Logo Core */}
        <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center relative z-10 animate-pulse-subtle">
           <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        </div>
      </div>
      
      <p className="text-[13px] font-semibold text-[var(--accent-primary)]/60 tracking-widest uppercase animate-pulse">
        Initializing Document Stream
      </p>
      
      <style jsx global>{`
        @keyframes pulse-subtle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.95; }
        }
        .animate-pulse-subtle {
          animation: pulse-subtle 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
}
