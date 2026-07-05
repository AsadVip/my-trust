'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowUpCircle, AlertCircle, CheckCircle, Smartphone, 
  Wallet, ShieldAlert, Loader, RefreshCw
} from 'lucide-react';

interface WithdrawalRequest {
  id: string;
  created_at: string;
  amount: number;
  payment_method: string;
  account_number: string;
  account_holder: string;
  status: string;
  remarks: string | null;
}

export default function WithdrawPage() {
  const [method, setMethod] = useState<'JazzCash' | 'EasyPaisa'>('JazzCash');
  const [amount, setAmount] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  
  const [availableBalance, setAvailableBalance] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<WithdrawalRequest[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const supabase = createClient();

  const loadWithdrawalData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setEmailConfirmed(!!user.email_confirmed_at);

      // Fetch wallet balances
      const { data: walletData } = await supabase
        .from('wallets')
        .select('available_balance')
        .eq('id', user.id)
        .single();
      
      if (walletData) {
        setAvailableBalance(Number(walletData.available_balance));
      }

      // Fetch withdrawal requests history
      const { data: historyData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (historyData) {
        setHistory(historyData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawalData();
  }, []);

  const handleResendVerification = async () => {
    setResendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email) {
        await supabase.auth.resend({
          type: 'signup',
          email: user.email,
        });
        alert('Verification email resent successfully! Please check your inbox.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const numericAmount = parseFloat(amount);

    if (numericAmount < 70) {
      setError('Minimum withdrawal is Rs. 70.');
      setLoading(false);
      return;
    }


    if (numericAmount > availableBalance) {
      setError('Insufficient available balance.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          method,
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim()
        })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setAmount('');
      setAccountNumber('');
      setAccountHolder('');
      loadWithdrawalData();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
          Withdraw Wallet Payout
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Request payout of eligible wallet earnings directly to your mobile bank account.
        </p>
      </div>

      {/* RLS/Verification Restriction Guard */}
      {!emailConfirmed && (
        <div className="p-5 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 rounded-xl flex items-start gap-4">
          <ShieldAlert className="text-danger-600 dark:text-danger-500 shrink-0 mt-0.5" size={22} />
          <div className="space-y-1.5">
            <h4 className="font-bold text-danger-700 dark:text-danger-400 text-sm">Account Verification Required</h4>
            <p className="text-xs text-danger-600 dark:text-danger-400 leading-relaxed">
              Your email is unverified. To prevent fraud and secure system payouts, withdrawal forms are locked. Please complete verification using the link sent during sign up.
            </p>
            <button
              onClick={handleResendVerification}
              disabled={resendingEmail}
              className="text-xs font-semibold underline text-danger-700 hover:text-danger-800 cursor-pointer disabled:opacity-50"
            >
              {resendingEmail ? 'Sending...' : 'Resend verification link'}
            </button>
          </div>
        </div>
      )}

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
            <h4 className="font-bold text-success-700 dark:text-success-400 text-sm">Withdrawal Request Registered</h4>
            <p className="text-xs text-success-600 dark:text-success-500 mt-1">
              Your available balance was updated, and the cashout request is pending admin audit review.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-6">
          
          {/* Available balance overview */}
          <div className="flex items-center justify-between p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-divider-light dark:border-border-dark">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-success-50 dark:bg-success-950/20 text-success-600 dark:text-success-400 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <p className="text-xxs font-semibold uppercase tracking-wider text-text-muted">Available Balance</p>
                <h4 className="text-xl font-bold text-text-primary dark:text-white financial-nums mt-0.5">
                  {availableBalance.toFixed(2)}
                </h4>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xxs font-medium text-text-muted block">Min Withdrawal</span>
              <span className="text-xs font-semibold text-text-secondary mt-0.5 block">Rs. 70</span>
            </div>
          </div>

          <form onSubmit={handleWithdrawSubmit} className="space-y-5">
            {/* Method selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Select Payout Method
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['JazzCash', 'EasyPaisa'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    disabled={!emailConfirmed}
                    onClick={() => setMethod(m)}
                    className={`flex items-center justify-center gap-3 p-4 border rounded-xl font-bold text-sm cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      method === m
                        ? 'bg-primary-50/50 dark:bg-primary-950/10 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-border-light dark:border-border-dark text-text-secondary hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone size={18} /> {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Payout amount */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Withdrawal Amount
              </label>
              <input
                type="number"
                required
                min={70}
                max={availableBalance}
                disabled={!emailConfirmed}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Minimum Rs. 70"
              />
            </div>

            {/* Account number */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Account Number / Phone Number
              </label>
              <input
                type="text"
                required
                disabled={!emailConfirmed}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Mobile account number (e.g. 03xxxxxxxxx)"
              />
            </div>

            {/* Account holder name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Account Holder Name
              </label>
              <input
                type="text"
                required
                disabled={!emailConfirmed}
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Exact name registered on account"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !emailConfirmed || !amount || parseFloat(amount) > availableBalance}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Request...' : 'Submit Payout Request'}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-text-primary dark:text-white text-base">Withdrawal Logs</h3>
            <button 
              onClick={loadWithdrawalData} 
              className="text-text-muted hover:text-text-secondary cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="space-y-4">
            {historyLoading ? (
              <div className="flex justify-center py-6"><Loader className="animate-spin text-primary-500" size={18} /></div>
            ) : history.length > 0 ? (
              history.map((item) => (
                <div key={item.id} className="p-4 border border-divider-light dark:border-border-dark rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-text-primary dark:text-white">{item.payment_method}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'Completed' ? 'bg-success-100 dark:bg-success-950/20 text-success-700 dark:text-success-400' :
                      item.status === 'Pending' ? 'bg-warning-100 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400' :
                      'bg-danger-100 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Amount:</span>
                    <span className="font-bold text-text-primary dark:text-white financial-nums">{Number(item.amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Account Number:</span>
                    <span className="text-text-secondary dark:text-slate-300 font-medium">{item.account_number}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Holder:</span>
                    <span className="text-text-secondary dark:text-slate-300 truncate max-w-[150px] font-medium">{item.account_holder}</span>
                  </div>
                  {item.remarks && (
                    <div className="text-[10px] text-text-secondary bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-divider-light dark:border-border-dark">
                      <strong>Remarks:</strong> {item.remarks}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted">
                <ArrowUpCircle className="mx-auto mb-2 text-text-muted" size={24} />
                <p className="text-xs">No withdrawals requested yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
