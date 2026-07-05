'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Mail, Shield, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });

      if (resetError) {
        setError(resetError.message);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark transition-colors duration-200">
      <PublicHeader />

      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-xl space-y-6">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center">
                <Shield size={26} className="stroke-[2.5px]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-text-primary dark:text-white">
                Reset Password
              </h2>
              <p className="text-xs sm:text-sm text-text-muted">
                Enter your email address to get a password reset link.
              </p>
            </div>

            {success ? (
              <div className="p-6 bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800/40 rounded-xl text-center space-y-3">
                <CheckCircle className="mx-auto text-success-500" size={40} />
                <h4 className="font-bold text-success-700 dark:text-success-400">Email Sent!</h4>
                <p className="text-xs sm:text-sm text-success-600 dark:text-success-500">
                  We have sent a password reset link to <strong>{email}</strong>.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-700"
                  >
                    Back to Login
                  </Link>
                </div>
              </div>
            ) : (
              <>
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs sm:text-sm flex items-start gap-2">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleReset} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Sending link...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
                  >
                    <ArrowLeft size={16} /> Back to Log In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
