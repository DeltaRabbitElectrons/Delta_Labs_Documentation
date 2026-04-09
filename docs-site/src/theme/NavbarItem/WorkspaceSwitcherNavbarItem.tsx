import React, { useEffect, useState, useRef } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { useLocation, useHistory } from '@docusaurus/router';
import clsx from 'clsx';

/**
 * 🛰️ WorkspaceSwitcher
 * A dynamic navbar item that allows users to jump between different documentation workspaces.
 * Fetches the list of active workspaces directly from the backend.
 */
export default function WorkspaceSwitcher() {
  const { siteConfig } = useDocusaurusContext();
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const apiUrl = siteConfig.customFields?.apiUrl as string;
  const location = useLocation();
  const history = useHistory();

  useEffect(() => {
    // Fetch available workspaces from the API
    fetch(`${apiUrl}/workspaces`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setWorkspaces(data);
        }
      })
      .catch(err => console.error('Failed to fetch workspaces:', err));
  }, [apiUrl]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine which workspace we are currently viewing based on the URL
  const currentPath = location.pathname;
  const currentSlug = currentPath.startsWith('/workspace/') 
    ? currentPath.split('/')[2] 
    : 'docs';

  const currentWorkspace = workspaces.find(ws => ws.slug === currentSlug) || { name: 'Main Docs (IT)', slug: 'docs' };

  const handleSelect = (slug: string) => {
    setIsOpen(false);
    if (slug === 'docs') {
      history.push('/');
    } else {
      history.push(`/workspace/${slug}`);
    }
  };

  // Only show if we have custom workspaces to switch to
  if (workspaces.length <= 1) return null;

  return (
    <div className="workspace-switcher-container" ref={dropdownRef} style={{ position: 'relative', marginLeft: '16px', display: 'flex', alignItems: 'center' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(var(--ifm-color-primary-rgb), 0.08)',
          border: '1px solid rgba(var(--ifm-color-primary-rgb), 0.2)',
          borderRadius: '8px',
          padding: '6px 14px',
          cursor: 'pointer',
          color: 'var(--ifm-color-primary)',
          fontSize: '13px',
          fontWeight: '700',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen ? '0 0 0 3px rgba(var(--ifm-color-primary-rgb), 0.15)' : 'none',
          backdropFilter: 'blur(10px)',
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(var(--ifm-color-primary-rgb), 0.12)';
          e.currentTarget.style.borderColor = 'rgba(var(--ifm-color-primary-rgb), 0.3)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.background = 'rgba(var(--ifm-color-primary-rgb), 0.08)';
            e.currentTarget.style.borderColor = 'rgba(var(--ifm-color-primary-rgb), 0.2)';
          }
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        
        <span>{currentWorkspace.name}</span>
        
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ 
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          opacity: 0.7
        }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: '0',
          minWidth: '220px',
          background: 'var(--ifm-background-surface-color)',
          border: '1px solid var(--ifm-color-emphasis-200)',
          borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.12)',
          padding: '8px',
          zIndex: 100,
          animation: 'switcherFadeIn 0.2s ease-out',
          backdropFilter: 'blur(20px)',
        }}>
          <div style={{ padding: '8px 12px', fontSize: '11px', fontWeight: '800', color: 'var(--ifm-color-emphasis-500)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Choose Workspace
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {/* Primary Option */}
            <button
              onClick={() => handleSelect('docs')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 12px',
                background: currentSlug === 'docs' ? 'rgba(var(--ifm-color-primary-rgb), 0.08)' : 'transparent',
                color: currentSlug === 'docs' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                border: 'none',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: currentSlug === 'docs' ? '700' : '500',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = currentSlug === 'docs' ? 'rgba(var(--ifm-color-primary-rgb), 0.12)' : 'var(--ifm-color-emphasis-100)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = currentSlug === 'docs' ? 'rgba(var(--ifm-color-primary-rgb), 0.08)' : 'transparent';
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: currentSlug === 'docs' ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-400)' }} />
              Main Docs (IT)
            </button>

            {/* Custom Workspaces */}
            {workspaces
              .filter(ws => ws.slug !== 'docs')
              .map(ws => (
                <button
                  key={ws.id}
                  onClick={() => handleSelect(ws.slug)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '10px 12px',
                    background: currentSlug === ws.slug ? 'rgba(var(--ifm-color-primary-rgb), 0.08)' : 'transparent',
                    color: currentSlug === ws.slug ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-700)',
                    border: 'none',
                    borderRadius: '8px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: currentSlug === ws.slug ? '700' : '500',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = currentSlug === ws.slug ? 'rgba(var(--ifm-color-primary-rgb), 0.12)' : 'var(--ifm-color-emphasis-100)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = currentSlug === ws.slug ? 'rgba(var(--ifm-color-primary-rgb), 0.08)' : 'transparent';
                  }}
                >
                  <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: currentSlug === ws.slug ? 'var(--ifm-color-primary)' : 'var(--ifm-color-emphasis-400)' }} />
                  {ws.name}
                </button>
              ))
            }
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes switcherFadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
