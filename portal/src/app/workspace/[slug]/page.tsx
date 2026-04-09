'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import WorkspaceLayout from '@/components/WorkspaceLayout';
import DocsSidebar from '@/components/DocsSidebar';
import LoadingScreen from '@/components/LoadingScreen';
import { ChevronRight, FileText } from 'lucide-react';

interface WorkspaceData {
  id: string;
  name: string;
  slug: string;
  order: number;
}

export default function WorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }

    // Fetch all workspaces and find the one matching the slug
    api.get<WorkspaceData[]>('/workspaces')
      .then(workspaces => {
        const found = workspaces.find(w => w.slug === slug);
        if (found) {
          setWorkspace(found);
          // Now fetch the sidebar for this workspace to see if we should redirect
          api.get(`/sidebar?workspace=${slug}`).then((res: any) => {
             const tree = res.tree || [];
             if (tree.length > 0) {
               // Find first page
               const findFirstPage = (nodes: any[]): string | null => {
                 for (const n of nodes) {
                   if (n.type === 'page' && n.slug) return n.slug;
                   if (n.children) {
                     const r = findFirstPage(n.children);
                     if (r) return r;
                   }
                 }
                 return null;
               };
               const firstPage = findFirstPage(tree);
               if (firstPage) {
                 router.replace(`/workspace/${slug}/${firstPage}`);
               } else {
                 setLoading(false);
               }
             } else {
               setLoading(false);
             }
          }).catch(() => setLoading(false));
        } else {
          setNotFound(true);
          setLoading(false);
        }
      })
      .catch(() => {
        router.push('/login');
      });
  }, [slug, router]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center animate-fade-in">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mx-auto mb-6 shadow-sm">
            <FileText size={32} className="text-[var(--text-muted)]" />
          </div>
          <h1 className="text-[22px] font-bold text-[var(--text-primary)] mb-2">
            Workspace Not Found
          </h1>
          <p className="text-[14px] text-[var(--text-muted)] mb-6">
            The workspace <span className="font-semibold text-[var(--text-secondary)]">&ldquo;{slug}&rdquo;</span> does not exist.
          </p>
          <button
            onClick={() => router.push('/docs')}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-[13px] font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md"
          >
            Go to Documentation
          </button>
        </div>
      </div>
    );
  }

  if (loading || !workspace) {
    return <LoadingScreen message="Loading Workspace" />;
  }

  return (
    <WorkspaceLayout
      pageTitle={workspace.name}
      sidebar={
        <DocsSidebar 
          currentSlug="" 
          onNavigate={s => router.push(`/workspace/${slug}/${s}`)} 
          workspaceSlug={slug}
        />
      }
    >
      <div className="w-full max-w-[800px] px-12 py-20 animate-fade-in">
        <div className="flex items-center gap-2 mb-10 text-[var(--text-muted)] text-[12px] font-medium uppercase tracking-[0.05em]">
          <span>Workspaces</span>
          <ChevronRight size={12} />
          <span className="text-[var(--text-secondary)]">{workspace.name}</span>
        </div>

        <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
          <div className="w-24 h-24 rounded-3xl bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center mb-8 shadow-sm">
            <FileText size={40} className="text-[var(--text-muted)]" />
          </div>

          <h1 className="text-[26px] font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            {workspace.name}
          </h1>

          <p className="text-[14px] text-[var(--text-muted)] text-center leading-relaxed max-w-[320px]">
            This workspace is empty. Start by creating a page in the sidebar.
          </p>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
