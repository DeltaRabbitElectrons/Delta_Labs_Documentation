import React from 'react';
import AuthGuard from '../components/AuthGuard';

/**
 * Docusaurus Root — wraps the entire site.
 * This is the official Docusaurus pattern for site-wide component injection.
 * See: https://docusaurus.io/docs/swizzling#wrapper-your-site-with-root
 */
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {children}
    </AuthGuard>
  );
}
