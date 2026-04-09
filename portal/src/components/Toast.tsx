'use client';

import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToasts must be used within a ToastProvider');
  return context;
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
  }, []);

  const typeStyles: Record<ToastType, string> = {
    success: 'border-l-[var(--success)]',
    error: 'border-l-[var(--error)]',
    info: 'border-l-[var(--accent-primary)]',
    warning: 'border-l-[var(--warning)]'
  };

  const Icons: Record<ToastType, any> = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
    warning: AlertCircle
  };

  const Icon = Icons[toast.type];

  return (
    <div 
      className={`
        pointer-events-auto bg-white border border-[var(--border)] rounded-[8px] p-4 pr-12 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-start gap-3 min-w-[320px] transition-all duration-300 transform-origin-right
        ${typeStyles[toast.type]} border-l-[3px]
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-[100%] opacity-0'}
      `}
    >
      <Icon 
        size={18} 
        className={
          toast.type === 'success' ? 'text-[var(--success)]' :
          toast.type === 'error' ? 'text-[var(--error)]' :
          toast.type === 'info' ? 'text-[var(--accent-primary)]' :
          'text-[var(--warning)]'
        } 
      />
      <p className="text-[13px] font-medium text-[var(--text-primary)] leading-relaxed">
        {toast.message}
      </p>
      <button 
        onClick={onDismiss}
        className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all"
      >
        <X size={14} />
      </button>
    </div>
  );
}
