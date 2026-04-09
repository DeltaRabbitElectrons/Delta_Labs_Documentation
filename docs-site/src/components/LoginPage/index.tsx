import React, { useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

interface LoginPageProps {
  onLoginSuccess: (token: string) => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { siteConfig } = useDocusaurusContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const apiUrl = siteConfig.customFields?.apiUrl as string || 'http://localhost:8000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = 'Invalid email or password';
        // Handle FastAPI validation array errors (422)
        if (Array.isArray(data.detail) && data.detail[0]?.msg) {
          errorMessage = data.detail[0].msg;
        } else if (typeof data.detail === 'string') {
          errorMessage = data.detail;
        }
        setError(errorMessage);
        return;
      }

      localStorage.setItem('delta_token', data.access_token);
      onLoginSuccess(data.access_token);
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,28 2,28" fill="currentColor" opacity="0.9" />
            </svg>
          </div>
          <span className={styles.logoText}>Delta Labs</span>
          <span className={styles.logoSub}>Documentation Portal</span>
        </div>

        {/* Notice */}
        <p className={styles.notice}>
          🔒 This documentation is currently in private beta. Admin access only.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@deltalabs.com"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error} role="alert">
              <span className={styles.errorIcon}>⚠</span>
              {error}
            </div>
          )}

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? (
              <span className={styles.spinner}>
                <span className={styles.spinnerDot} />
                Signing in…
              </span>
            ) : (
              'Sign In →'
            )}
          </button>
        </form>

        <p className={styles.footer}>
          Need access? Contact your Delta Labs admin.
        </p>
      </div>
    </div>
  );
}
