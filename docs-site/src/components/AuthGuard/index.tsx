import React, { useEffect, useState } from 'react';
import LoginPage from '../LoginPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Decode the JWT payload and check whether the token is still valid
 * (i.e. not expired). Returns false for any malformed token.
 */
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Base64url → Base64 → JSON
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'))
    );

    // `exp` is in seconds; compare against current epoch ms
    if (!payload.exp) return false;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export default function AuthGuard({ children }: AuthGuardProps) {
  /**
   * null  → still checking localStorage (prevents flash of login page)
   * false → no valid token, show login
   * true  → valid token, show docs
   */
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('delta_token');
    setAuthenticated(isTokenValid(token));
  }, []);

  // Avoid any flash before the localStorage check resolves
  if (authenticated === null) return null;

  if (!authenticated) {
    return (
      <LoginPage
        onLoginSuccess={(_token: string) => {
          setAuthenticated(true);
        }}
      />
    );
  }

  return <>{children}</>;
}
