'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Search, ArrowRight, Wallet, Flame, Loader, AlertTriangle, RefreshCw } from 'lucide-react';

interface UserRow {
  id: string;
  full_name: string;
  country: string;
  wallets: {
    available_balance: number;
    pending_balance: number;
    streak_count: number;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load users');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(loadUsers, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            User Directory
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Search active user profiles, review wallet balances, and access profile configuration triggers.
          </p>
        </div>
        <button onClick={loadUsers} className="p-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer" title="Refresh">
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search user full name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="animate-spin text-primary-500" size={24} /></div>
        ) : error ? (
          <div className="flex flex-col items-center py-16 gap-3 text-red-400">
            <AlertTriangle size={24} />
            <p className="text-sm">{error}</p>
            <button onClick={loadUsers} className="text-xs text-primary-400 underline cursor-pointer">Retry</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Country</th>
                  <th className="px-6 py-4 text-right">Available Balance</th>
                  <th className="px-6 py-4 text-right">Pending Balance</th>
                  <th className="px-6 py-4 text-center">Active Streak</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                {users.length > 0 ? (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">{u.full_name}</td>
                      <td className="px-6 py-4 text-slate-300">{u.country || 'Not Set'}</td>
                      <td className="px-6 py-4 text-right font-bold text-success-400 financial-nums">
                        Rs. {u.wallets ? Number(u.wallets.available_balance).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-warning-400 financial-nums">
                        Rs. {u.wallets ? Number(u.wallets.pending_balance).toFixed(2) : '0.00'}
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-orange-400">
                        <div className="flex items-center justify-center gap-1">
                          <Flame size={14} className="fill-orange-500/20" />
                          <span>{u.wallets ? u.wallets.streak_count : 0} Days</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-primary-400 hover:text-white hover:border-slate-700 transition-all"
                        >
                          Manage User <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500">
                      <Users className="mx-auto text-slate-600 mb-2" size={28} />
                      <h4 className="font-semibold text-white mb-1">No members found</h4>
                      <p className="text-xs">No registered profiles matching search terms.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
