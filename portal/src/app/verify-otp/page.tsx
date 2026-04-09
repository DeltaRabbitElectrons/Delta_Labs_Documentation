'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function VerifyOTP() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [message, setMessage] = useState('');
  
  const router = useRouter();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const savedEmail = sessionStorage.getItem('otp_email');
    if (!savedEmail) {
      router.push('/login');
      return;
    }
    setEmail(savedEmail);

    // Initial countdown
    const timer = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1); // Only last char if pasted etc.
    if (!/^\d*$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Task 2: Join OTP explicitly
    const fullOtp = otp.join('');
    if (fullOtp.length < 6) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Explicitly send email and otp as strings
      const payload = {
        email: email,
        otp: fullOtp
      };

      const res: any = await api.post('/auth/verify-otp', payload);
      
      // Store token using login page's method
      localStorage.setItem('portal_token', res.access_token);
      localStorage.setItem('role', res.role);
      localStorage.setItem('name', res.name);
      localStorage.setItem('email', email);
      
      sessionStorage.removeItem('otp_email');
      router.push('/docs');
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('expired')) {
        setError('Your code has expired. Please request a new one.');
        setCanResend(true);
      } else {
        setError('Incorrect code. Please try again.');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      await api.post('/auth/send-otp', { email });
      setMessage('A new code has been sent to your phone.');
      setCanResend(false);
      setResendTimer(60);
      
      // Restart timer
      const timer = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setError('Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-inter p-6">
      <div className="w-full max-w-[440px] bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.04)] py-12 px-10 border border-[#e5e7eb]">
        
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-12 h-12 bg-[var(--accent-primary)]/10 rounded-full flex items-center justify-center text-[var(--accent-primary)] mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-[20px] font-[700] text-[var(--text-primary)] leading-tight mb-2">
            Two-Factor Verification
          </h1>
          <p className="text-[14px] text-[var(--text-secondary)]">
            Enter the 6-digit code sent to your phone
          </p>
          <p className="text-[13px] font-medium text-[var(--accent-primary)] mt-1">
            {email}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex justify-between gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                pattern="\d*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-[20px] font-bold border border-[var(--border)] rounded-[8px] focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] outline-none transition-all"
              />
            ))}
          </div>

          {error && (
            <div className="flex items-start gap-3 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] p-[10px_12px] text-[#dc2626]">
              <AlertCircle size={14} className="mt-1 shrink-0" />
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          {message && (
            <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-[6px] p-[10px_12px] text-green-700">
              <span className="text-[13px]">{message}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || otp.join('').length < 6}
            className="w-full h-[42px] bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-[600] text-[14px] rounded-[6px] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Verify'}
          </button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={!canResend || loading}
              className="text-[14px] text-[var(--accent-primary)] font-semibold hover:underline disabled:text-[#9ca3af] disabled:no-underline disabled:cursor-not-allowed"
            >
              {canResend ? 'Resend code' : `Resend code in 0:${resendTimer.toString().padStart(2, '0')}`}
            </button>
          </div>

          <div className="pt-6 border-t border-[#f1f5f9] text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-[13px] text-[#64748b] hover:text-[var(--text-primary)]"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
