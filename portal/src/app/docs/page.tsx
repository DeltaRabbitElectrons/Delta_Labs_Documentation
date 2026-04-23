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
    api.get('/sidebar?workspace=docs').then((res: any) => {
      const tree = res.tree || [];
      
      // Strictly find the first valid page in depth-first order
      const findFirstPage = (nodes: any[]): string | null => {
        if (!nodes || nodes.length === 0) return null;
        
        for (const n of nodes) {
          // If it's a page and not a junk/draft slug, this is our winner
          if (n.type === 'page' && n.slug && n.slug.length > 1) {
            const lastPart = n.slug.split('/').pop() || '';
            const isJunk = /^(new-?page|untitled|page|tmp|draft)/i.test(lastPart);
            if (!isJunk) return n.slug;
          }
          
          // If it's a category, look inside its children first (depth-first)
          if (n.type === 'category' && n.children && n.children.length > 0) {
            const firstChild = findFirstPage(n.children);
            if (firstChild) return firstChild;
          }
        }
        return null;
      };

      const firstPage = findFirstPage(tree);
      if (firstPage) {
        console.log('Redirecting to first page:', firstPage);
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
