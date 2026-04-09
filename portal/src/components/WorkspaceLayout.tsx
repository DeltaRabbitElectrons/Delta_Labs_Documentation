'use client';

import React from 'react';
import AdminNavbar from './AdminNavbar';

interface WorkspaceLayoutProps {
  pageTitle?: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared visual shell for workspace pages.
 * Renders the AdminNavbar, a sidebar slot, and primary content area.
 * Used by both the existing /docs route and new /workspace/[slug] routes.
 * Does NOT contain any docs-specific data logic.
 */
export default function WorkspaceLayout({
  pageTitle,
  sidebar,
  children,
}: WorkspaceLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-[var(--text-primary)] selection:bg-[#eff6ff]">
      <AdminNavbar pageTitle={pageTitle} />

      {sidebar}

      <main className="pl-[var(--sidebar-width,280px)] pt-[52px] min-h-screen flex flex-col items-center">
        {children}
      </main>
    </div>
  );
}
