'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import DocsSidebar from '@/components/DocsSidebar';
import AdminNavbar from '@/components/AdminNavbar';
import { Send, Hash } from 'lucide-react';
import { getColorFromName } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorInitials: string;
  createdAt: string;
}

interface GroupedMessage extends Message {
  isGrouped: boolean;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const myName = typeof window !== 'undefined' ? localStorage.getItem('name') : null;

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get<Message[]>('/chat/messages?limit=100');
      setMessages(res);
    } catch {}
  }, []);

  useEffect(() => {
    if (!localStorage.getItem('token')) { router.push('/login'); return; }
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await api.post('/chat/messages', { text: text.trim() });
      setText('');
      await fetchMessages();
    } catch {}
    finally { setSending(false); }
  };

  const groupedMessages: GroupedMessage[] = messages.reduce((groups: GroupedMessage[], msg, i) => {
    const prev = messages[i - 1];
    const isGrouped = !!(
      prev &&
      prev.authorId === msg.authorId &&
      (new Date(msg.createdAt).getTime() - new Date(prev.createdAt).getTime()) < 300_000
    );
    groups.push({ ...msg, isGrouped });
    return groups;
  }, []);

  return (
    <div className="flex h-screen bg-white font-sans overflow-hidden">
      <AdminNavbar pageTitle="Team Chat" />
      
      <DocsSidebar
        currentSlug=""
        onNavigate={s => router.push(`/docs/${s}`)}
      />

      <div className="flex-1 flex flex-col overflow-hidden ml-[240px] pt-[52px]">
        {/* Chat Header */}
        <div className="h-[52px] border-b border-[var(--border)] px-8 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-[6px] bg-[var(--bg-active)] flex items-center justify-center text-[var(--accent-primary)]">
                <Hash size={18} />
             </div>
             <div>
               <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">team-sync</h2>
               <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">Secure Communication Channel</p>
             </div>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto px-8 py-6 space-y-1 custom-scrollbar">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center pb-20">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4 border border-[var(--border)]">
                <Hash className="text-[var(--text-muted)]" size={32} />
              </div>
              <p className="font-semibold text-[var(--text-primary)]">Welcome to the team chat</p>
              <p className="text-[13px] text-[var(--text-muted)] mt-1">This is the beginning of the chat history.</p>
            </div>
          )}

          {groupedMessages.map(msg => {
            const isMe = msg.authorName === myName;
            
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : ''} ${msg.isGrouped ? 'mt-1' : 'mt-6'}`}
              >
                {!msg.isGrouped && (
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: getColorFromName(msg.authorName) }}
                  >
                    {msg.authorInitials}
                  </div>
                )}
                {msg.isGrouped && <div className="w-8 shrink-0" />}

                <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                  {!msg.isGrouped && (
                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">{msg.authorName}</span>
                      <span className="text-[11px] text-[var(--text-muted)]">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  )}
                  <div
                    className={`px-4 py-2.5 rounded-[12px] text-[14px] leading-relaxed break-words shadow-sm transition-all duration-150
                      ${isMe
                        ? 'bg-[var(--accent-primary)] text-white'
                        : 'bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)]'
                      }`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-[var(--border)] bg-white shrink-0">
          <form onSubmit={sendMessage} className="relative flex items-end gap-3 max-w-[800px] mx-auto">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Type a message..."
              rows={1}
              className="flex-1 border border-[var(--border)] rounded-[8px] px-4 py-3 text-[14px] resize-none focus:outline-none focus:border-[var(--accent-primary)] focus:ring-[var(--focus-ring)] max-h-32 transition-all"
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={sending || !text.trim()}
              className="w-11 h-11 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:bg-[var(--border)] text-white rounded-[8px] flex items-center justify-center transition-all shrink-0 shadow-sm"
            >
              <Send size={18} />
            </button>
          </form>
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
