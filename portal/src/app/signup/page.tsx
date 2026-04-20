'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { GoogleLogin } from '@react-oauth/google';

export default function Signup() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateEmail = (e: string) => {
    return String(e)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Field Validation
    if (formData.name.trim().length < 3) {
      setError('Please enter your full name (at least 3 characters)');
      setLoading(false);
      return;
    }

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.phone_number.length !== 9) {
      setError('Phone number must be exactly 9 digits after the +251 prefix');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/signup', {
        name: formData.name,
        email: formData.email,
        phone_number: `+251${formData.phone_number}`,
        password: formData.password
      });
      setSuccess(true);
    } catch (err: any) {
      let msg = err.message || 'Signup failed. Please try again.';
      if (msg.includes('API error 400:')) {
        try {
          const detail = JSON.parse(msg.split('API error 400: ')[1]);
          msg = detail.detail || msg;
        } catch { /* use original msg */ }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError('');
    try {
      const res: any = await api.post('/auth/google-signup', { token: credentialResponse.credential });
      if (res.already_exists) {
        setError(res.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || 'Google signup failed');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-inter p-6">
        <div className="w-full max-w-[440px] bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.04)] py-12 px-10 border border-[#e5e7eb] text-center animate-fade-in">
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={32} className="text-green-500" />
          </div>
          <h2 className="text-[24px] font-[700] text-[var(--text-primary)] mb-3">
            Request Submitted
          </h2>
          <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-8">
            Your admin account request has been submitted. A super admin will review and approve your access.
          </p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--accent-primary)] hover:underline"
          >
            <ArrowLeft size={16} />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#f8fafc] font-inter p-6">
      <div className="w-full max-w-[440px] bg-white rounded-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.04)] py-12 px-10 border border-[#e5e7eb]">
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/logo.png" alt="Delta Labs" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-[20px] font-[700] text-[var(--text-primary)] leading-tight">
              Request Admin Access
            </h1>
            <p className="text-[14px] text-[var(--text-secondary)]">
              Join the Delta Labs documentation team
            </p>
          </div>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="flex items-start gap-3 bg-[#fef2f2] border border-[#fecaca] rounded-[6px] p-[10px_12px] mb-4 text-[#dc2626]">
              <AlertCircle size={14} className="mt-1 shrink-0" />
              <span className="text-[13px]">{error}</span>
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 ml-0.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder=""
              className="h-[42px] w-full border border-[var(--border)] rounded-[6px] px-3 text-[14px] text-[var(--text-primary)] placeholder-transparent focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] outline-none transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 ml-0.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder=""
              className="h-[42px] w-full border border-[var(--border)] rounded-[6px] px-3 text-[14px] text-[var(--text-primary)] placeholder-transparent focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] outline-none transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 ml-0.5">
              Phone Number
            </label>
            <div className="flex h-[42px] w-full border border-[var(--border)] rounded-[6px] focus-within:border-[var(--accent-primary)] focus-within:ring-[3px] focus-within:ring-[var(--focus-ring)] overflow-hidden transition-all bg-white">
              <div className="flex items-center justify-center bg-gray-50 border-r border-[var(--border)] px-3 text-[14px] text-[#64748b] font-medium select-none">
                +251
              </div>
              <input
                type="tel"
                name="phone_number"
                required
                value={formData.phone_number}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setFormData(prev => ({ ...prev, phone_number: val }));
                }}
                maxLength={9}
                placeholder=""
                className="flex-1 h-full px-3 text-[14px] text-[var(--text-primary)] outline-none bg-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 ml-0.5">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder=""
                className="h-[42px] w-full border border-[var(--border)] rounded-[6px] px-3 text-[14px] text-[var(--text-primary)] placeholder-transparent focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] outline-none transition-all"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-[13px] font-medium text-[var(--text-secondary)] mb-1.5 ml-0.5">
                Confirm
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder=""
                className="h-[42px] w-full border border-[var(--border)] rounded-[6px] px-3 text-[14px] text-[var(--text-primary)] placeholder-transparent focus:border-[var(--accent-primary)] focus:ring-[3px] focus:ring-[var(--focus-ring)] outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[42px] mt-6 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-[600] text-[14px] rounded-[6px] shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Submitting...</span>
              </>
            ) : (
              'Submit Request'
            )}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#f1f5f9]"></div>
            </div>
            <div className="relative flex justify-center text-[12px] uppercase">
              <span className="bg-white px-3 text-[#9ca3af] font-medium">or extend request via</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google Signup Failed')}
              theme="outline"
              shape="rectangular"
              locale="en"
              text="signup_with"
            />
          </div>

          <div className="pt-6 border-t border-[#f1f5f9] text-center">
            <p className="text-[13px] text-[#64748b]">
              Already have an account?{' '}
              <Link href="/login" className="text-[var(--accent-primary)] font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
