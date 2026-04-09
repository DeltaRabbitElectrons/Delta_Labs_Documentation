import { api } from './api';
import { pendingChanges } from './pendingChanges';

export interface DraftPage {
  slug: string;
  content: string;
  lastEdited: string;
}

export interface SidebarNode {
  id: string;
  type: 'page' | 'category';
  label: string;
  slug?: string;
  children?: SidebarNode[];
  isOpen?: boolean;
}

export interface DraftSidebar {
  tree: SidebarNode[];
  lastEdited: string;
}

const STORAGE_KEYS = {
  PAGES: 'delta_draft_pages_',
  SIDEBAR: 'delta_draft_sidebar_',
};

class DraftStore {
  private getPageKey(workspace: string) { return `${STORAGE_KEYS.PAGES}${workspace}`; }
  private getSidebarKey(workspace: string) { return `${STORAGE_KEYS.SIDEBAR}${workspace}`; }

  // --- Page Drafts ---

  getAllPages(workspace: string = 'docs'): Record<string, DraftPage> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.getPageKey(workspace));
    return stored ? JSON.parse(stored) : {};
  }

  getPage(slug: string, workspace: string = 'docs'): string | null {
    const pages = this.getAllPages(workspace);
    return pages[slug]?.content || null;
  }

  savePage(slug: string, content: string, originalContent: string, workspace: string = 'docs') {
    const pages = this.getAllPages(workspace);
    
    if (content === originalContent) {
      if (pages[slug]) {
        delete pages[slug];
        localStorage.setItem(this.getPageKey(workspace), JSON.stringify(pages));
        this.syncWithPendingChanges(workspace);
      }
      return;
    }

    pages[slug] = {
      slug,
      content,
      lastEdited: new Date().toISOString(),
    };
    localStorage.setItem(this.getPageKey(workspace), JSON.stringify(pages));
    this.syncWithPendingChanges(workspace);
  }

  removePage(slug: string, workspace: string = 'docs') {
    const pages = this.getAllPages(workspace);
    if (pages[slug]) {
      delete pages[slug];
      localStorage.setItem(this.getPageKey(workspace), JSON.stringify(pages));
      this.syncWithPendingChanges(workspace);
    }
  }

  // --- Sidebar Drafts ---

  getSidebar(workspace: string = 'docs'): DraftSidebar | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(this.getSidebarKey(workspace));
    return stored ? JSON.parse(stored) : null;
  }

  saveSidebar(tree: SidebarNode[], workspace: string = 'docs') {
    const sidebar: DraftSidebar = {
      tree,
      lastEdited: new Date().toISOString(),
    };
    localStorage.setItem(this.getSidebarKey(workspace), JSON.stringify(sidebar));
    this.syncWithPendingChanges(workspace);
  }

  removeSidebar(workspace: string = 'docs') {
    localStorage.removeItem(this.getSidebarKey(workspace));
    this.syncWithPendingChanges(workspace);
  }

  // --- Sync & Publish ---

  private syncWithPendingChanges(workspace: string) {
    const pages = this.getAllPages(workspace);
    const sidebar = this.getSidebar(workspace);
    
    // We append workspace to the pending change ID to avoid cross-workspace collisions
    pendingChanges.removeByNamespace(workspace);
    
    Object.keys(pages).forEach(slug => {
      pendingChanges.registerChange('page', `${workspace}:${slug}`, async () => {}, workspace);
    });

    if (sidebar) {
      pendingChanges.registerChange('sidebar', `${workspace}:main`, async () => {}, workspace);
    }
  }

  async publishChanges(workspace: string = 'docs') {
    const pages = this.getAllPages(workspace);
    const sidebar = this.getSidebar(workspace);

    // 1. Save all pages
    for (const draft of Object.values(pages)) {
      await api.post(`/content/save`, {
        slug: draft.slug,
        field: 'content',
        newValue: draft.content,
        block_id: 'content',
        workspace: workspace
      });
    }

    // 2. Save sidebar if changed
    if (sidebar) {
      await api.post(`/sidebar?workspace=${workspace}`, { tree: sidebar.tree });
    }

    // 3. Trigger rebuild (only for docs)
    if (workspace === 'docs') {
      await api.post('/content/trigger-rebuild', {});
    }
    
    // 4. Clear everything for THIS workspace
    this.clearAll(workspace);
    this.syncWithPendingChanges(workspace);
  }

  hasChanges(workspace: string = 'docs'): boolean {
    const pages = this.getAllPages(workspace);
    const sidebar = this.getSidebar(workspace);
    return Object.keys(pages).length > 0 || sidebar !== null;
  }

  clearAll(workspace: string = 'docs') {
    localStorage.removeItem(this.getPageKey(workspace));
    localStorage.removeItem(this.getSidebarKey(workspace));
    this.syncWithPendingChanges(workspace);
  }
}

export const draftStore = new DraftStore();
