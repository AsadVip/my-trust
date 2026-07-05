'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { 
  ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Calendar, 
  ArrowDownCircle, ArrowUpCircle, Bell, Loader, UserCheck, UserX, HelpCircle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

interface WalletData {
  available_balance: number;
  pending_balance: number;
  lifetime_earnings: number;
  total_deposits: number;
  total_withdrawals: number;
  streak_count: number;
  last_check_in: string | null;
}

interface Transaction {
  id: string;
  created_at: string;
  type: string;
  amount: number;
  status: string;
}

export default function DashboardPage() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userName, setUserName] = useState('User');
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('7d');
  const [chartData, setChartData] = useState<{ date: string; amount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkInEligible, setCheckInEligible] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadDashboardData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User');
        setEmailConfirmed(!!user.email_confirmed_at);

        // Load wallet
        const { data: walletData } = await supabase
          .from('wallets')
          .select('*')
          .eq('id', user.id)
          .single();

        if (walletData) {
          setWallet(walletData);
          
          // Determine check-in eligibility
          if (walletData.last_check_in) {
            const diff = new Date().getTime() - new Date(walletData.last_check_in).getTime();
            if (diff / (1000 * 60 * 60) < 24) {
              setCheckInEligible(false);
            }
          }
        }

        // Load recent transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('id, created_at, type, amount, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (txData) {
          setTransactions(txData);
        }

        // Load check-in history to populate earnings chart
        const { data: historyData } = await supabase
          .from('daily_check_ins')
          .select('check_in_time, total_credited')
          .eq('user_id', user.id)
          .order('check_in_time', { ascending: true });

        if (historyData) {
          // Accumulate earnings over time
          let accumulated = 0;
          const formatted = historyData.map(item => {
            accumulated += Number(item.total_credited);
            return {
              date: new Date(item.check_in_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              amount: accumulated
            };
          });
          
          // Fallback if no checkins
          if (formatted.length === 0) {
            setChartData([
              { date: 'Initial', amount: 0 },
              { date: 'Today', amount: 0 }
            ]);
          } else {
            setChartData(formatted);
          }
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching dashboard metrics...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Available Balance',
      value: wallet ? `${Number(wallet.available_balance).toFixed(2)}` : '0.00',
      label: 'Eligible for cashout',
      accentColor: 'text-success-600 dark:text-success-400',
      tooltip: 'Funds immediately eligible for withdrawal (min 100 credits).'
    },
    {
      title: 'Pending Balance',
      value: wallet ? `${Number(wallet.pending_balance).toFixed(2)}` : '0.00',
      label: 'Locked in validation',
      accentColor: 'text-warning-600 dark:text-warning-400',
      tooltip: 'Withdrawals or deposits awaiting administrator approval.'
    },
    {
      title: 'Lifetime Earnings',
      value: wallet ? `${Number(wallet.lifetime_earnings).toFixed(2)}` : '0.00',
      label: 'Cumulative check-in rewards',
      accentColor: 'text-primary-600 dark:text-primary-400',
      tooltip: 'Total rewards credited from check-ins and streak milestones.'
    },
    {
      title: 'Total Deposits',
      value: wallet ? `${Number(wallet.total_deposits).toFixed(2)}` : '0.00',
      label: 'Approved funding deposits',
      accentColor: 'text-accent-600 dark:text-accent-400',
      tooltip: 'Cumulative verified deposits made through JazzCash/EasyPaisa.'
    }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-divider-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
            Hello, {userName}
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Here is your financial summary and daily engagement streak status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {emailConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400 border border-success-200/50 dark:border-success-900/30">
              <UserCheck size={14} /> Verified Account
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-danger-100 dark:bg-danger-950/30 text-danger-700 dark:text-danger-400 border border-danger-200/50 dark:border-danger-900/30">
              <UserX size={14} /> Unverified (Verify email to cashout)
            </span>
          )}
        </div>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => (
          <div 
            key={card.title} 
            className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 relative group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{card.title}</span>
              <span className="text-text-muted cursor-help" title={card.tooltip}>
                <HelpCircle size={14} />
              </span>
            </div>
            <div className={`text-2xl sm:text-3xl font-bold tracking-tight mt-3 ${card.accentColor} financial-nums`}>
              {card.value}
            </div>
            <p className="text-xs text-text-muted mt-2 font-medium">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Check-in Banner Trigger */}
      <div className={`p-6 border rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 transition-all duration-200 ${
        checkInEligible 
          ? 'bg-primary-50/50 dark:bg-primary-950/10 border-primary-200 dark:border-primary-900/40' 
          : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            checkInEligible ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-text-muted'
          }`}>
            <Calendar size={22} />
          </div>
          <div>
            <h4 className="font-bold text-text-primary dark:text-white text-sm sm:text-base">
              {checkInEligible ? 'Daily Check-in Eligible!' : 'Check-in Completed'}
            </h4>
            <p className="text-xs text-text-secondary dark:text-slate-300 mt-1 max-w-xl">
              {checkInEligible 
                ? 'Claim your base credits and grow your consecutive active streak count for extra multipliers.'
                : `You are on an active streak of ${wallet?.streak_count || 0} consecutive days! Next check-in opens 24 hours after your last check-in.`
              }
            </p>
          </div>
        </div>
        <div>
          {checkInEligible ? (
            <Link
              href="/dashboard/check-in"
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 active:translate-y-0.5 transition-all cursor-pointer animate-pulse-glow"
            >
              Perform Check-in
            </Link>
          ) : (
            <Link
              href="/dashboard/check-in"
              className="inline-flex items-center gap-1.5 px-5 py-3 text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-text-muted rounded-xl cursor-pointer"
            >
              View Streak Timer
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Earnings Over Time Chart */}
        <div className="lg:col-span-8 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-bold text-text-primary dark:text-white text-base">Earning Analytics</h3>
              <p className="text-xxs text-text-muted uppercase tracking-wider font-semibold mt-1">Check-in Credits Over Time</p>
            </div>
            <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setChartRange(r)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    chartRange === r
                      ? 'bg-surface-light dark:bg-slate-700 shadow-sm text-text-primary dark:text-white'
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11 }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: '#94A3B8', fontSize: 11 }} 
                  orientation="left"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)', 
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#0F172A'
                  }} 
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#2563EB" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorAmount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Transactions list */}
        <div className="lg:col-span-4 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-text-primary dark:text-white text-base">Recent Ledger</h3>
            <Link 
              href="/dashboard/wallet"
              className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              See All
            </Link>
          </div>

          <div className="space-y-4">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-2.5 border-b border-divider-light dark:border-divider-dark last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-primary dark:text-white truncate">{tx.type}</p>
                    <p className="text-[10px] text-text-muted mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-xs font-bold financial-nums ${
                      tx.amount > 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                    }`}>
                      {tx.amount > 0 ? '+' : ''}{Number(tx.amount).toFixed(2)}
                    </span>
                    <span className={`block text-[10px] font-medium uppercase mt-0.5 ${
                      tx.status === 'Completed' ? 'text-success-500' :
                      tx.status === 'Pending' ? 'text-warning-500' : 'text-danger-500'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Wallet className="mx-auto text-text-muted mb-2" size={24} />
                <p className="text-xs text-text-muted">No transactions found.</p>
                <Link 
                  href="/dashboard/deposit"
                  className="inline-block mt-3 text-xs font-semibold bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 px-4 py-2 rounded-xl"
                >
                  Fund Wallet
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
