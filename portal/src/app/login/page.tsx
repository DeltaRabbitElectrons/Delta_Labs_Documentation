'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

type View = 'login' | 'request-otp' | 'verify-otp';

function FormField({ label, type, value, onChange, placeholder, required = false, error, rightElement }: {
  label: string;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  rightElement?: React.ReactNode;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="flex flex-col mb-5 w-full">
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-[13px] font-medium text-[var(--text-secondary)] font-inter">
          {label}
        </label>
        {rightElement}
      </div>
      <div className="relative">
        <input
          type={effectiveType}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder || ""}
          className={`h-[42px] w-full border ${error ? 'border-[var(--error)]' : 'border-[var(--border)]'} rounded-[6px] px-3 text-[14px] text-[var(--text-primary)] placeholder-transparent transition-all duration-150 outline-none focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] font-inter`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280] transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Login() {
  const [view, setView] = useState<View>('login');
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const msg = sessionStorage.getItem("auth_message");
    if (msg) {
      setErrorMessage(msg);
      sessionStorage.removeItem("auth_message");
    }
  }, []);

  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // OTP state
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (e: string) => {
    return String(e)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    if (!validateEmail(email)) {
      setLoginError('Please enter a valid email address');
      setLoginLoading(false);
      return;
    }

    if (password.length < 1) {
      setLoginError('Please enter your password');
      setLoginLoading(false);
      return;
    }

    try {
      const res: any = await api.post('/auth/login', { email, password });
      
      if (res.requires_otp) {
        sessionStorage.setItem('otp_email', email);
        router.push('/verify-otp');
        return;
      }

      localStorage.setItem('portal_token', res.access_token);
      localStorage.setItem('role', res.role);
      localStorage.setItem('name', res.name);
      localStorage.setItem('email', email);
      router.push('/docs');
    } catch (err: any) {
      const msg = err?.detail || err?.message || '';
      if (msg.toLowerCase().includes('pending')) {
        setLoginError('Your account is pending approval. Please wait for a super admin to approve you.');
      } else if (msg.toLowerCase().includes('verification code') || msg.toLowerCase().includes('could not send')) {
        setLoginError(msg);
      } else if (msg) {
        setLoginError(msg);
      } else {
        setLoginError('Invalid email or password. Please try again.');
      }


    } finally {
      setLoginLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');

    if (!validateEmail(otpEmail)) {
      setOtpError('Please enter a valid email address');
      setOtpLoading(false);
      return;
    }

    try {
      await api.post('/auth/forgot-password', { email: otpEmail });
      setOtpMessage('Reset link sent to your email.');
      setView('verify-otp');
    } catch (err: any) {
      setOtpError(err.message || 'Error sending link. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter the 6-digit verification code');
      return;
    }
    if (newPassword.length < 8) {
      setOtpError('New password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setOtpError('Passwords do not match');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      await api.post('/auth/reset-password', {
        email: otpEmail,
        otp: otpCode,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setView('login');
      setLoginError('');
      setOtpMessage('Password updated! You can now log in.');
      setEmail(otpEmail);
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-inter p-6">
      <div className="w-full max-w-[400px] bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.04)] py-12 px-10 border border-[#e5e7eb]">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Delta Labs" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[20px] font-[700] text-[var(--text-primary)] leading-tight">
              Delta Labs
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Sign in to your account
            </p>
          </div>
        </div>

        {view === 'login' && (
          <form onSubmit={handleLogin} className="animate-fade-in">
            {errorMessage && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-[6px] p-[10px_12px] mb-4 text-amber-700">
                <span>⚠️</span>
                <span className="text-[13px]">{errorMessage}</span>
              </div>
            )}
            {loginError && (
              <div className="flex items-start gap-3 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] p-[10px_12px] mb-4 text-[#dc2626]">
                <AlertCircle size={14} className="mt-1 shrink-0" />
                <span className="text-[13px]">{loginError}</span>
              </div>
            )}

            <FormField
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => { setView('request-otp'); setOtpError(''); setOtpEmail(''); }}
                  className="text-[13px] text-[var(--accent-primary)] hover:underline"
                >
                  Forgot password?
                </button>
              }
            />

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full h-[42px] mt-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-inter font-[600] text-[14px] rounded-[6px] shadow-sm hover:shadow-[0_4px_12px_rgba(23,74,95,0.3)] transition-all duration-150 transform hover:-translate-y-px active:translate-y-0 disabled:bg-[var(--accent-hover)] disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <div className="animate-spin border-[2px] border-white border-t-transparent rounded-full w-4 h-4" />
                  <span>Signing in...</span>
                </>
              ) : (
                'Sign in'
              )}
            </button>
            <div className="mt-8 pt-6 border-t border-[#f1f5f9] text-center">
              <p className="text-[13px] text-[#64748b]">
                Don't have an account?{' '}
                <Link href="/signup" className="text-[var(--accent-primary)] font-semibold hover:underline">
                  Request Access
                </Link>
              </p>
            </div>

            <p className="text-center text-[12px] text-[#9ca3af] mt-8">
              Delta Labs Admin Portal
            </p>
          </form>
        )}

        {view === 'request-otp' && (
          <form onSubmit={handleRequestOTP} className="animate-fade-in">
            <h3 className="text-[18px] font-bold mb-4">Reset Password</h3>
            <FormField
              label="Email address"
              type="email"
              value={otpEmail}
              onChange={(e) => setOtpEmail(e.target.value)}
              required
              error={otpError}
            />
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full h-[42px] bg-[var(--accent-primary)] text-white font-semibold text-[14px] rounded-[6px] shadow-sm mt-2 flex items-center justify-center"
            >
              {otpLoading ? <Loader2 className="animate-spin" size={20} /> : 'Send Reset Link'}
            </button>
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full mt-4 text-[13px] text-[#6b7280] hover:text-[#111827] text-center"
            >
              Back to Sign in
            </button>
          </form>
        )}

        {view === 'verify-otp' && (
          <form onSubmit={handleVerifyOTP} className="animate-fade-in">
            {otpMessage && (
              <div className="bg-green-50 text-green-700 text-[13px] p-3 rounded-md mb-6">
                {otpMessage}
              </div>
            )}
            {otpError && (
              <div className="flex items-start gap-3 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] p-[10px_12px] mb-4 text-[#dc2626]">
                <span className="text-[13px]">{otpError}</span>
              </div>
            )}
            <FormField
              label="Verification Code"
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
            />
            <FormField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <FormField
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={otpError}
            />
            <button
              type="submit"
              disabled={otpLoading}
              className="w-full h-[42px] bg-[var(--accent-primary)] text-white font-semibold text-[14px] rounded-[6px] shadow-sm mt-4 flex items-center justify-center"
            >
              {otpLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
            </button>
          </form>
        )}
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .font-inter {
          font-family: 'Inter', sans-serif;
        }
      `}</style>
    </div>
  );
}
