'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DocsSidebar from '@/components/DocsSidebar';
import AdminNavbar from '@/components/AdminNavbar';
import { Plus, Trash2, Edit2, FileText } from 'lucide-react';

interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

export default function NotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem('portal_token')) { router.push('/login'); return; }
    loadNotes();
  }, [router]);

  const loadNotes = async () => {
    try {
      const res = await api.get<Note[]>('/notes/?workspace_id=default');
      setNotes(res);
    } catch {}
  };

  const selectNote = (note: Note) => {
    setSelectedNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setSaved(false);
    setSaving(false);
  };

  const newNote = async () => {
    try {
      const res: any = await api.post('/notes/', {
        workspace_id: 'default',
        title: 'Untitled Note',
        content: '',
      });
      const note: Note = {
        id: res.id,
        title: 'Untitled Note',
        content: '',
        updatedAt: new Date().toISOString(),
      };
      setNotes(prev => [note, ...prev]);
      selectNote(note);
    } catch {
      console.error('Failed to create note');
    }
  };

  const autoSave = useCallback(async (noteId: string, title: string, content: string) => {
    setSaving(true);
    setSaved(false);
    try {
      await api.post(`/notes/${noteId}`, {   // PATCH handled by POST in this backend
        workspace_id: 'default',
        title: title || 'Untitled',
        content,
      });
      setNotes(prev => prev.map(n =>
        n.id === noteId
          ? { ...n, title: title || 'Untitled', content, updatedAt: new Date().toISOString() }
          : n
      ));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    finally { setSaving(false); }
  }, []);

  const handleChange = (field: 'title' | 'content', value: string) => {
    if (!selectedNote) return;
    if (field === 'title') setEditTitle(value);
    else setEditContent(value);

    setSaved(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const title = field === 'title' ? value : editTitle;
      const content = field === 'content' ? value : editContent;
      autoSave(selectedNote.id, title, content);
    }, 800);
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;
    try {
      await api.delete(`/notes/${noteId}`);
      setNotes(prev => prev.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) setSelectedNote(null);
    } catch {
      console.error('Failed to delete note');
    }
  };

  const wordCount = editContent.split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <AdminNavbar pageTitle="Private Notes" />
      
      <DocsSidebar
        currentSlug=""
        onNavigate={s => router.push(`/docs/${s}`)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden ml-[240px] pt-[52px]">
        {/* Notes List Panel */}
        <div className="w-[300px] border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col shrink-0">
          <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-white shrink-0">
            <div>
              <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">My Notes</h2>
              <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">{notes.length} Active Pages</p>
            </div>
            <button
              onClick={newNote}
              className="w-8 h-8 rounded-[6px] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center transition-all shadow-sm"
              title="New Note"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-3 custom-scrollbar">
            {notes.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center opacity-50 px-6">
                <FileText size={32} className="text-[var(--text-muted)] mb-3" />
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">No notes active</p>
                <p className="text-[12px] text-[var(--text-muted)] mt-1">Create a note to start writing ideas.</p>
              </div>
            )}

            {notes.map(note => (
              <div
                key={note.id}
                onClick={() => selectNote(note)}
                className={`group relative px-4 py-4 rounded-[12px] cursor-pointer mb-2 transition-all duration-150 border
                  ${selectedNote?.id === note.id 
                    ? 'bg-white border-[var(--accent-light)] shadow-sm' 
                    : 'bg-transparent border-transparent hover:bg-[var(--bg-hover)]'
                  }`}
              >
                <p className={`text-[13px] font-semibold truncate ${selectedNote?.id === note.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                  {note.title || 'Sans Nom'}
                </p>
                <p className="text-[12px] text-[var(--text-muted)] mt-0.5 truncate leading-relaxed">
                  {note.content.substring(0, 80) || 'No core telemetry data...'}
                </p>
                <button
                  onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--error)] transition-all bg-white border border-[var(--border)] rounded-[4px] shadow-sm"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white">
          {selectedNote ? (
            <>
              {/* Note Header / Title */}
              <div className="px-12 py-6 flex items-center justify-between border-b border-[var(--border)] bg-white shrink-0">
                <div className="flex-1 flex items-center gap-4">
                  <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-active)] flex items-center justify-center text-[var(--accent-primary)]">
                    <Edit2 size={16} />
                  </div>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="Document Title"
                    className="text-[20px] font-semibold text-[var(--text-primary)] bg-transparent outline-none flex-1 placeholder-[var(--text-muted)]"
                  />
                </div>
                
                {/* Sync Indicator */}
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full transition-all duration-300 shadow-[0_0_8px]
                     ${saving ? 'bg-[var(--accent-primary)] animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.4)]' : saved ? 'bg-[var(--success)] shadow-[0_0_8px_rgba(22,163,74,0.4)]' : 'bg-[var(--text-muted)]'}
                   `} />
                   <span className="text-[12px] font-medium text-[var(--text-muted)] w-20">
                     {saving ? 'Syncing...' : saved ? 'Cloud Saved' : 'Local Draft'}
                   </span>
                </div>
              </div>

              {/* Note Editor Area */}
              <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                <textarea
                  value={editContent}
                  onChange={e => handleChange('content', e.target.value)}
                  placeholder="The transmission starts here..."
                  className="flex-1 px-12 py-10 text-[14px] text-[var(--text-primary)] leading-[1.8] resize-none outline-none font-sans"
                />
                
                {/* Status Bar */}
                <div className="px-12 py-4 border-t border-[var(--border)] flex items-center justify-end">
                   <span className="text-[12px] text-[var(--text-muted)] font-medium bg-[var(--bg-secondary)] px-2 py-1 rounded-[4px] border border-[var(--border)]">
                      {wordCount} Words · UTF-8
                   </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-fade-in">
              <div className="w-20 h-20 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[24px] flex items-center justify-center mb-8 shadow-sm">
                 <FileText size={40} className="text-[var(--text-muted)]" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">Access Secure Archives</h3>
              <p className="text-[14px] text-[var(--text-muted)] max-w-[320px] leading-relaxed mb-8">
                Select a document from the lateral directory or initialize a new record to begin synchronization.
              </p>
              <button
                onClick={newNote}
                className="h-11 px-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white text-[13px] font-semibold rounded-[8px] transition-all shadow-md shadow-blue-100 flex items-center gap-2"
              >
                <Plus size={16} strokeWidth={3} />
                Initialize New Record
              </button>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
      `}</style>
    </div>
  );
}
