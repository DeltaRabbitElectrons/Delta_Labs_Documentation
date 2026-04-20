import { api } from './api';
import { pendingChanges } from './pendingChanges';

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

export interface DraftPageFields {
  slug: string;
  fields: Record<string, string>; // fieldKey (e.g. 'content', 'title') -> draftValue
  lastEdited: string;
}

const STORAGE_KEYS = {
  PAGES_V2: 'delta_draft_pages_v2_', // Use V2 to avoid breaking old content-only drafts
  SIDEBAR: 'delta_draft_sidebar_',
};

class DraftStore {
  private getPageKey(workspace: string) { return `${STORAGE_KEYS.PAGES_V2}${workspace}`; }
  private getSidebarKey(workspace: string) { return `${STORAGE_KEYS.SIDEBAR}${workspace}`; }

  // --- Page Field Drafts ---

  getAllPages(workspace: string = 'docs'): Record<string, DraftPageFields> {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(this.getPageKey(workspace));
    return stored ? JSON.parse(stored) : {};
  }

  getField(slug: string, field: string, workspace: string = 'docs'): string | null {
    const pages = this.getAllPages(workspace);
    return pages[slug]?.fields[field] || null;
  }

  /**
   * For backward compatibility with RichEditor content saving
   */
  getPage(slug: string, workspace: string = 'docs'): string | null {
    return this.getField(slug, 'content', workspace);
  }

  saveField(slug: string, field: string, newValue: string, originalValue: string, workspace: string = 'docs') {
    const pages = this.getAllPages(workspace);
    
    if (newValue === originalValue) {
      if (pages[slug]) {
        delete pages[slug].fields[field];
        if (Object.keys(pages[slug].fields).length === 0) {
          delete pages[slug];
        }
        localStorage.setItem(this.getPageKey(workspace), JSON.stringify(pages));
        this.syncWithPendingChanges(workspace);
      }
      return;
    }

    if (!pages[slug]) {
      pages[slug] = {
        slug,
        fields: {},
        lastEdited: new Date().toISOString(),
      };
    }

    pages[slug].fields[field] = newValue;
    pages[slug].lastEdited = new Date().toISOString();
    
    localStorage.setItem(this.getPageKey(workspace), JSON.stringify(pages));
    this.syncWithPendingChanges(workspace);
  }

  /**
   * For backward compatibility with RichEditor content saving
   */
  savePage(slug: string, content: string, originalContent: string, workspace: string = 'docs') {
    this.saveField(slug, 'content', content, originalContent, workspace);
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
    
    pendingChanges.removeByNamespace(workspace);
    
    Object.keys(pages).forEach(slug => {
      Object.keys(pages[slug].fields).forEach(field => {
        // Register each field as a pending change
        // We use a dummy saveFn here; the actual publish logic uses api.post directly 
        // to walk through everything in the draftStore.
        pendingChanges.registerChange('page', `${workspace}:${slug}:${field}`, async () => {}, workspace);
      });
    });

    if (sidebar) {
      pendingChanges.registerChange('sidebar', `${workspace}:main`, async () => {}, workspace);
    }
  }

  async publishChanges(workspace: string = 'docs') {
    const pages = this.getAllPages(workspace);
    const sidebar = this.getSidebar(workspace);

    // 1. Save all pages and their specific fields
    for (const pageDraft of Object.values(pages)) {
      for (const [field, value] of Object.entries(pageDraft.fields)) {
         await api.post(`/content/save`, {
            slug: pageDraft.slug,
            field: field,
            newValue: value,
            block_id: field === 'content' ? 'content' : field, // Convention
            workspace: workspace
          });
      }
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
