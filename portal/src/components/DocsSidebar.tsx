'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  Trash2, 
  GripVertical,
  Search,
  Zap,
  MoreVertical,
  Check,
  X,
  FolderPlus,
  FilePlus2,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { api } from '@/lib/api';
import { v4 as uuidv4 } from 'uuid';
import { pendingChanges } from '@/lib/pendingChanges';
import { useToasts } from '@/components/Toast';
import { draftStore } from '@/lib/draftStore';

interface SidebarNode {
  id: string;
  type: 'page' | 'category';
  label: string;
  slug?: string;
  children?: SidebarNode[];
  isOpen?: boolean;
}

interface SidebarProps {
  currentSlug: string;
  onNavigate: (slug: string) => void;
  workspaceSlug?: string;
}

export default function DocsSidebar({ 
  currentSlug, 
  onNavigate,
  workspaceSlug = 'docs'
}: SidebarProps) {
  const [tree, setTree] = useState<SidebarNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; slug?: string; label: string; type: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const isResizing = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToasts();
  const pendingNodeIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth));
    }
  }, []);

  useEffect(() => {
    const width = isCollapsed ? 0 : sidebarWidth;
    document.documentElement.style.setProperty('--sidebar-width', `${width}px`);
  }, [isCollapsed, sidebarWidth]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const startResizing = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(200, e.clientX), 600);
    if (sidebarRef.current) {
      sidebarRef.current.style.width = `${newWidth}px`;
    }
    document.documentElement.style.setProperty('--sidebar-width', `${newWidth}px`);
  };

  const stopResizing = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    const finalWidth = sidebarRef.current ? parseInt(sidebarRef.current.style.width) : 280;
    setSidebarWidth(finalWidth);
    localStorage.setItem('sidebarWidth', finalWidth.toString());
  };

  const loadData = async () => {
    try {
      const res = await api.get(`/sidebar?workspace=${workspaceSlug}`);
      const dbTree = (res as any).tree || [];
      
      const draft = draftStore.getSidebar(workspaceSlug);
      
      // 1. Initial tree from source (draft or DB)
      let sourceTree = draft ? draft.tree : dbTree;

      // 2. NORMALIZE: Helper to strip prefixes and slashes for stable matching
      const normalize = (s: string | undefined | null) => 
        (s || '').split('/').map(p => p.replace(/^\d+-/, '')).join('/').replace(/^\/+|\/+$/g, '');

      const normalizedCurrent = normalize(currentSlug);

      // 3. SELF-HEALING: Strip legacy prefixes and normalize tree slugs
      const healTree = (nodes: SidebarNode[]): SidebarNode[] => 
        nodes.map(n => ({
          ...n,
          slug: n.slug ? normalize(n.slug) : n.slug,
          children: n.children ? healTree(n.children) : undefined
        }));

      const healedTree = healTree(sourceTree);

      // 4. AUTO-EXPAND: Find and open all parent folders of the currentSlug
      const expandActiveParents = (nodes: SidebarNode[]): { tree: SidebarNode[], found: boolean } => {
        let treeFound = false;
        const newNodes = nodes.map(n => {
          const nodeNormalized = normalize(n.slug);
          let nodeFound = nodeNormalized === normalizedCurrent && n.type === 'page';
          let childrenResult = { tree: [] as SidebarNode[], found: false };
          
          if (n.children && n.children.length > 0) {
            childrenResult = expandActiveParents(n.children);
            if (childrenResult.found) nodeFound = true;
          }
          
          if (nodeFound) treeFound = true;
          
          return {
            ...n,
            isOpen: nodeFound ? true : (n.isOpen ?? false),
            children: n.children ? childrenResult.tree : []
          };
        });
        return { tree: newNodes, found: treeFound };
      };

      const finalTree = expandActiveParents(healedTree).tree;
      setTree(finalTree);
      
      // If we healed it, save it back to clear the draft pollution
      if (draft) {
         draftStore.saveSidebar(healedTree, workspaceSlug);
      }
    } catch (err) {
      console.error('Failed to load sidebar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceSlug]);

  const saveSidebar = (newTree: SidebarNode[]) => {
    draftStore.saveSidebar(newTree, workspaceSlug);
  };

  const handleAddNode = (parentId: string | null, type: 'page' | 'category') => {
    const newNode: SidebarNode = {
      id: uuidv4(),
      type,
      label: type === 'page' ? 'New Page' : 'New Category',
      slug: undefined,
      children: type === 'category' ? [] : undefined,
      isOpen: true
    };

    const addToTree = (nodes: SidebarNode[]): SidebarNode[] => {
      if (parentId === null) return [...nodes, newNode];
      return nodes.map(node => {
        if (node.id === parentId) {
          return { ...node, children: [...(node.children || []), newNode], isOpen: true };
        }
        if (node.children) {
          return { ...node, children: addToTree(node.children) };
        }
        return node;
      });
    };

    const updatedTree = addToTree(tree);
    setTree(updatedTree);
    saveSidebar(updatedTree); // Persist immediately
    // Mark as pending — backend creation deferred until name is confirmed
    pendingNodeIds.current.add(newNode.id);
    setEditingId(newNode.id);
    setEditValue('');
  };

  const requestDeleteNode = (id: string, slug: string | undefined, label: string, type: string) => {
    setDeleteTarget({ id, slug, label, type });
  };

  const confirmDeleteNode = async () => {
    if (!deleteTarget) return;
    const { id, slug } = deleteTarget;
    setDeleteLoading(true);

    const removeFromTree = (nodes: SidebarNode[]): SidebarNode[] =>
      nodes
        .filter(n => n.id !== id)
        .map(n => ({ ...n, children: n.children ? removeFromTree(n.children) : [] }));

    const updatedTree = removeFromTree(tree);
    setTree(updatedTree);

    if (slug) {
      try {
        await api.delete(`/sidebar/page/${slug}?workspace=${workspaceSlug}`);
      } catch (err) {
        console.error('Failed to delete page file:', err);
      }
    }

    saveSidebar(updatedTree);
    setDeleteLoading(false);
    setDeleteTarget(null);
  };

  const handleRename = async (id: string) => {
    const trimmedValue = editValue.trim();
    const isPending = pendingNodeIds.current.has(id);

    // If new node with no name entered — remove it
    if (isPending && !trimmedValue) {
      const removeFromTree = (nodes: SidebarNode[]): SidebarNode[] =>
        nodes.filter(n => n.id !== id).map(n => ({
          ...n,
          children: n.children ? removeFromTree(n.children) : []
        }));
      setTree(removeFromTree(tree));
      pendingNodeIds.current.delete(id);
      setEditingId(null);
      return;
    }

    const label = trimmedValue || editValue;

    // Only derive slug from label if it's a completely NEW page (pending).
    // If it's an existing page, we only change the label, not the underlying file slug.
    const findNode = (nodes: SidebarNode[]): SidebarNode | null => {
      for (const n of nodes) {
        if (n.id === id) return n;
        if (n.children) { const found = findNode(n.children); if (found) return found; }
      }
      return null;
    };

    // Walk up the tree to build the full parent path for unique slugs
    const findParentPath = (nodes: SidebarNode[], targetId: string, path: string[] = []): string[] | null => {
      for (const n of nodes) {
        if (n.id === targetId) return path;
        if (n.children) {
          const categorySlug = n.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
          const result = findParentPath(n.children, targetId, [...path, categorySlug]);
          if (result) return result;
        }
      }
      return null;
    };

    const node = findNode(tree);
    const shouldDeriveSlug = isPending && node?.type === 'page';
    let derivedSlug: string | undefined;
    if (shouldDeriveSlug) {
      const pageName = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const parentPath = findParentPath(tree, id) || [];
      derivedSlug = parentPath.length > 0
        ? `${parentPath.join('/')}/${pageName}`
        : pageName;
    }

    const updateLabel = (nodes: SidebarNode[]): SidebarNode[] =>
      nodes.map(n => {
        if (n.id === id) return { ...n, label, ...(derivedSlug ? { slug: derivedSlug } : {}) };
        if (n.children) return { ...n, children: updateLabel(n.children) };
        return n;
      });

    const updatedTree = updateLabel(tree);
    setTree(updatedTree);

    if (isPending) {
      pendingNodeIds.current.delete(id);
      // Now create page file in backend with confirmed name/slug
      if (node?.type === 'page' && derivedSlug) {
        try {
          await api.post(`/sidebar/page?workspace=${workspaceSlug}`, { slug: derivedSlug, label });
        } catch (err: any) {
          console.error('Failed to create page:', err);
          const detail = err?.response?.data?.detail || err?.message || '';
          if (detail.includes('already exists')) {
            addToast('error', `A page named "${label}" already exists in this folder. Try a different name or move it to another folder.`);
          } else {
            addToast('error', 'Failed to create page. Please try again.');
          }
          // Remove the failed node from the tree
          const removeFromTree = (nodes: SidebarNode[]): SidebarNode[] =>
            nodes.filter(n => n.id !== id).map(n => ({
              ...n, children: n.children ? removeFromTree(n.children) : []
            }));
          setTree(removeFromTree(tree));
          return;
        }
      }
    }

    saveSidebar(updatedTree);
    setEditingId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const findParentAndSwap = (nodes: SidebarNode[]): SidebarNode[] => {
      const activeIdx = nodes.findIndex(n => n.id === active.id);
      const overIdx = nodes.findIndex(n => n.id === over.id);

      if (activeIdx !== -1 && overIdx !== -1) {
        return arrayMove(nodes, activeIdx, overIdx);
      }

      return nodes.map(n => {
        if (n.children) {
          return { ...n, children: findParentAndSwap(n.children) };
        }
        return n;
      });
    };

    const updatedTree = findParentAndSwap(tree);
    setTree(updatedTree);
    saveSidebar(updatedTree);
  };

  // Advanced recursive search logic
  const getFilteredTree = (nodes: SidebarNode[], query: string): SidebarNode[] => {
    if (!query) return nodes;
    
    return nodes.map(node => {
      const matchSelf = node.label.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = node.children ? getFilteredTree(node.children, query) : undefined;
      const hasChildrenMatches = filteredChildren && filteredChildren.length > 0;
      
      if (matchSelf || hasChildrenMatches) {
        return {
          ...node,
          children: filteredChildren,
          isOpen: query ? true : node.isOpen // Force open if searching
        };
      }
      return null;
    }).filter(Boolean) as SidebarNode[];
  };

  const filteredTree = getFilteredTree(tree, searchQuery);

  /**
   * Recursively toggles the `isOpen` flag of any node in the tree by its ID.
   * This single handler is passed to all SortableSidebarNode instances so that
   * folders at ANY nesting depth can be collapsed/expanded.
   */
  const handleToggleNode = (toggleId: string) => {
    const updateToggle = (nodes: SidebarNode[]): SidebarNode[] => {
      return nodes.map(n => {
        if (n.id === toggleId) return { ...n, isOpen: !n.isOpen };
        if (n.children) return { ...n, children: updateToggle(n.children) };
        return n;
      });
    };
    const updatedTree = updateToggle(tree);
    setTree(updatedTree);
    saveSidebar(updatedTree);
  };

  if (loading) return (
    <div 
      className="fixed left-0 top-[52px] bottom-0 bg-[var(--sidebar-bg)] border-r border-[var(--border)] flex flex-col items-center justify-center p-8 z-[50]"
      style={{ width: `${sidebarWidth}px` }}
    >
      <div className="relative flex items-center justify-center mb-4">
        <div className="absolute w-12 h-12 border-2 border-[var(--accent-primary)]/10 rounded-full" />
        <div className="absolute w-12 h-12 border-t-2 border-[var(--accent-primary)] rounded-full animate-spin" />
        <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain relative z-10 animate-pulse" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent-primary)]/40 animate-pulse text-center leading-relaxed">
        Syncing<br/>Repository
      </p>
    </div>
  );

  return (
    <>
    {/* Delete Confirmation Modal */}
    {deleteTarget && (
      <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[400px] p-7 animate-slide-up">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
              <Trash2 size={24} className="text-red-500" />
            </div>
            <h2 className="text-[18px] font-bold text-slate-800 mb-1.5">Delete {deleteTarget.type === 'category' ? 'Group' : 'Page'}?</h2>
            <p className="text-[14px] text-slate-500 mb-6 leading-relaxed">
              <span className="font-semibold text-slate-700">&ldquo;{deleteTarget.label}&rdquo;</span> will be permanently removed{deleteTarget.type === 'category' ? ' along with all its pages' : ''}. This cannot be undone.
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[14px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteNode}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-[14px] font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={15} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    {isCollapsed && (
      <button
        onClick={() => setIsCollapsed(false)}
        className="fixed left-6 top-[72px] z-[100] w-10 h-10 bg-white border border-slate-200 rounded-xl shadow-xl flex items-center justify-center text-[var(--accent-primary)] hover:bg-[var(--accent-light)] transition-all duration-300 group animate-in slide-in-from-left-4 fade-in"
        title="Show Sidebar"
      >
        <PanelLeftOpen size={20} className="group-hover:scale-110 transition-transform" />
      </button>
    )}
    <div 
      ref={sidebarRef}
      className={`fixed left-0 top-[52px] bottom-0 bg-white border-r border-[var(--border)] flex flex-col z-[50] shadow-sm group/sidebar transition-all duration-300 ease-in-out
        ${isCollapsed ? '-translate-x-full opacity-0' : 'translate-x-0 opacity-100'}
      `}
      style={{ width: isCollapsed ? '0px' : `${sidebarWidth}px` }}
    >
      
      {/* Brand & Global Controls */}
      <div className="px-4 pt-6 pb-4">
         <div className="flex items-center justify-between mb-5">
            <div className="flex flex-col">
               <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)] flex items-center gap-2 mb-1">
                  Explorer <Zap size={10} className="text-[var(--accent-primary)] animate-pulse" />
               </h3>
               <span className="text-[11px] font-bold text-slate-400">Manage Workspace</span>
            </div>
            <div className="flex items-center gap-1.5">
               <button 
                 onClick={() => handleAddNode(null, 'category')}
                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-light)] transition-all duration-300 shadow-sm"
                 title="New Category"
               >
                 <FolderPlus size={16} />
               </button>
               <button 
                 onClick={() => handleAddNode(null, 'page')}
                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-light)] transition-all duration-300 shadow-sm"
                 title="New Page"
               >
                 <FilePlus2 size={16} />
               </button>
               <div className="w-px h-4 bg-slate-200/50 mx-1" />
               <button 
                 onClick={() => setIsCollapsed(true)}
                 className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-500/30 hover:bg-amber-50 transition-all duration-300 shadow-sm"
                 title="Collapse Sidebar"
               >
                 <PanelLeftClose size={16} />
               </button>
            </div>
         </div>

         {/* Premium Search Bar */}
         <div className="relative group">
            <div className={`
              absolute inset-0 bg-slate-50 rounded-lg transition-all duration-300
              group-focus-within:bg-white group-focus-within:ring-2 group-focus-within:ring-[var(--focus-ring)] group-focus-within:border-[var(--accent-primary)]/20 border border-transparent
            `} />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--accent-primary)] transition-all z-10" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="relative w-full bg-transparent pl-9 pr-4 py-1.5 text-[12px] font-medium text-slate-700 placeholder-slate-400 outline-none z-10"
            />
            {searchQuery && (
               <button 
                 onClick={() => setSearchQuery('')}
                 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 z-10"
               >
                 <X size={14} />
               </button>
            )}
         </div>
      </div>

      <div className="flex-1 overflow-y-auto px-1.5 py-2 custom-scrollbar">
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter} 
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={filteredTree.map(n => n.id)} strategy={verticalListSortingStrategy}>
             <div className="flex flex-col gap-0.5">
               {filteredTree.map((node) => (
                 <SortableSidebarNode 
                   key={node.id} 
                   node={node} 
                   currentSlug={currentSlug}
                   onNavigate={onNavigate}
                   onToggleNode={handleToggleNode}
                   onAdd={(id, type) => handleAddNode(id, type)}
                    onDelete={(id, slug) => {
                      const found = (function findNode(nodes: SidebarNode[]): SidebarNode | null {
                        for (const n of nodes) {
                          if (n.id === id) return n;
                          if (n.children) { const r = findNode(n.children); if (r) return r; }
                        }
                        return null;
                      })(tree);
                      requestDeleteNode(id, slug, found?.label || 'this item', found?.type || 'page');
                    }}
                   onStartEdit={(id, label) => { setEditingId(id); setEditValue(label); }}
                   editingId={editingId}
                   editValue={editValue}
                   setEditValue={setEditValue}
                   onCancelEdit={() => {
                     if (editingId && pendingNodeIds.current.has(editingId)) {
                       const removeFromTree = (nodes: SidebarNode[]): SidebarNode[] =>
                         nodes.filter(n => n.id !== editingId).map(n => ({
                           ...n, children: n.children ? removeFromTree(n.children) : []
                         }));
                       setTree(removeFromTree(tree));
                       pendingNodeIds.current.delete(editingId);
                     }
                     setEditingId(null);
                   }}
                   onSaveEdit={(id) => handleRename(id)}
                   isRoot={true}
                 />
               ))}
               {searchQuery && filteredTree.length === 0 && (
                  <div className="px-6 py-10 flex flex-col items-center justify-center opacity-40">
                     <Search size={32} className="mb-3 text-slate-300" />
                     <p className="text-[11px] font-bold text-slate-400 text-center">No assets found matching<br/>&quot;{searchQuery}&quot;</p>
                  </div>
               )}
             </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Resize Handle */}
      <div 
        onMouseDown={startResizing}
        className="absolute top-0 right-0 w-[4px] h-full cursor-col-resize hover:bg-[var(--accent-primary)]/20 active:bg-[var(--accent-primary)] transition-all duration-300 group-hover/sidebar:opacity-100 opacity-0 z-[100]"
      />

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes nodeEnter {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-node-enter {
          animation: nodeEnter 200ms ease-out forwards;
        }
      `}</style>
    </div>
    </>
  );
}

interface SortableSidebarNodeProps {
  node: SidebarNode;
  currentSlug: string;
  onNavigate: (slug: string) => void;
  onToggleNode: (id: string) => void;
  onAdd: (id: string, type: 'page' | 'category') => void;
  onDelete: (id: string, slug?: string) => void;
  onStartEdit: (id: string, label: string) => void;
  editingId: string | null;
  editValue: string;
  setEditValue: (v: string) => void;
  onCancelEdit: () => void;
  onSaveEdit: (id: string) => void;
  level?: number;
  isRoot?: boolean;
}

function SortableSidebarNode({ 
  node, 
  currentSlug, 
  onNavigate, 
  onToggleNode, 
  onAdd, 
  onDelete,
  onStartEdit,
  editingId,
  editValue,
  setEditValue,
  onCancelEdit,
  onSaveEdit,
  level = 0,
  isRoot = false
}: SortableSidebarNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: node.id });

  const normalize = (s: string | undefined | null) => 
    (s || '').split('/').map(p => p.replace(/^\d+-/, '')).join('/').replace(/^\/+|\/+$/g, '');

  const isActive = node.type === 'page' && normalize(node.slug) === normalize(currentSlug);
  const isEditing = editingId === node.id;
  const activeRef = useRef<HTMLDivElement>(null);

  // Scroll active item into view on mount or slug change
  useEffect(() => {
    if (isActive && activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [isActive]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    paddingLeft: '4px' 
  };

  return (
    <div ref={setNodeRef} style={style} className="select-none animate-node-enter">
      <div 
        ref={isActive ? activeRef : null}
        className={`
          group/item flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all duration-200 relative
          ${isActive ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-sm ring-1 ring-[var(--accent-primary)]/20' : 'hover:bg-slate-50 text-slate-500 hover:text-slate-900'}
        `}
        onClick={() => node.type === 'page' ? onNavigate(node.slug!) : onToggleNode(node.id)}
      >
        {/* Active Indicator - prominent bar */}
        {isActive && <div className="absolute left-[-2px] top-1/2 -translate-y-1/2 w-1 h-5 bg-[var(--accent-primary)] rounded-r-full shadow-[0_0_8px_var(--accent-primary)]" />}

        <div {...listeners} {...attributes} className="opacity-0 group-hover/item:opacity-20 cursor-grab active:cursor-grabbing p-1 -ml-1 hover:opacity-100 transition-opacity shrink-0">
          <GripVertical size={12} />
        </div>

        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {node.type === 'category' ? (
            <div className="flex items-center gap-1.5 min-w-0 shrink-0">
               <div className={`transition-transform duration-300 ${node.isOpen ? 'rotate-90' : 'rotate-0'}`}>
                  <ChevronRight size={14} className="opacity-40" />
               </div>
               <Folder size={16} className={`shrink-0 transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-slate-400 group-hover/item:text-slate-600'}`} />
            </div>
          ) : (
            <FileText size={16} className={`shrink-0 transition-colors ${isActive ? 'text-[var(--accent-primary)]' : 'text-slate-400 group-hover/item:text-slate-600'}`} />
          )}

          {isEditing ? (
            <div className="flex items-center gap-1.5 flex-1 bg-white p-1 rounded-lg border border-[var(--accent-primary)]/30 ring-4 ring-[var(--accent-primary)]/10 shadow-lg z-[60]" onClick={e => e.stopPropagation()}>
               <input 
                 autoFocus
                 className="w-full text-[13px] font-bold outline-none bg-transparent px-1"
                 value={editValue}
                 onChange={e => setEditValue(e.target.value)}
                 onKeyDown={e => {
                   if (e.key === 'Enter') onSaveEdit(node.id);
                   if (e.key === 'Escape') onCancelEdit();
                 }}
               />
               <div className="flex items-center gap-1 pr-1 shrink-0">
                  <button onClick={() => onSaveEdit(node.id)} className="w-5 h-5 flex items-center justify-center bg-emerald-500 text-white rounded-md hover:bg-emerald-600 transition-colors"><Check size={12} /></button>
                  <button onClick={onCancelEdit} className="w-5 h-5 flex items-center justify-center bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"><X size={12} /></button>
               </div>
            </div>
          ) : (
            <span className={`text-[12.5px] font-medium truncate transition-all ${isActive ? 'text-[var(--accent-primary)]' : 'group-hover/item:translate-x-0.5'}`}>
               {node.label}
            </span>
          )}
        </div>

        {/* Dynamic Action Menu */}
        {!isEditing && (
          <div className="opacity-0 group-hover/item:opacity-100 flex items-center gap-1 transition-all duration-300 scale-95 group-hover/item:scale-100 shrink-0" onClick={e => e.stopPropagation()}>
             {node.type === 'category' && (
               <>
                 <button 
                  onClick={() => onAdd(node.id, 'page')} 
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-100 rounded-lg shadow-sm text-slate-400 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/20 transition-all"
                  title="Add Page"
                 >
                   <Plus size={14} />
                 </button>
                 <button 
                  onClick={() => onAdd(node.id, 'category')} 
                  className="w-7 h-7 flex items-center justify-center bg-white border border-slate-100 rounded-lg shadow-sm text-slate-400 hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]/20 transition-all"
                  title="Add Group"
                 >
                   <FolderPlus size={14} />
                 </button>
               </>
             )}
             <button 
              onClick={() => onStartEdit(node.id, node.label)} 
              className="w-7 h-7 flex items-center justify-center bg-white border border-slate-100 rounded-lg shadow-sm text-slate-400 hover:text-blue-500 hover:border-blue-100 transition-all"
              title="Rename"
             >
               <MoreVertical size={14} />
             </button>
             <button 
              onClick={() => onDelete(node.id, node.slug)} 
              className="w-7 h-7 flex items-center justify-center bg-white border border-slate-100 rounded-lg shadow-sm text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all"
              title="Delete"
             >
               <Trash2 size={14} />
             </button>
          </div>
        )}
      </div>

      {/* Progressive Children Rendering */}
      {node.type === 'category' && node.isOpen && node.children && (
        <div className={`overflow-hidden transition-all duration-300 ${node.isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <SortableContext items={node.children.map(c => c.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-0.5 mt-0.5 border-l border-slate-100 ml-3 pl-1">
               {node.children.map(child => (
                 <SortableSidebarNode 
                   key={child.id} 
                   node={child} 
                   currentSlug={currentSlug}
                   onNavigate={onNavigate}
                   onToggleNode={onToggleNode}
                   onAdd={onAdd}
                   onDelete={onDelete}
                   onStartEdit={onStartEdit}
                   editingId={editingId}
                   editValue={editValue}
                   setEditValue={setEditValue}
                   onCancelEdit={onCancelEdit}
                   onSaveEdit={onSaveEdit}
                   level={level + 1}
                 />
               ))}
            </div>
          </SortableContext>
        </div>
      )}
    </div>
  );
}
