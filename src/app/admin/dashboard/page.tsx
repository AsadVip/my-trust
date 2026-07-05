'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, Wallet, Calendar, ArrowDownCircle, ArrowUpCircle, 
  TrendingUp, Loader, AlertTriangle, ArrowRight, RefreshCw, Layers
} from 'lucide-react';

interface OverviewStats {
  totalUsers: number;
  pendingDeposits: number;
  pendingWithdrawals: number;
  pendingPlans: number;
  totalLiability: number;
  totalRewardsDistributed: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<OverviewStats>({
    totalUsers: 0,
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    pendingPlans: 0,
    totalLiability: 0,
    totalRewardsDistributed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverviewStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load stats');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverviewStats();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching operations dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-red-400 gap-3">
        <AlertTriangle size={28} />
        <p className="text-sm">{error}</p>
        <button onClick={loadOverviewStats} className="text-xs text-primary-400 underline cursor-pointer">Retry</button>
      </div>
    );
  }

  const adminStats = [
    { title: 'Total Registered Members', value: stats.totalUsers, label: 'Members', icon: Users, color: 'text-primary-500 bg-primary-950/20 border-primary-900/30' },
    { title: 'Pending Plan Activations', value: stats.pendingPlans, label: 'Awaiting approval', icon: Layers, color: 'text-purple-500 bg-purple-950/20 border-purple-900/30', link: '/admin/deposits' },
    { title: 'Pending Withdrawal Requests', value: stats.pendingWithdrawals, label: 'Awaiting cashouts', icon: ArrowUpCircle, color: 'text-danger-500 bg-red-950/20 border-red-900/30', link: '/admin/withdrawals' },
    { title: 'Platform Available Liability', value: `Rs. ${stats.totalLiability.toFixed(2)}`, label: 'All wallets sum', icon: Wallet, color: 'text-success-500 bg-success-950/20 border-success-900/30' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Operations Terminal
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time control center overview of platform liquidity, user volumes, and audit requests.
          </p>
        </div>
        <button 
          onClick={loadOverviewStats}
          className="p-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          title="Refresh Dashboard"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.title} className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm relative group">
              <div className="flex justify-between items-start">
                <span className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider">{c.title}</span>
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${c.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-4 financial-nums">
                {c.value}
              </div>
              <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] text-slate-500 font-medium">{c.label}</span>
                {c.link && (
                  <Link href={c.link} className="text-xxs font-semibold text-primary-400 hover:text-primary-300 flex items-center gap-0.5">
                    Process <ArrowRight size={10} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Rewards Stats */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm flex items-center gap-5">
        <div className="w-12 h-12 rounded-xl bg-success-950/20 border border-success-900/30 text-success-500 flex items-center justify-center shrink-0">
          <TrendingUp size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-400 font-medium">Total Rewards Distributed (All Time)</p>
          <p className="text-2xl font-bold text-white mt-1 financial-nums">Rs. {stats.totalRewardsDistributed.toFixed(2)}</p>
        </div>
      </div>

      {/* Quick Action links */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <h3 className="font-bold text-white text-base mb-6">Operations Panel Shortcuts</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/deposits"
            className="flex flex-col items-center justify-center text-center p-5 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all"
          >
            <Layers className="text-purple-500 mb-2" size={24} />
            <span className="text-xs font-semibold text-white">Plan Approvals</span>
            <span className="text-[10px] text-slate-500 mt-1">{stats.pendingPlans} Pending</span>
          </Link>

          <Link
            href="/admin/withdrawals"
            className="flex flex-col items-center justify-center text-center p-5 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all"
          >
            <ArrowUpCircle className="text-danger-500 mb-2" size={24} />
            <span className="text-xs font-semibold text-white">Review Payouts</span>
            <span className="text-[10px] text-slate-500 mt-1">{stats.pendingWithdrawals} Queue</span>
          </Link>

          <Link
            href="/admin/users"
            className="flex flex-col items-center justify-center text-center p-5 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all"
          >
            <Users className="text-success-500 mb-2" size={24} />
            <span className="text-xs font-semibold text-white">User Directory</span>
            <span className="text-[10px] text-slate-500 mt-1">{stats.totalUsers} Members</span>
          </Link>

          <Link
            href="/admin/rewards"
            className="flex flex-col items-center justify-center text-center p-5 border border-slate-800 rounded-xl hover:bg-slate-900 transition-all"
          >
            <Calendar className="text-warning-500 mb-2" size={24} />
            <span className="text-xs font-semibold text-white">Plans Config</span>
            <span className="text-[10px] text-slate-500 mt-1">Configure Earning</span>
          </Link>
        </div>
      </div>

      {/* Alert Notices */}
      {(stats.pendingPlans > 0 || stats.pendingWithdrawals > 0) && (
        <div className="p-5 bg-warning-950/15 border border-warning-900/40 rounded-xl flex items-start gap-4 text-warning-400">
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">Action Items Awaiting Verification</h4>
            <p className="text-xs leading-relaxed text-slate-300 mt-1">
              There are currently {stats.pendingPlans} plan activation requests and {stats.pendingWithdrawals} withdrawal requests pending review.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
