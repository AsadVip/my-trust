'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Mail, Globe, MapPin, Calendar, 
  ShieldCheck, ShieldAlert, Loader, AlertCircle, CheckCircle
} from 'lucide-react';

interface ProfileData {
  full_name: string;
  phone_number: string;
  country: string;
  timezone: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    full_name: '',
    phone_number: '',
    country: '',
    timezone: 'UTC',
  });
  
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [joinedDate, setJoinedDate] = useState('');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function loadProfileData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setEmail(user.email || '');
        setUserId(user.id);
        setEmailConfirmed(!!user.email_confirmed_at);
        setJoinedDate(new Date(user.created_at).toLocaleDateString());

        const { data } = await supabase
          .from('profiles')
          .select('full_name, phone_number, country, timezone')
          .eq('id', user.id)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            country: data.country || '',
            timezone: data.timezone || 'UTC',
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfileData();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
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
          full_name: profile.full_name.trim(),
          phone_number: profile.phone_number.trim(),
          country: profile.country.trim(),
          timezone: profile.timezone,
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching account profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
          Account Profile
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Review and update your personal account information and metadata properties.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-5 bg-success-50 dark:bg-success-950/20 border border-success-200 dark:border-success-800/30 rounded-xl flex items-start gap-3">
          <CheckCircle className="text-success-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-success-700 dark:text-success-400 text-sm">Profile Details Updated</h4>
            <p className="text-xs text-success-600 dark:text-success-500 mt-1">
              Your profile configurations have been updated successfully in our directory.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Update Form Column */}
        <div className="md:col-span-8 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-text-primary dark:text-white text-base">Update Details</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-text-muted" size={16} />
                  <input
                    type="text"
                    required
                    value={profile.full_name}
                    onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Phone Number (Optional)</label>
                <input
                  type="text"
                  value={profile.phone_number}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone_number: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                  placeholder="e.g. +923001234567"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Country</label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-3.5 text-text-muted" size={16} />
                  <input
                    type="text"
                    value={profile.country}
                    onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                    placeholder="e.g. Pakistan"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">Time Zone</label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 text-text-muted" size={16} />
                  <select
                    value={profile.timezone}
                    onChange={(e) => setProfile(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                  >
                    <option value="UTC">UTC (Universal Coordinated Time)</option>
                    <option value="Asia/Karachi">PKT (Pakistan Standard Time - GMT+5)</option>
                    <option value="GMT">GMT (Greenwich Mean Time)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={btnLoading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {btnLoading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* Read-Only Meta Column */}
        <div className="md:col-span-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-text-primary dark:text-white text-base">Security Properties</h3>

          <div className="space-y-5">
            <div className="border-b border-divider-light dark:border-border-dark pb-4">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Verification Status</span>
              <div className="flex items-center gap-1.5 mt-2">
                {emailConfirmed ? (
                  <span className="text-xs font-semibold text-success-600 dark:text-success-400 flex items-center gap-1">
                    <ShieldCheck size={16} /> Email Verified
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-danger-600 dark:text-danger-400 flex items-center gap-1">
                    <ShieldAlert size={16} /> Unverified Email
                  </span>
                )}
              </div>
            </div>

            <div className="border-b border-divider-light dark:border-border-dark pb-4">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Primary Email</span>
              <div className="flex items-center gap-1.5 mt-2 text-text-secondary dark:text-slate-300">
                <Mail size={16} className="text-text-muted" />
                <span className="text-xs truncate max-w-[180px]">{email}</span>
              </div>
            </div>

            <div className="border-b border-divider-light dark:border-border-dark pb-4">
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Registration Date</span>
              <div className="flex items-center gap-1.5 mt-2 text-text-secondary dark:text-slate-300">
                <Calendar size={16} className="text-text-muted" />
                <span className="text-xs">{joinedDate}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">User Directory ID</span>
              <span className="font-mono text-[10px] text-text-muted bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-divider-light dark:border-border-dark break-all mt-2 block">
                {userId}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
