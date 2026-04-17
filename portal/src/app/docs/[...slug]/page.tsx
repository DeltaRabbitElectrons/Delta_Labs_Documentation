'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DocsSidebar from '@/components/DocsSidebar';
import EditableBlock, { ChangeLogEntry } from '@/components/EditableBlock';
import { api } from '@/lib/api';
import RichEditor from '@/components/RichEditor';
import AdminNavbar from '@/components/AdminNavbar';
import HistoryModal from '@/components/HistoryModal';
import LoadingScreen from '@/components/LoadingScreen';
import { ChevronRight } from 'lucide-react';

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
  const [pageLoading, setPageLoading] = useState(true);
  const [changeMap, setChangeMap] = useState<Record<string, ChangeLogEntry>>({});
  const [isNewPage] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }
  }, [router]);

  const loadPage = async (targetSlug: string) => {
    try {
      setPageLoading(true);
      // We purposefully DO NOT setPage(null) here so the sidebar/navbar remain visible
      setChangeMap({});
      const data = await api.get<PageData>(`/pages/${targetSlug}`);
      setPage(data);
      const map: Record<string, ChangeLogEntry> = {};
      (data.change_log || []).forEach(entry => {
        map[entry.block_id] = entry;
      });
      setChangeMap(map);
    } catch {
      router.push('/docs');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (slug && cleanSlug === rawSlug) loadPage(slug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!page) {
    return <LoadingScreen message="Loading Document Stream" />;
  }

  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)] selection:bg-[#eff6ff]">
      <AdminNavbar
        pageTitle={page.title}
        onShowHistory={() => setShowHistory(true)}
        viewLiveUrl={`https://delta-labs-docs-cyan.vercel.app/${page.slug}`}
      />

      <DocsSidebar
        currentSlug={page.slug}
        onNavigate={s => router.push(`/docs/${s}`)}
      />

      <main className="pl-[var(--sidebar-width,280px)] pt-[52px] min-h-screen flex flex-col items-center">
        {loading && <LoadingScreen message="Synchronizing Changes" fullScreen={true} />}

        <div className={`w-full max-w-[800px] px-12 py-20 transition-opacity duration-300 ${pageLoading ? 'opacity-30 pointer-events-none blur-[2px]' : 'opacity-100'}`}>
          {/* Breadcrumb Context */}
          <div className="flex items-center gap-2 mb-10 text-[var(--text-muted)] text-[12px] font-medium uppercase tracking-[0.05em]">
            <span>Documentation</span>
            <ChevronRight size={12} />
            <span className="text-[var(--text-secondary)]">{page.category}</span>
          </div>

          {isNewPage && (
            <div className="mb-6 px-4 py-3 bg-[#f6faf8] border border-[#c6eed9] rounded-lg text-[13px] text-[#2e8555]">
              ✨ New page — click the content area below to start writing.
            </div>
          )}

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
      </main>

      <HistoryModal
        slug={page.slug}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        onRevertSuccess={() => {
          setLoading(true);
          loadPage(page.slug).finally(() => setLoading(false));
        }}
      />
    </div>
  );
}
