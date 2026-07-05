'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Bell, Eye, Lock, ShieldCheck, 
  Loader, AlertCircle, CheckCircle
} from 'lucide-react';

interface NotificationPrefs {
  email: boolean;
  rewards: boolean;
  deposits: boolean;
  withdrawals: boolean;
  announcements: boolean;
}

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [prefs, setPrefs] = useState<NotificationPrefs>({
    email: true,
    rewards: true,
    deposits: true,
    withdrawals: true,
    announcements: true,
  });

  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadSettings() {
      try {
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
        if (savedTheme) {
          setTheme(savedTheme);
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('profiles')
          .select('theme, notifications_pref')
          .eq('id', user.id)
          .single();
        
        if (data) {
          if (data.theme) setTheme(data.theme as 'light' | 'dark' | 'system');
          if (data.notifications_pref) {
            setPrefs(data.notifications_pref as NotificationPrefs);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (newTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // System default checking
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleTogglePref = (key: keyof NotificationPrefs) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
    setSuccess(false);
  };

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          theme,
          notifications_pref: prefs,
        })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        setBtnLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setBtnLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      setPasswordLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) {
        setPasswordError(updateError.message);
        setPasswordLoading(false);
        return;
      }

      setPasswordSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.message || 'An unexpected error occurred.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching system preferences...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
          System Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Configure app appearance settings, alerts preferences, and update passwords.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Options Column */}
        <div className="md:col-span-7 space-y-8">
          
          {/* Preferences form */}
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-text-primary dark:text-white text-base flex items-center gap-2">
              <Bell className="text-primary-500" size={18} /> Notifications & Appearance
            </h3>

            {error && (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-4 bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800/30 rounded-xl flex items-start gap-2">
                <CheckCircle className="text-success-500 shrink-0 mt-0.5" size={16} />
                <span className="text-xs font-semibold text-success-700 dark:text-success-400">Settings saved successfully.</span>
              </div>
            )}

            <form onSubmit={handleSaveNotifications} className="space-y-6">
              {/* Theme Settings Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300 flex items-center gap-1.5">
                  <Eye size={16} className="text-text-muted" /> Theme Mode
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['light', 'dark', 'system'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleThemeChange(t)}
                      className={`py-2 px-3 border rounded-xl text-xs font-semibold uppercase cursor-pointer transition-all ${
                        theme === t
                          ? 'bg-primary-50/50 dark:bg-primary-950/10 border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-border-light dark:border-border-dark text-text-secondary hover:bg-slate-100'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification preferences toggles */}
              <div className="space-y-4">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300 block">
                  Alert Channels
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-text-primary dark:text-white block">Email Dispatch</span>
                      <span className="text-[10px] text-text-muted">Receive account notices via email.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.email}
                      onChange={() => handleTogglePref('email')}
                      className="accent-primary-600 rounded border-border-light text-primary-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-text-primary dark:text-white block">Daily Reward Alerts</span>
                      <span className="text-[10px] text-text-muted">Receive streak check-in triggers.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.rewards}
                      onChange={() => handleTogglePref('rewards')}
                      className="accent-primary-600 rounded border-border-light text-primary-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-text-primary dark:text-white block">Deposit Confirmations</span>
                      <span className="text-[10px] text-text-muted">Get updates when funding requests resolve.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.deposits}
                      onChange={() => handleTogglePref('deposits')}
                      className="accent-primary-600 rounded border-border-light text-primary-600 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-text-primary dark:text-white block">Withdrawal Updates</span>
                      <span className="text-[10px] text-text-muted">Get alerts for withdrawal payout states.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={prefs.withdrawals}
                      onChange={() => handleTogglePref('withdrawals')}
                      className="accent-primary-600 rounded border-border-light text-primary-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={btnLoading}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {btnLoading ? 'Saving...' : 'Save Configuration'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Column */}
        <div className="md:col-span-5">
          <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-text-primary dark:text-white text-base flex items-center gap-2">
              <Lock className="text-primary-500" size={18} /> Update Password
            </h3>

            {passwordError && (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="p-4 bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800/30 rounded-xl flex items-start gap-2">
                <ShieldCheck className="text-success-500 shrink-0 mt-0.5" size={16} />
                <span className="text-xs font-semibold text-success-700 dark:text-success-400">Password reset successful.</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                  placeholder="At least 8 characters"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading || !password}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Reset User Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
