'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  Wallet, Search, ArrowDownCircle, ArrowUpCircle, 
  HelpCircle, Download, FileSpreadsheet, Loader, ChevronLeft, ChevronRight, X
} from 'lucide-react';

interface WalletData {
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  total_deposits: number;
  total_withdrawals: number;
}

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  status: string;
  admin_ref: string | null;
}

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const supabase = createClient();

  const loadWalletDetails = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch wallet balances
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (walletData) {
        setWallet(walletData);
      }

      // Build transactions query
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (typeFilter !== 'All') {
        query = query.eq('type', typeFilter);
      }

      if (statusFilter !== 'All') {
        query = query.eq('status', statusFilter);
      }

      // Apply search term to reference or description
      if (search.trim() !== '') {
        query = query.or(`type.ilike.%${search}%,admin_ref.ilike.%${search}%,id.eq.${search}`);
      }

      // Pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data: txData, count, error } = await query.range(from, to);

      if (txData) {
        setTransactions(txData);
        setTotalCount(count || 0);
      }
    } catch (err) {
      console.error('Error loading wallet details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadWalletDetails();
  }, [typeFilter, statusFilter, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadWalletDetails();
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('All');
    setStatusFilter('All');
    setPage(1);
  };

  // CSV Export utility
  const handleExportCSV = () => {
    if (transactions.length === 0) return;
    
    // Headers
    const headers = ['Transaction ID', 'Date', 'Type', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Remarks'];
    const rows = transactions.map(tx => [
      tx.id,
      new Date(tx.created_at).toLocaleString(),
      tx.type,
      tx.amount,
      tx.balance_before,
      tx.balance_after,
      tx.status,
      tx.admin_ref || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `my_trust_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const transactionTypes = [
    'All', 'Daily Reward', 'Streak Bonus', 'Promotional Bonus', 
    'Deposit', 'Deposit Reversal', 'Withdrawal', 'Withdrawal Reversal', 'Admin Adjustment'
  ];

  const statuses = ['All', 'Completed', 'Pending', 'Failed', 'Cancelled'];

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Retrieving wallet ledger...</p>
      </div>
    );
  }

  const walletSummary = [
    { title: 'Available Balance', value: wallet?.available_balance || 0.00, label: 'Available immediately', color: 'text-success-600 dark:text-success-400' },
    { title: 'Pending Balance', value: wallet?.pending_balance || 0.00, label: 'Awaiting approvals', color: 'text-warning-600 dark:text-warning-400' },
    { title: 'Lifetime Earnings', value: wallet?.lifetime_earnings || 0.00, label: 'Earning history', color: 'text-primary-600 dark:text-primary-400' },
    { title: 'Total Deposits', value: wallet?.total_deposits || 0.00, label: 'Total funding', color: 'text-accent-600 dark:text-accent-400' },
    { title: 'Total Withdrawals', value: wallet?.total_withdrawals || 0.00, label: 'Total cashouts', color: 'text-text-muted' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-divider-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
            Wallet & Ledger Log
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Review detailed financial summaries, filter historical logs, and export transaction audit files.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/deposit"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-sm transition-all"
          >
            <ArrowDownCircle size={16} /> Deposit Funds
          </Link>
          <Link
            href="/dashboard/withdraw"
            className="flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-semibold bg-surface-light dark:bg-slate-800 text-text-secondary dark:text-white border border-border-light dark:border-border-dark rounded-xl hover:bg-slate-50 transition-all"
          >
            <ArrowUpCircle size={16} /> Withdraw Payout
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {walletSummary.map((c) => (
          <div key={c.title} className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-5 rounded-2xl shadow-sm">
            <span className="text-[10px] sm:text-xs font-semibold text-text-muted uppercase tracking-wider block">{c.title}</span>
            <span className={`text-xl sm:text-2xl font-bold mt-2 block financial-nums ${c.color}`}>
              {Number(c.value).toFixed(2)}
            </span>
            <span className="text-[10px] text-text-muted mt-1.5 block font-medium">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Filter toolbar */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <Search className="absolute left-3.5 top-3 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Search reference, transaction ID, types..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-text-secondary dark:text-white rounded-xl transition-all cursor-pointer"
            >
              Apply Search
            </button>
            {(search || typeFilter !== 'All' || statusFilter !== 'All') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="p-2 text-text-muted hover:text-danger-500 rounded-xl hover:bg-danger-50 dark:hover:bg-danger-950/20 cursor-pointer"
                title="Clear Filters"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </form>

        <div className="flex flex-wrap gap-4 items-center justify-between border-t border-divider-light dark:border-border-dark pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Type selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Transaction Type</label>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-xs focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
              >
                {transactionTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-xs focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={transactions.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-border-light dark:border-border-dark text-xs font-semibold rounded-xl text-text-secondary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Transactions Ledger Table */}
      <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-divider-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-900/30 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4 text-right">Balance After</th>
                <th className="px-6 py-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-divider-light dark:divide-divider-dark text-xs sm:text-sm">
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-text-muted truncate max-w-xs">{tx.id}</td>
                    <td className="px-6 py-4 text-text-secondary dark:text-slate-300">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-medium text-text-primary dark:text-white">{tx.type}</td>
                    <td className={`px-6 py-4 text-right font-bold financial-nums ${
                      tx.amount > 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-text-primary dark:text-white financial-nums">
                      {Number(tx.balance_after).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 rounded-full text-[10px] font-semibold ${
                        tx.status === 'Completed' ? 'bg-success-100 dark:bg-success-950/20 text-success-700 dark:text-success-400' :
                        tx.status === 'Pending' ? 'bg-warning-100 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400' :
                        'bg-danger-100 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-text-muted bg-surface-light dark:bg-surface-dark">
                    <Wallet className="mx-auto text-text-muted mb-2 animate-bounce" size={28} />
                    <h4 className="font-semibold text-text-primary dark:text-white mb-1">No transaction records</h4>
                    <p className="text-xs">Your financial transaction log is empty.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Toolbar */}
        {totalCount > pageSize && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-divider-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-900/30">
            <span className="text-xs text-text-muted font-medium">
              Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalCount)} of {totalCount} records
            </span>
            <div className="flex items-center space-x-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => prev - 1)}
                className="p-2 border border-border-light dark:border-border-dark rounded-xl text-text-secondary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page * pageSize >= totalCount}
                onClick={() => setPage(prev => prev + 1)}
                className="p-2 border border-border-light dark:border-border-dark rounded-xl text-text-secondary dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
