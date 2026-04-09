'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { 
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3, Type as TypeIcon,
  List, ListOrdered, Quote,
  Code, Code2, AlignLeft, AlignCenter, AlignRight,
  Table as TableIcon, Image as ImageIcon, Link as LinkIcon,
  Undo2, Redo2, GripHorizontal, Video, Unlink, Upload,
  ExternalLink, BookOpen, Search
} from 'lucide-react';
import { api } from '@/lib/api';

interface PageEntry {
  label: string;
  slug: string;
  group?: string;
}

interface FloatingToolbarProps {
  editor: Editor | null;
}

function ToolBtn({ onClick, active = false, icon: Icon, label, danger = false }: any) {
  return (
    <div className="relative group/tool">
      <button
        onMouseDown={(e) => { e.preventDefault(); onClick?.(); }}
        className={`w-7 h-7 flex items-center justify-center rounded-[6px] transition-all duration-150
          ${active
            ? 'bg-[var(--accent-primary)] text-white shadow-sm scale-110'
            : 'text-slate-500 hover:bg-white hover:text-slate-800 hover:shadow-sm'}
          ${danger ? 'hover:text-rose-500 hover:bg-rose-50' : ''}
        `}
      >
        <Icon size={14} strokeWidth={active ? 2.5 : 2} />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 bg-slate-800 text-white rounded-[6px] px-2 py-1 whitespace-nowrap text-[11px] font-bold opacity-0 group-hover/tool:opacity-100 pointer-events-none transition-all duration-150 translate-y-1 group-hover/tool:translate-y-0 z-[150] shadow-xl">
        {label}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
      </div>
    </div>
  );
}

