'use client';

import { useState, useEffect } from 'react';
import { 
  Layers, Search, Image as ImageIcon, 
  Check, X, Loader, AlertCircle, RefreshCw
} from 'lucide-react';

interface Plan {
  name: string;
  price: number;
}

interface UserPlanPurchase {
  id: string;
  created_at: string;
  transaction_id: string;
  screenshot_url: string;
  status: string;
  remarks: string | null;
  plans: Plan;
  profiles: {
    full_name: string;
  } | null;
}

export default function AdminPlansApprovalQueue() {
  const [purchases, setPurchases] = useState<UserPlanPurchase[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [loading, setLoading] = useState(true);

  const [activePurchase, setActivePurchase] = useState<UserPlanPurchase | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadPurchases = async () => {
    try {
      setLoading(true);
      let url = `/api/user-plans?admin=true`;
      if (statusFilter !== 'All') {
        url += `&status=${statusFilter}`;
      }
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
        return;
      }
      
      if (data) {
        // Simple client-side search filtering
        let filtered = data as UserPlanPurchase[];
        if (search.trim() !== '') {
          const s = search.toLowerCase();
          filtered = filtered.filter(item => 
            item.transaction_id.toLowerCase().includes(s) || 
            item.profiles?.full_name.toLowerCase().includes(s) ||
            item.plans?.name.toLowerCase().includes(s)
          );
        }
        setPurchases(filtered);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, [statusFilter]);

  // Handle live search trigger on keystroke
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadPurchases();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleResolvePurchase = async (action: 'approve' | 'reject') => {
    if (!activePurchase) return;
    setActionLoading(true);

    try {
      const res = await fetch('/api/user-plans', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseId: activePurchase.id,
          action,
          remarks: remarks.trim()
        })
      });
      const data = await res.json();

      if (data.error) {
        alert(`Error executing plan action: ${data.error}`);
        setActionLoading(false);
        return;
      }

      // Success
      setActivePurchase(null);
      setRemarks('');
      loadPurchases();
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
            Plan Purchase Verification Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Audit user-submitted QR code payment screenshots and verify Transaction IDs to activate daily check-in plans.
          </p>
        </div>
        <button 
          onClick={loadPurchases}
          className="p-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          title="Refresh List"
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
            placeholder="Search TID, user name, or plan name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-white"
          />
        </div>

        <div className="flex gap-2">
          {(['Pending', 'Approved', 'Rejected', 'All'] as const).map((s) => (
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Plan Requested</th>
                  <th className="px-6 py-4 font-mono">TID</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-center">Receipt</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs sm:text-sm">
                {purchases.length > 0 ? (
                  purchases.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-white">
                        {item.profiles?.full_name || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 text-slate-300">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-semibold">{item.plans?.name}</td>
                      <td className="px-6 py-4 font-mono text-slate-400 text-xs">{item.transaction_id}</td>
                      <td className="px-6 py-4 text-right font-bold text-success-400 financial-nums">
                        Rs. {Number(item.plans?.price || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.screenshot_url ? (
                          <a
                            href={item.screenshot_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex text-primary-400 hover:text-white"
                          >
                            <ImageIcon size={18} />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-xxs">No Proof</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.status === 'Pending' ? (
                          <button
                            onClick={() => {
                              setActivePurchase(item);
                              setRemarks('');
                            }}
                            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Audit Purchase
                          </button>
                        ) : (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            item.status === 'Approved' ? 'bg-success-950/20 text-success-400' : 'bg-red-950/20 text-red-400'
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
                      <Layers className="mx-auto text-slate-600 mb-2" size={28} />
                      <h4 className="font-semibold text-white mb-1">No purchases found</h4>
                      <p className="text-xs">No pending or historical purchase requests match this filter.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Audit Modal */}
      {activePurchase && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scaleUp">
            
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/30">
              <h3 className="font-bold text-white text-base">Plan Verification: {activePurchase.profiles?.full_name}</h3>
              <button 
                onClick={() => setActivePurchase(null)}
                className="text-slate-500 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-grow">
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Price Charged</span>
                  <span className="text-lg font-bold text-success-400 mt-1 block financial-nums">
                    Rs. {Number(activePurchase.plans?.price || 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-850">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Plan Selection</span>
                  <span className="text-base font-bold text-white mt-1 block">{activePurchase.plans?.name}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 text-xxs uppercase tracking-wider block">Receipt Transaction ID (TID)</span>
                <span className="font-mono text-xs text-slate-300 mt-1 bg-slate-900/50 p-2 rounded-lg border border-slate-850 block select-all">
                  {activePurchase.transaction_id}
                </span>
              </div>

              {activePurchase.screenshot_url ? (
                <div className="space-y-1.5">
                  <span className="text-slate-500 text-xxs uppercase tracking-wider block">Verification Image Preview</span>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/20 max-h-48 flex justify-center">
                    <img 
                      src={activePurchase.screenshot_url} 
                      alt="receipt proof" 
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-900/40 border border-slate-800 rounded-xl text-center text-xs text-slate-500">
                  No payment receipt screenshot uploaded by user.
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Verification status remarks / feedback reason</label>
                <input
                  type="text"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified transaction ledger credit. Or invalid TID number submitted."
                  className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3 bg-slate-900/20 shrink-0 justify-end">
              <button
                type="button"
                onClick={() => handleResolvePurchase('reject')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-950/20 border border-red-800/40 text-red-400 hover:bg-red-900/20 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <X size={14} /> Reject Request
              </button>
              <button
                type="button"
                onClick={() => handleResolvePurchase('approve')}
                disabled={actionLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-success-950/20 border border-success-900/40 text-success-400 hover:bg-success-900/20 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                <Check size={14} /> Activate Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
