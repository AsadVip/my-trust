'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  User, Mail, ArrowLeft, ShieldAlert, ShieldCheck, 
  Wallet, TrendingUp, AlertCircle, CheckCircle, Loader, RefreshCw
} from 'lucide-react';

interface UserDetail {
  id: string;
  full_name: string;
  country: string;
  phone_number: string;
  created_at: string;
}

interface WalletDetail {
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  streak_count: number;
}

interface UserTransaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  status: string;
}

export default function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const targetId = resolvedParams.id;
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<UserDetail | null>(null);
  const [wallet, setWallet] = useState<WalletDetail | null>(null);
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Adjustment form states
  const [adjustmentType, setAdjustmentType] = useState<'Credit' | 'Debit'>('Credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [adjustSuccess, setAdjustSuccess] = useState(false);

  const loadUserDetails = async () => {
    try {
      // 1. Fetch user auth details using admin client or query profile
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (profileErr || !profileData) {
        alert('User details not found.');
        router.push('/admin/users');
        return;
      }

      setProfile({
        id: profileData.id,
        full_name: profileData.full_name || 'No Name',
        country: profileData.country || 'Not Set',
        phone_number: profileData.phone_number || 'Not Set',
        created_at: new Date(profileData.created_at).toLocaleDateString()
      });

      // 2. Fetch user wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', targetId)
        .single();
      
      if (walletData) {
        setWallet({
          available_balance: Number(walletData.available_balance),
          pending_balance: Number(walletData.pending_balance),
          lifetime_earnings: Number(walletData.lifetime_earnings),
          streak_count: walletData.streak_count
        });
      }

      // 3. Fetch recent transaction history
      const { data: txData } = await supabase
        .from('transactions')
        .select('id, created_at, type, amount, status')
        .eq('user_id', targetId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (txData) {
        setTransactions(txData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserDetails();
  }, [targetId]);

  const handleWalletAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjustLoading(true);
    setAdjustError(null);
    setAdjustSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Admin session expired.');

      const { data, error } = await supabase.rpc('admin_adjust_wallet', {
        target_user_uuid: targetId,
        adjustment_type: adjustmentType,
        adjust_amount: parseFloat(adjustAmount),
        adjust_reason: adjustReason.trim(),
        reviewer_uuid: user.id
      });

      if (error) {
        setAdjustError(error.message);
        setAdjustLoading(false);
        return;
      }

      setAdjustSuccess(true);
      setAdjustAmount('');
      setAdjustReason('');
      loadUserDetails();
    } catch (err: any) {
      setAdjustError(err.message || 'An unexpected adjustment error occurred.');
    } finally {
      setAdjustLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching user dossier...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/admin/users')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 text-xs font-semibold rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to Users
        </button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-primary-950/40 text-primary-500 rounded-2xl flex items-center justify-center text-xl font-bold uppercase border border-primary-900/30">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{profile?.full_name}</h1>
            <p className="text-xs text-slate-400 mt-1">User ID: {profile?.id}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Profile Card Summary & Adjustment Form Column */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* User dossiers cards summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Available Balance</span>
              <span className="text-lg sm:text-xl font-bold text-success-400 tracking-tight mt-1.5 block financial-nums">
                {wallet?.available_balance.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Pending Balance</span>
              <span className="text-lg sm:text-xl font-bold text-warning-400 tracking-tight mt-1.5 block financial-nums">
                {wallet?.pending_balance.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Earnings</span>
              <span className="text-lg sm:text-xl font-bold text-primary-400 tracking-tight mt-1.5 block financial-nums">
                {wallet?.lifetime_earnings.toFixed(2)}
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Streak Days</span>
              <span className="text-lg sm:text-xl font-bold text-orange-400 tracking-tight mt-1.5 block">
                {wallet?.streak_count} Days
              </span>
            </div>
          </div>

          {/* Wallet Adjustment Panel Form */}
          <div className="bg-slate-950 border border-slate-800 p-8 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Wallet className="text-primary-500" size={18} /> Administrative Wallet Adjustment
            </h3>

            {adjustError && (
              <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{adjustError}</span>
              </div>
            )}

            {adjustSuccess && (
              <div className="p-4 bg-success-950/20 border border-success-900/40 text-success-400 rounded-xl flex items-start gap-2">
                <CheckCircle size={16} className="shrink-0 mt-0.5" />
                <span className="text-xs font-semibold">Wallet balances adjusted successfully. Ledger entries committed.</span>
              </div>
            )}

            <form onSubmit={handleWalletAdjustment} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Adjustment Type</label>
                  <select
                    value={adjustmentType}
                    onChange={(e) => {
                      setAdjustmentType(e.target.value as 'Credit' | 'Debit');
                      setAdjustSuccess(false);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 text-white"
                  >
                    <option value="Credit">Credit Available Balance (Fund Additions)</option>
                    <option value="Debit">Debit Available Balance (Fund Deductions)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Adjustment Amount</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={adjustAmount}
                    onChange={(e) => {
                      setAdjustAmount(e.target.value);
                      setAdjustSuccess(false);
                    }}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 text-white"
                    placeholder="Credits amount to add/sub"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Audit / Adjust Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-primary-500 text-white"
                  placeholder="Explain why this adjustment is made (committed to public ledger and audit records)"
                />
              </div>

              <button
                type="submit"
                disabled={adjustLoading || !adjustAmount}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {adjustLoading ? 'Executing adjustment...' : 'Commit Wallet Adjustment'}
              </button>
            </form>
          </div>
        </div>

        {/* User profile dossier Column */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
            <h3 className="font-bold text-white text-base">User Dossier</h3>
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Joined Date</span>
                <span className="text-xs font-medium text-slate-300 block mt-1">{profile?.created_at}</span>
              </div>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Country</span>
                <span className="text-xs font-medium text-slate-300 block mt-1">{profile?.country}</span>
              </div>
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">Phone Number</span>
                <span className="text-xs font-medium text-slate-300 block mt-1">{profile?.phone_number}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-white text-base">User Ledger Summary</h3>
              <button onClick={loadUserDetails} className="text-slate-500 hover:text-white" title="Refresh">
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="space-y-4">
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center py-2 border-b border-slate-850 last:border-0 last:pb-0">
                    <div>
                      <p className="text-xs font-semibold text-white">{tx.type}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-bold financial-nums ${
                        tx.amount > 0 ? 'text-success-400' : 'text-danger-400'
                      }`}>
                        {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  No transaction log records.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
