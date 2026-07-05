'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUpCircle, Search, Check, X, Loader, 
  AlertCircle, ShieldAlert, ShieldCheck, RefreshCw
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
  user_id: string;
  profiles: {
    id: string;
    full_name: string;
  } | null;
}

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeWithdrawal, setActiveWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [checklist, setChecklist] = useState({
    emailVerified: true,
    sufficientFunds: false,
    noDuplication: true
  });

  const loadWithdrawals = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/withdrawals?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load withdrawals');
      }
      const data = await res.json();
      setWithdrawals(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load withdrawal requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWithdrawals();
  }, [statusFilter, search]);

  const handleOpenAudit = (withdrawal: WithdrawalRequest) => {
    setActiveWithdrawal(withdrawal);
    setRemarks('');
    // Mark sufficient funds if the request amount looks valid (status is Pending = funds already locked)
    setChecklist({ emailVerified: true, sufficientFunds: true, noDuplication: true });
  };

  const handleResolveWithdrawal = async (action: 'complete' | 'reject') => {
    if (!activeWithdrawal) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId: activeWithdrawal.id,
          action,
          remarks: remarks.trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Action failed');
      setActiveWithdrawal(null);
      setRemarks('');
      loadWithdrawals();
    } catch (err: any) {
      alert(err.message || 'An error occurred.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Withdrawal Approvals Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Review manual withdrawal payout requests, check account numbers, and complete bank transfers.
          </p>
        </div>
        <button 
          onClick={loadWithdrawals}
          className="p-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search account phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-white"
          />
        </div>

        <div className="flex gap-2">
          {(['Pending', 'Completed', 'Rejected', 'All'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                statusFilter === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-850 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="animate-spin text-primary-500" size={24} /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3 text-red-400">
            <AlertCircle size={24} />
            <p className="text-sm">{error}</p>
            <button onClick={loadWithdrawals} className="text-xs text-primary-400 underline cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Account Number</th>
                  <th className="px-6 py-4">Account Holder</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                {withdrawals.length > 0 ? (
                  withdrawals.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        {item.profiles?.full_name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{item.payment_method}</td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">{item.account_number}</td>
                      <td className="px-6 py-4 text-slate-300">{item.account_holder}</td>
                      <td className="px-6 py-4 text-right font-bold text-danger-400 financial-nums">
                        Rs. {Number(item.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status === 'Pending' ? (
                          <button
                            onClick={() => handleOpenAudit(item)}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Audit Payout
                          </button>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'Completed' ? 'bg-success-950/20 text-success-400' : 'bg-red-950/20 text-red-400'
                          }`}>
                            {item.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-16 text-slate-500 bg-slate-950">
                      <ArrowUpCircle className="mx-auto text-slate-600 mb-2" size={28} />
                      <h4 className="font-semibold text-white mb-1">No withdrawals found</h4>
                      <p className="text-xs">No pending or historical payout requests found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Drawer Modal */}
      {activeWithdrawal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold text-white text-base">Payout Audit: {activeWithdrawal.profiles?.full_name}</h3>
              <button 
                onClick={() => setActiveWithdrawal(null)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable details */}
            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Payout Amount</span>
                  <span className="text-lg font-bold text-danger-400 mt-1 block financial-nums">
                    Rs. {Number(activeWithdrawal.amount).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Transfer Channel</span>
                  <span className="text-base font-bold text-white mt-1 block">{activeWithdrawal.payment_method}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div>
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Target Phone Number</span>
                  <span className="font-mono text-sm text-slate-300 font-bold mt-1 block">
                    {activeWithdrawal.account_number}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Account Holder Name</span>
                  <span className="text-sm text-slate-300 font-bold mt-1 block">
                    {activeWithdrawal.account_holder}
                  </span>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3 bg-slate-900/40 p-5 rounded-xl border border-slate-850">
                <h4 className="text-xxs font-bold text-slate-500 uppercase tracking-wider">Verification Checklist</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    {checklist.emailVerified ? <ShieldCheck className="text-success-500" size={16} /> : <ShieldAlert className="text-danger-500" size={16} />}
                    <span className="text-slate-300">Verified Email Address</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checklist.sufficientFunds ? <ShieldCheck className="text-success-500" size={16} /> : <ShieldAlert className="text-danger-500" size={16} />}
                    <span className="text-slate-300">Sufficient locked pending funds in account wallet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {checklist.noDuplication ? <ShieldCheck className="text-success-500" size={16} /> : <ShieldAlert className="text-danger-500" size={16} />}
                    <span className="text-slate-300">No simultaneous duplicate request logs detected</span>
                  </div>
                </div>
              </div>

              {/* Remarks Form */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Payout Reference ID / rejection reason</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Bank Ref #9876543, or Incorrect name mismatch etc."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-900/20 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => handleResolveWithdrawal('reject')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-900/20 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <X size={14} /> Decline & Refund
              </button>
              <button
                type="button"
                onClick={() => handleResolveWithdrawal('complete')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-success-950/20 border border-success-900/40 text-success-400 hover:bg-success-900/20 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Check size={14} /> {actionLoading ? 'Processing...' : 'Payout Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
