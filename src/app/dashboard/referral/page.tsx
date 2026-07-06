'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Users, Gift, Copy, Check, TrendingUp, UserPlus, 
  Clock, ArrowUpRight, Share2, AlertCircle, Loader
} from 'lucide-react';

interface ReferralUser {
  id: string;
  full_name: string;
  created_at: string;
  has_plan: boolean;
}

interface Transaction {
  id: string;
  created_at: string;
  amount: number;
  admin_ref: string | null;
}

export default function ReferralPage() {
  const [referralLink, setReferralLink] = useState('');
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get user session
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Unauthorized access. Please log in.');
        return;
      }

      // Build referral link
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        setReferralLink(`${origin}/register?ref=${user.id}`);
      }

      // Call API
      const res = await fetch('/api/referrals');
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setReferrals(data.referrals || []);
      setTransactions(data.transactions || []);
      setTotalCommission(data.totalCommission || 0);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load referral program details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralData();
  }, []);

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader className="animate-spin text-primary-500" size={28} />
          <span className="text-sm text-text-muted">Loading Referral Program...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white flex items-center gap-2">
          <Gift className="text-primary-500" /> Referral Program
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Invite friends to join My Trust. Earn <strong className="font-semibold text-primary-600 dark:text-primary-400">20% commission</strong> instantly when they purchase an earning plan or deposit funds!
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Commission */}
        <div className="p-6 bg-gradient-to-br from-primary-500/10 to-primary-600/5 dark:from-primary-950/20 dark:to-slate-900/40 border border-primary-200/50 dark:border-primary-900/30 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-primary-500 text-white rounded-xl shadow-md shadow-primary-500/15">
            <TrendingUp size={24} />
          </div>
          <div>
            <span className="text-xxs font-semibold text-text-muted uppercase tracking-wider block">Total Commission</span>
            <span className="text-2xl font-extrabold text-text-primary dark:text-white financial-nums mt-0.5 block">
              Rs. {totalCommission.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Referred Friends */}
        <div className="p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-success-500 text-white rounded-xl shadow-md shadow-success-500/15">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xxs font-semibold text-text-muted uppercase tracking-wider block">Friends Invited</span>
            <span className="text-2xl font-extrabold text-text-primary dark:text-white financial-nums mt-0.5 block">
              {referrals.length}
            </span>
          </div>
        </div>

        {/* Reward Percentage */}
        <div className="p-6 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="p-3.5 bg-warning-500 text-white rounded-xl shadow-md shadow-warning-500/15">
            <Gift size={24} />
          </div>
          <div>
            <span className="text-xxs font-semibold text-text-muted uppercase tracking-wider block">Commission Rate</span>
            <span className="text-2xl font-extrabold text-text-primary dark:text-white mt-0.5 block">
              20%
            </span>
          </div>
        </div>
      </div>

      {/* Share and Copy Box */}
      <div className="p-6 sm:p-8 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
          <Share2 size={16} className="text-primary-500" /> Share Your Invite Link
        </h3>
        <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
          Copy your link below and send it to your friends. They will be linked to your account as soon as they complete their registration.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <input
            type="text"
            readOnly
            value={referralLink}
            className="flex-grow px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-xs sm:text-sm font-mono text-text-secondary dark:text-slate-300 focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className={`px-5 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5 ${
              copied
                ? 'bg-success-600 text-white'
                : 'bg-primary-600 hover:bg-primary-700 text-white'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} /> Link Copied
              </>
            ) : (
              <>
                <Copy size={16} /> Copy Invite Link
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Referred Friends Table */}
        <div className="lg:col-span-7 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-text-primary dark:text-white text-base flex items-center gap-2">
            <UserPlus size={18} className="text-primary-500" /> Invited Friends
          </h3>

          <div className="overflow-x-auto">
            {referrals.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-divider-light dark:border-border-dark text-[10px] uppercase font-bold text-text-muted tracking-wider">
                    <th className="pb-3 font-semibold">Name</th>
                    <th className="pb-3 font-semibold">Joined Date</th>
                    <th className="pb-3 font-semibold text-right">Earning Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider-light dark:divide-border-dark text-xs">
                  {referrals.map((ref) => (
                    <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="py-3.5 font-semibold text-text-primary dark:text-white">{ref.full_name}</td>
                      <td className="py-3.5 text-text-muted">{new Date(ref.created_at).toLocaleDateString()}</td>
                      <td className="py-3.5 text-right">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          ref.has_plan
                            ? 'bg-success-100 dark:bg-success-950/20 text-success-700 dark:text-success-400 border border-success-200/50'
                            : 'bg-slate-100 dark:bg-slate-800 text-text-muted'
                        }`}>
                          {ref.has_plan ? 'Active Plan' : 'No Plans yet'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-12 text-text-muted space-y-2">
                <Users className="mx-auto text-text-muted/40" size={32} />
                <p className="text-xs">You haven't referred any friends yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Commission Transactions Ledger */}
        <div className="lg:col-span-5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="font-bold text-text-primary dark:text-white text-base flex items-center gap-2">
            <Clock size={18} className="text-primary-500" /> Recent Commission Payouts
          </h3>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/30 border border-divider-light dark:border-border-dark rounded-xl space-y-2 hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-text-primary dark:text-white flex items-center gap-1">
                      Referral Bonus <ArrowUpRight size={12} className="text-success-500" />
                    </span>
                    <span className="text-xs font-extrabold text-success-600 dark:text-success-400 financial-nums">
                      +Rs. {Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-text-muted">
                    <span>{tx.admin_ref || 'Promotional Credit'}</span>
                    <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted space-y-2">
                <Clock className="mx-auto text-text-muted/40" size={32} />
                <p className="text-xs">No referral commissions earned yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
