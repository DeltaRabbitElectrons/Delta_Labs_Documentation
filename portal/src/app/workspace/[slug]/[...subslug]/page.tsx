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

export default function WorkspacePageContent() {
  const params = useParams();
  const router = useRouter();

  const workspaceSlug = params.slug as string;
  const slugParts = params.subslug;
  const rawSlug = Array.isArray(slugParts) ? slugParts.join('/') : (slugParts ?? '');

  const [page, setPage] = useState<PageData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changeMap, setChangeMap] = useState<Record<string, ChangeLogEntry>>({});

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) {
      router.push('/login');
      return;
    }
  }, [router]);

  const loadPage = async (targetSlug: string) => {
    try {
      setPage(null);
      setChangeMap({});
      const data = await api.get<PageData>(`/pages/${targetSlug}?workspace=${workspaceSlug}`);
      setPage(data);
      const map: Record<string, ChangeLogEntry> = {};
      (data.change_log || []).forEach(entry => {
        map[entry.block_id] = entry;
      });
      setChangeMap(map);
    } catch {
      router.push(`/workspace/${workspaceSlug}`);
    }
  };

  useEffect(() => {
    if (rawSlug) loadPage(rawSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSlug, workspaceSlug]);

  if (!page) {
    return <LoadingScreen message="Loading Workspace Content" />;
  }

  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)] selection:bg-[#eff6ff]">
      <AdminNavbar
        pageTitle={page.title}
        onShowHistory={() => setShowHistory(true)}
      />

      <DocsSidebar
        currentSlug={page.slug}
        onNavigate={s => router.push(`/workspace/${workspaceSlug}/${s}`)}
        workspaceSlug={workspaceSlug}
      />

      <main className="pl-[var(--sidebar-width,280px)] pt-[52px] min-h-screen flex flex-col items-center">
        {loading && <LoadingScreen message="Saving Changes" fullScreen={true} />}

        <div className="w-full max-w-[800px] px-12 py-20 animate-fade-in">
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
      </main>

      <HistoryModal
        slug={page.slug}
        workspace={workspaceSlug}
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