function Popup({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white border border-slate-200 rounded-xl p-4 shadow-2xl z-[200]"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

export default function FloatingToolbar({ editor }: FloatingToolbarProps) {
  const [, forceUpdate] = useState(0);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [internalLinkSearch, setInternalLinkSearch] = useState('');
  const [allPages, setAllPages] = useState<PageEntry[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });
  const imageFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Force re-render on editor state changes so active states stay in sync
  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate((n) => n + 1);
    editor.on('selectionUpdate', update);
    editor.on('transaction', update);
    return () => {
      editor.off('selectionUpdate', update);
      editor.off('transaction', update);
    };
  }, [editor]);

  // Initial centering
  useEffect(() => {
    if (toolbarRef.current && typeof window !== 'undefined') {
      toolbarRef.current.style.left = `${window.innerWidth / 2 - 220}px`;
      toolbarRef.current.style.top = `80px`;
    }
  }, []);

  // Pre-fill link input with existing href
  useEffect(() => {
    if (activePopup === 'link' && editor) {
      setLinkUrl(editor.getAttributes('link').href || '');
    }
  }, [activePopup, editor]);

  // Fetch all pages when internal link popup opens
  useEffect(() => {
    if (activePopup !== 'internal-link') return;
    setPagesLoading(true);
    setInternalLinkSearch('');
    api.get<any[]>('/pages')
      .then(pages =>
        setAllPages(
          pages.map(p => ({
            label: p.sidebar_label || p.title || p.slug,
            slug: p.slug,
            group: p.category || 'General',
          }))
        )
      )
      .catch(() => setAllPages([]))
      .finally(() => setPagesLoading(false));
  }, [activePopup]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (toolbarRef.current) {
      const rect = toolbarRef.current.getBoundingClientRect();
      elementStart.current = { x: rect.left, y: rect.top };
    }
    document.body.style.userSelect = 'none';

    const handleMouseMove = (me: MouseEvent) => {
      if (!isDragging.current || !toolbarRef.current) return;
      const nx = elementStart.current.x + (me.clientX - dragStart.current.x);
      const ny = elementStart.current.y + (me.clientY - dragStart.current.y);
      const bx = Math.max(20, Math.min(nx, window.innerWidth - toolbarRef.current.offsetWidth - 20));
      const by = Math.max(20, Math.min(ny, window.innerHeight - toolbarRef.current.offsetHeight - 20));
      toolbarRef.current.style.left = `${bx}px`;
      toolbarRef.current.style.top = `${by}px`;
    };
    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      editor?.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: base64 } }).run();
      setActivePopup(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      editor?.chain().focus().insertContent({ type: 'resizableVideo', attrs: { src: base64 } }).run();
      setActivePopup(null);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const applyLink = () => {
    if (!linkUrl.trim()) {
      editor?.chain().focus().unsetLink().run();
    } else {
      const href = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor?.chain().focus().setLink({ href }).run();
    }
    setActivePopup(null);
    setLinkUrl('');
  };

  const insertImageUrl = () => {
    if (!imageUrl.trim()) return;
    editor?.chain().focus().insertContent({ type: 'resizableImage', attrs: { src: imageUrl } }).run();
    setActivePopup(null);
    setImageUrl('');
  };

  const insertVideoUrl = () => {
    if (!videoUrl.trim()) return;
    editor?.chain().focus().insertContent({ type: 'resizableVideo', attrs: { src: videoUrl } }).run();
    setActivePopup(null);
    setVideoUrl('');
  };

  if (!editor) return null;

  const closePopup = () => setActivePopup(null);
  const togglePopup = (tag: string) => setActivePopup(activePopup === tag ? null : tag);

  return (
    <>
      {/* Hidden file inputs */}
      <input ref={imageFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />
      <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={handleVideoFileChange} />

      <div
        ref={toolbarRef}
        data-floating-toolbar="true"
        style={{ left: typeof window !== 'undefined' ? `${window.innerWidth / 2 - 220}px` : '50%', top: '80px' }}
        className="fixed z-[100] flex flex-col gap-1 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl"
      >
        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          className="cursor-move w-full h-4 flex items-center justify-center hover:bg-slate-100 rounded-full active:cursor-grabbing transition-colors text-slate-300 hover:text-slate-600 mb-0.5"
        >
          <GripHorizontal size={14} />
        </div>

        {/* Row 1 — History / Headings / Text Formatting */}
        <div className="flex items-center gap-1">
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={Undo2} label="Undo" onClick={() => editor.chain().focus().undo().run()} />
            <ToolBtn icon={Redo2} label="Redo" onClick={() => editor.chain().focus().redo().run()} />
          </div>
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={Heading1} label="Heading 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
            <ToolBtn icon={Heading2} label="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolBtn icon={Heading3} label="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
            <ToolBtn icon={TypeIcon} label="Paragraph" active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} />
          </div>
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={Bold} label="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolBtn icon={Italic} label="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolBtn icon={Underline} label="Underline" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
            <ToolBtn icon={Strikethrough} label="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} />
          </div>
        </div>

        {/* Row 2 — Align / Lists / Code / Media */}
        <div className="flex items-center gap-1 flex-wrap">
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={AlignLeft} label="Align Left" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} />
            <ToolBtn icon={AlignCenter} label="Align Center" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} />
            <ToolBtn icon={AlignRight} label="Align Right" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} />
          </div>
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={List} label="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolBtn icon={ListOrdered} label="Numbered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolBtn icon={Quote} label="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          </div>
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100">
            <ToolBtn icon={Code} label="Inline Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()} />
            <ToolBtn icon={Code2} label="Code Block" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()} />
            <ToolBtn icon={TableIcon} label="Insert Table" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} />
          </div>

          {/* Link */}
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100 relative">
            <ToolBtn
              icon={LinkIcon}
              label="Add / Edit Link"
              active={editor.isActive('link') || activePopup === 'link'}
              onClick={() => togglePopup('link')}
            />
            {editor.isActive('link') && (
              <ToolBtn icon={Unlink} label="Remove Link" danger onClick={() => editor.chain().focus().unsetLink().run()} />
            )}
            {activePopup === 'link' && (
              <Popup>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Insert / Edit Link</p>
                <input
                  autoFocus
                  type="text"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') closePopup(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 mb-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <div className="flex gap-2">
                  <button
                    onMouseDown={(e) => { e.preventDefault(); applyLink(); }}
                    className="flex-1 py-2 bg-[var(--accent-primary)] text-[12px] font-bold text-white rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={12} /> Apply Link
                  </button>
                  {editor.isActive('link') && (
                    <button
                      onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().unsetLink().run(); closePopup(); }}
                      className="py-2 px-3 bg-rose-50 text-[12px] font-bold text-rose-500 rounded-lg hover:bg-rose-100 transition-all"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </Popup>
            )}
          </div>

          {/* Image */}
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100 relative">
            <ToolBtn icon={ImageIcon} label="Insert Image" active={activePopup === 'image'} onClick={() => togglePopup('image')} />
            {activePopup === 'image' && (
              <Popup>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Insert Image</p>
                <button
                  onMouseDown={(e) => { e.preventDefault(); imageFileRef.current?.click(); }}
                  disabled={uploading}
                  className="w-full mb-3 py-2.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-[13px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> {uploading ? 'Loading...' : 'Upload from computer'}
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-semibold">or paste URL</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/image.png"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') insertImageUrl(); if (e.key === 'Escape') closePopup(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 mb-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); insertImageUrl(); }}
                  className="w-full py-2 bg-[var(--accent-primary)] text-[12px] font-bold text-white rounded-lg hover:opacity-90 transition-all"
                >
                  Insert from URL
                </button>
              </Popup>
            )}
          </div>

          {/* Video */}
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100 relative">
            <ToolBtn icon={Video} label="Insert Video" active={activePopup === 'video'} onClick={() => togglePopup('video')} />
            {activePopup === 'video' && (
              <Popup>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Insert Video</p>
                <button
                  onMouseDown={(e) => { e.preventDefault(); videoFileRef.current?.click(); }}
                  disabled={uploading}
                  className="w-full mb-3 py-2.5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg text-[13px] font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <Upload size={14} /> {uploading ? 'Loading...' : 'Upload from computer'}
                </button>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[11px] text-slate-400 font-semibold">or paste URL</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <input
                  type="text"
                  placeholder="https://example.com/video.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') insertVideoUrl(); if (e.key === 'Escape') closePopup(); }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[13px] text-slate-700 mb-3 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); insertVideoUrl(); }}
                  className="w-full py-2 bg-[var(--accent-primary)] text-[12px] font-bold text-white rounded-lg hover:opacity-90 transition-all"
                >
                  Insert from URL
                </button>
              </Popup>
            )}
          </div>

          {/* Internal Page Link */}
          <div className="flex bg-slate-50 p-1 rounded-[10px] gap-0.5 border border-slate-100 relative">
            <ToolBtn
              icon={BookOpen}
              label="Link to Another Page"
              active={activePopup === 'internal-link'}
              onClick={() => togglePopup('internal-link')}
            />
            {activePopup === 'internal-link' && (
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-2xl z-[200]"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                  <BookOpen size={11} /> Link to Page
                </p>
                {/* Search input */}
                <div className="relative mb-3">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search pages..."
                    value={internalLinkSearch}
                    onChange={(e) => setInternalLinkSearch(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') closePopup(); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-[13px] text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                {/* Page list */}
                <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5 pr-0.5">
                  {pagesLoading ? (
                    <p className="text-[12px] text-slate-400 text-center py-4">Loading pages...</p>
                  ) : (() => {
                    const query = internalLinkSearch.toLowerCase().trim();
                    const filtered = allPages.filter(p =>
                      !query ||
                      p.label.toLowerCase().includes(query) ||
                      p.slug.toLowerCase().includes(query) ||
                      (p.group || '').toLowerCase().includes(query)
                    );
                    if (filtered.length === 0) {
                      return <p className="text-[12px] text-slate-400 text-center py-4">No pages found</p>;
                    }
                    // Group by category
                    const groups: Record<string, PageEntry[]> = {};
                    filtered.forEach(p => {
                      const g = p.group || 'General';
                      if (!groups[g]) groups[g] = [];
                      groups[g].push(p);
                    });
                    return Object.entries(groups).map(([group, pages]) => (
                      <div key={group}>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 pt-2 pb-1">{group}</p>
                        {pages.map(p => (
                          <button
                            key={p.slug}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              const href = `/${p.slug}`;
                              const { from, to } = editor!.state.selection;
                              const selectedText = editor!.state.doc.textBetween(from, to, ' ').trim();
                              if (selectedText) {
                                editor!.chain().focus().setLink({ href }).run();
                              } else {
                                editor!.chain().focus().insertContent(
                                  `<a href="${href}">${p.label}</a>`
                                ).run();
                              }
                              closePopup();
                            }}
                            className="w-full text-left px-2.5 py-2 rounded-lg text-[13px] text-slate-700 font-medium hover:bg-[var(--accent-primary)] hover:text-white transition-all duration-100 flex items-center gap-2"
                          >
                            <BookOpen size={12} className="shrink-0 opacity-60" />
                            <span className="truncate">{p.label}</span>
                          </button>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
                <p className="text-[10px] text-slate-400 mt-3 text-center">
                  Select text first to wrap it, or click to insert a new link
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
