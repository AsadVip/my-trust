'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ScrollText, Search, Loader, RefreshCw, AlertTriangle } from 'lucide-react';

interface AuditLog {
  id: string;
  created_at: string;
  admin_id: string;
  action: string;
  module: string;
  status: string;
  previous_value: any;
  new_value: any;
}

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadAuditLogs = async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (moduleFilter !== 'All') {
        query = query.eq('module', moduleFilter);
      }

      if (search.trim() !== '') {
        query = query.or(`action.ilike.%${search}%,admin_id.eq.${search}`);
      }

      const { data } = await query;
      if (data) {
        setLogs(data as AuditLog[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [moduleFilter, search]);

  const modules = ['All', 'Deposits', 'Withdrawals', 'Wallets', 'Settings', 'Security'];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Audit Security Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log directory tracking administrator actions, setting edits, and wallet adjustments.
          </p>
        </div>
        <button 
          onClick={loadAuditLogs}
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
            placeholder="Search action or Admin ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-white"
          />
        </div>

        <div className="flex gap-2">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setModuleFilter(m)}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                moduleFilter === m
                  ? 'bg-primary-600 text-white'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-850 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader className="animate-spin text-primary-500" size={24} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Admin ID</th>
                  <th className="px-6 py-4">Module</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">Changes Preview</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 font-mono text-[10px] text-slate-500 max-w-xxs truncate">
                        {log.admin_id}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{log.module}</td>
                      <td className="px-6 py-4 text-white font-semibold">{log.action}</td>
                      <td className="px-6 py-4 max-w-xs truncate">
                        <span className="font-mono text-xxs text-slate-400">
                          {log.new_value ? JSON.stringify(log.new_value) : 'None'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-success-950/20 text-success-400`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-500 bg-slate-950">
                      <ScrollText className="mx-auto text-slate-600 mb-2" size={28} />
                      <h4 className="font-semibold text-white mb-1">No security logs recorded</h4>
                      <p className="text-xs">No admin logs matching search criteria.</p>
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
