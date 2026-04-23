'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DocsSidebar from '@/components/DocsSidebar';
import EditableBlock, { ChangeLogEntry } from '@/components/EditableBlock';
import { api } from '@/lib/api';
import RichEditor from '@/components/RichEditor';
import AdminNavbar from '@/components/AdminNavbar';
import HistoryModal from '@/components/HistoryModal';
import { ChevronRight } from 'lucide-react';
import { pageCache } from '@/lib/pageCache';

interface PageData {
  slug: string;
  title: string;
  content: string;
  category: string;
  sidebar_label?: string;
  sidebar_position: number;
  updatedAt?: string;
  lastEditedBy?: string;
  change_log: ChangeLogEntry[];
}

export default function WorkspacePageContent() {
  const params = useParams();
  const router = useRouter();

  const workspaceSlug = params.slug as string;
  const slugParts = params.subslug;
  const rawSlug = Array.isArray(slugParts) ? slugParts.join('/') : (slugParts ?? '');

  const [page, setPage] = useState<PageData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [changeMap, setChangeMap] = useState<Record<string, ChangeLogEntry>>({});
  const loadingSlugRef = useRef<string>('');

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }
  }, [router]);

  const buildChangeMap = (data: PageData): Record<string, ChangeLogEntry> => {
    const map: Record<string, ChangeLogEntry> = {};
    (data.change_log || []).forEach(entry => {
      map[entry.block_id] = entry;
    });
    return map;
  };

  const loadPage = useCallback(async (targetSlug: string) => {
    const cacheKey = `${workspaceSlug}:${targetSlug}`;
    loadingSlugRef.current = cacheKey;

    // 1. Instant cache hit — show immediately
    const cached = pageCache.get(cacheKey);
    if (cached) {
      setPage(cached);
      setChangeMap(buildChangeMap(cached));
    }

    // 2. Always fetch fresh in background
    try {
      const data = await api.get<PageData>(`/pages/${targetSlug}?workspace=${workspaceSlug}`);
      if (loadingSlugRef.current === cacheKey) {
        pageCache.set(cacheKey, data);
        setPage(data);
        setChangeMap(buildChangeMap(data));
      }
    } catch {
      if (!cached) {
        setNotFound(true);
      }
    }
  }, [workspaceSlug, router]);

  useEffect(() => {
    setNotFound(false);
    if (rawSlug) loadPage(rawSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSlug, workspaceSlug]);

  const displayTitle = page?.title || rawSlug.split('/').pop()?.replace(/-/g, ' ') || '...';

  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)] selection:bg-[#eff6ff]">
      <AdminNavbar
        pageTitle={displayTitle}
        onShowHistory={() => setShowHistory(true)}
      />

      <DocsSidebar
        currentSlug={page?.slug || rawSlug}
        onNavigate={s => router.push(`/workspace/${workspaceSlug}/${s}`)}
        workspaceSlug={workspaceSlug}
      />

      <main className="pl-[var(--sidebar-width,280px)] pt-[52px] min-h-screen flex flex-col items-center">
        {loading && (
          <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {notFound ? (
          <div className="w-full max-w-[800px] px-12 py-20">
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 shadow-sm">
                <ChevronRight size={32} className="text-slate-300" />
              </div>
              <h1 className="text-[22px] font-bold text-slate-800 mb-2">Page Not Found</h1>
              <p className="text-[14px] text-slate-500 mb-6 text-center leading-relaxed max-w-[320px]">
                The page <span className="font-semibold text-slate-700">&ldquo;{rawSlug}&rdquo;</span> doesn&apos;t exist in this workspace. Select a page from the sidebar.
              </p>
              <button
                onClick={() => router.push(`/workspace/${workspaceSlug}`)}
                className="px-5 py-2.5 rounded-xl bg-[var(--accent-primary)] text-white text-[13px] font-bold hover:bg-[var(--accent-hover)] transition-all shadow-md"
              >
                Go to Workspace
              </button>
            </div>
          </div>
        ) : page ? (
          <div className="w-full max-w-[800px] px-12 py-20">
            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 mb-10 text-[var(--text-muted)] text-[12px] font-medium uppercase tracking-[0.05em]">
              <span>{workspaceSlug}</span>
              <ChevronRight size={12} />
              <span className="text-[var(--text-secondary)]">{page.category}</span>
            </div>

            {/* Title Area */}
            <div className="mb-12">
              <EditableBlock
                blockId="title"
                field="title"
                initialValue={page.title}
                slug={page.slug}
                workspace={workspaceSlug}
                isMarkdown={false}
                className="text-[30px] font-bold text-[var(--text-primary)] tracking-tight leading-tight transition-all duration-150"
                changeInfo={changeMap['title']}
              />
              {page.updatedAt && (
                 <div className="mt-4 flex items-center gap-2 text-[var(--text-muted)] text-[12px]">
                    <span>Last edited {new Date(page.updatedAt).toLocaleDateString()}</span>
                    <div className="w-1 h-1 rounded-full bg-[var(--border)]" />
                    <span>By {page.lastEditedBy || 'System'}</span>
                 </div>
              )}
            </div>

            {/* Main Content Area */}
            <section className="prose prose-slate max-w-none">
              <RichEditor
                blockId="content"
                content={page.content}
                slug={page.slug}
                workspace={workspaceSlug}
                changeInfo={changeMap['content']}
              />
            </section>
          </div>
        ) : (
          /* Minimal skeleton — only shown on first-ever visit */
          <div className="w-full max-w-[800px] px-12 py-20">
            <div className="h-3 w-32 bg-slate-100 rounded mb-10" />
            <div className="h-8 w-64 bg-slate-100 rounded mb-4" />
            <div className="h-3 w-48 bg-slate-50 rounded mb-12" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-slate-50 rounded" />
              <div className="h-4 w-5/6 bg-slate-50 rounded" />
              <div className="h-4 w-4/6 bg-slate-50 rounded" />
            </div>
          </div>
        )}
      </main>

      {page && (
        <HistoryModal
          slug={page.slug}
          workspace={workspaceSlug}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRevertSuccess={() => {
            setLoading(true);
            pageCache.invalidate(`${workspaceSlug}:${page.slug}`);
            loadPage(page.slug).finally(() => setLoading(false));
          }}
        />
      )}
    </div>
  );
}
