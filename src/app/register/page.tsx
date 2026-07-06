'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import PublicHeader from '@/components/PublicHeader';
import PublicFooter from '@/components/PublicFooter';
import { Mail, Lock, User, Eye, EyeOff, Shield, AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();
  
  const [referrerId, setReferrerId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setReferrerId(ref);
        localStorage.setItem('referred_by', ref);
      } else {
        const savedRef = localStorage.getItem('referred_by');
        if (savedRef) {
          setReferrerId(savedRef);
        }
      }
    }
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const passwordStrength = getPasswordStrength(password);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (passwordStrength < 3) {
      setError('Password is too weak. Make sure it contains uppercase, lowercase, numbers, and special characters.');
      setLoading(false);
      return;
    }

    if (!acceptTerms) {
      setError('You must accept the Terms & Conditions.');
      setLoading(false);
      return;
    }

    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            referred_by: referrerId || undefined,
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
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

  const strengthLabels = ['Too Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = [
    'bg-danger-500',
    'bg-danger-500',
    'bg-warning-500',
    'bg-primary-500',
    'bg-success-500',
  ];

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
                Create your account
              </h2>
              <p className="text-xs sm:text-sm text-text-muted">
                Join My Trust and start earning daily habit rewards.
              </p>
            </div>

            {success ? (
              <div className="p-6 bg-success-50 dark:bg-success-950/30 border border-success-200 dark:border-success-800/40 rounded-xl text-center space-y-3">
                <CheckCircle className="mx-auto text-success-500" size={40} />
                <h4 className="font-bold text-success-700 dark:text-success-400">Registration Success!</h4>
                <p className="text-xs sm:text-sm text-success-600 dark:text-success-500">
                  Please check your inbox. We sent a verification email to <strong>{email}</strong>.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-block px-5 py-2.5 bg-primary-600 text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-primary-700"
                  >
                    Go to Login
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

                 {/* Referral Banner */}
                 {referrerId && (
                   <div className="p-3 bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/20 rounded-xl text-xs text-primary-700 dark:text-primary-400 flex items-center gap-2 animate-fadeIn mb-2">
                     <User size={14} className="shrink-0 text-primary-600 dark:text-primary-400" />
                     <span>You are signing up using a referral link!</span>
                   </div>
                 )}

                 {/* Form */}
                 <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-11 pr-11 py-3 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-text-muted hover:text-text-secondary cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Strength Bar */}
                    {password.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-xxs font-medium text-text-muted">
                          <span>Password Strength</span>
                          <span>{strengthLabels[passwordStrength - 1] || 'Too Weak'}</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5 h-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-full rounded-full transition-all duration-300 ${
                                level <= passwordStrength
                                  ? strengthColors[passwordStrength - 1]
                                  : 'bg-slate-200 dark:bg-slate-700'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-3.5 text-text-muted" size={18} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  {/* Accept Terms */}
                  <div className="flex items-start gap-2 pt-1 select-none">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 accent-primary-600 rounded border-border-light text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <label htmlFor="terms" className="text-xs text-text-secondary dark:text-slate-300 cursor-pointer leading-tight">
                      I accept and agree to the{' '}
                      <Link href="/terms" target="_blank" className="font-semibold text-primary-600 hover:underline">
                        Terms & Conditions
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" target="_blank" className="font-semibold text-primary-600 hover:underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? 'Creating account...' : 'Create Account'}
                  </button>
                </form>

                <div className="text-center text-xs sm:text-sm text-text-muted">
                  Already have an account?{' '}
                  <Link href="/login" className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">
                    Log in here
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
