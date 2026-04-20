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

export default function EditableDocs() {
  const params = useParams();
  const router = useRouter();

  const slugParts = params.slug;
  const rawSlug = Array.isArray(slugParts) ? slugParts.join('/') : (slugParts ?? '');

  // Safety: Strip numbered prefixes client-side if they exist
  const cleanSlug = rawSlug.split('/').map(p => p.replace(/^\d+-/, '')).join('/');
  
  useEffect(() => {
    if (cleanSlug !== rawSlug) {
      router.replace(`/docs/${cleanSlug}`);
    }
  }, [cleanSlug, rawSlug, router]);

  const slug = cleanSlug;

  const [page, setPage] = useState<PageData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
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
    loadingSlugRef.current = targetSlug;
    
    // 1. Check cache first — if we have it, show it IMMEDIATELY (zero delay)
    const cached = pageCache.get(targetSlug);
    if (cached) {
      setPage(cached);
      setChangeMap(buildChangeMap(cached));
    }

    // 2. Always fetch fresh data in the background (stale-while-revalidate)
    try {
      const data = await api.get<PageData>(`/pages/${targetSlug}`);
      // Only apply if we're still on the same slug (user didn't navigate away)
      if (loadingSlugRef.current === targetSlug) {
        pageCache.set(targetSlug, data);
        setPage(data);
        setChangeMap(buildChangeMap(data));
      }
    } catch {
      // If we had cached data, keep showing it. Otherwise redirect.
      if (!cached) {
        router.push('/docs');
      }
    }
  }, [router]);

  useEffect(() => {
    if (slug && cleanSlug === rawSlug) loadPage(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Derive display title from whatever we have
  const displayTitle = page?.title || cleanSlug.split('/').pop()?.replace(/-/g, ' ') || '...';

  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)] selection:bg-[#eff6ff]">
      <AdminNavbar
        pageTitle={displayTitle}
        onShowHistory={() => setShowHistory(true)}
        viewLiveUrl={page ? `https://delta-labs-docs-cyan.vercel.app/${page.slug}` : undefined}
      />

      <DocsSidebar
        currentSlug={page?.slug || cleanSlug}
        onNavigate={s => router.push(`/docs/${s}`)}
      />

      <main className="pl-[var(--sidebar-width,280px)] pt-[52px] min-h-screen flex flex-col items-center">
        {loading && (
          <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {page ? (
          <div className="w-full max-w-[800px] px-12 py-20">
            {/* Breadcrumb Context */}
            <div className="flex items-center gap-2 mb-10 text-[var(--text-muted)] text-[12px] font-medium uppercase tracking-[0.05em]">
              <span>Documentation</span>
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
                changeInfo={changeMap['content']}
              />
            </section>
          </div>
        ) : (
          /* Only shows on the very first page load ever — a minimal skeleton */
          <div className="w-full max-w-[800px] px-12 py-20 animate-pulse">
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
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRevertSuccess={() => {
            setLoading(true);
            pageCache.invalidate(page.slug);
            loadPage(page.slug).finally(() => setLoading(false));
          }}
        />
      )}
    </div>
  );
}
