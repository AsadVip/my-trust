'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Plus, CheckCircle, AlertCircle, Smartphone, 
  Upload, Loader, RefreshCw, Layers, Sparkles, Clock, QrCode, Download, X
} from 'lucide-react';
import Image from 'next/image';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  base_reward: number;
  streak_bonus: number;
  milestones: Record<string, number>;
}

interface UserPlanPurchase {
  id: string;
  created_at: string;
  transaction_id: string;
  screenshot_url: string;
  status: string;
  remarks: string | null;
  plans: Plan;
}

export default function DepositPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [method, setMethod] = useState<'JazzCash' | 'EasyPaisa'>('JazzCash');
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [history, setHistory] = useState<UserPlanPurchase[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [isQrZoomed, setIsQrZoomed] = useState(false);

  const supabase = createClient();

  const loadPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setPlans(data);
      if (data.length > 0) {
        setSelectedPlanId(data[0].id);
      }
    } catch (err) {
      console.error(err);
      setError('Unable to retrieve earning plans.');
    } finally {
      setPlansLoading(false);
    }
  };

  const loadPurchaseHistory = async () => {
    try {
      const res = await fetch('/api/user-plans');
      const data = await res.json();
      if (data.error) return;
      setHistory(data);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    loadPurchaseHistory();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setScreenshot(e.target.files[0]);
      setError(null);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Unauthenticated');

      if (!selectedPlanId) {
        throw new Error('Please select an earning plan.');
      }

      let uploadedUrl = '';

      // Upload receipt screenshot
      if (screenshot) {
        setUploading(true);
        const fileExt = screenshot.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('receipts')
          .upload(filePath, screenshot, {
            upsert: true,
          });

        if (uploadError) {
          throw new Error('Screenshot upload failed: ' + uploadError.message);
        }

        if (uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('receipts')
            .getPublicUrl(filePath);
          uploadedUrl = publicUrl;
        }
        setUploading(false);
      } else {
        throw new Error('Screenshot proof is required to verify the transaction.');
      }

      const res = await fetch('/api/user-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          transactionId: transactionId.trim(),
          screenshotUrl: uploadedUrl
        })
      });

      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setTransactionId('');
      setScreenshot(null);
      loadPurchaseHistory();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
          Earning Plans Store
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Select an investment plan, make a transfer using our official QR code, and submit proof to activate your plan.
        </p>
      </div>

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
            <h4 className="font-bold text-success-700 dark:text-success-400 text-sm">Purchase Request Received!</h4>
            <p className="text-xs text-success-600 dark:text-success-500 mt-1">
              Your transaction proof is submitted. An administrator will verify the TID and receipt screenshot to activate your plan (usually within 1–2 hours).
            </p>
          </div>
        </div>
      )}

      {/* Plan selection grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Select Earning Plan</h3>
        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-primary-500" size={24} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const selected = selectedPlanId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPlanId(p.id);
                    setSuccess(false);
                  }}
                  className={`p-6 border rounded-2xl cursor-pointer relative overflow-hidden transition-all flex flex-col justify-between ${
                    selected
                      ? 'bg-primary-50/25 dark:bg-primary-950/10 border-primary-500 shadow-md shadow-primary-500/5 scale-[1.02]'
                      : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {selected && (
                    <span className="absolute top-3 right-3 text-[10px] bg-primary-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Selected
                    </span>
                  )}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-base font-bold text-text-primary dark:text-white">{p.name}</h4>
                      <p className="text-xs text-text-muted mt-0.5">{p.duration_days} Days Active Lifespan</p>
                    </div>
                    <div className="flex items-baseline gap-1.5 border-b border-divider-light dark:border-divider-dark pb-4">
                      <span className="text-2xl font-bold text-text-primary dark:text-white financial-nums">
                        Rs. {Number(p.price).toFixed(2)}
                      </span>
                      <span className="text-xxs text-text-muted">Plan cost</span>
                    </div>
                    <ul className="space-y-2 text-xs text-text-secondary dark:text-slate-300 pt-2">
                      <li className="flex justify-between">
                        <span>Base reward:</span>
                        <span className="font-semibold text-text-primary dark:text-white">Rs. {Number(p.base_reward).toFixed(2)}/day</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Streak modifier:</span>
                        <span className="font-semibold text-text-primary dark:text-white">+Rs. {Number(p.streak_bonus).toFixed(2)}/consecutive day</span>
                      </li>
                      {p.milestones && Object.keys(p.milestones).length > 0 && (
                        <li className="border-t border-divider-light dark:border-border-dark pt-2 mt-2">
                          <span className="text-xxs text-text-muted font-bold block mb-1">STREAK MILESTONES:</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(p.milestones).map(([day, bonus]) => (
                              <span key={day} className="text-[9px] bg-success-50 dark:bg-success-950/20 text-success-700 dark:text-success-400 border border-success-200 dark:border-success-900/20 px-1.5 py-0.5 rounded-md font-semibold">
                                Day {day}: +Rs. {Number(bonus).toFixed(0)}
                              </span>
                            ))}
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Checkout & QR Column */}
        <div className="lg:col-span-7 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-base font-bold text-text-primary dark:text-white">QR Checkout & Verification</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-divider-light dark:border-border-dark">
            <div className="md:col-span-5 flex flex-col items-center justify-center space-y-3">
              <div 
                onClick={() => setIsQrZoomed(true)}
                className="relative w-52 h-52 bg-white p-3 rounded-2xl border border-slate-200 shadow-md flex items-center justify-center cursor-zoom-in group hover:scale-[1.03] transition-all duration-300 ring-4 ring-primary-500/10 hover:ring-primary-500/20"
              >
                <Image 
                  src="/images/qr-code.jpeg" 
                  alt="Payment QR Code" 
                  width={190} 
                  height={190}
                  className="rounded-lg object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-2xl transition-all duration-300 flex items-center justify-center">
                  <span className="text-white bg-black/75 px-3 py-1.5 rounded-full text-xxs font-bold opacity-0 group-hover:opacity-100 transition-all duration-300 scale-90 group-hover:scale-100">
                    Click to Zoom
                  </span>
                </div>
              </div>
              <a 
                href="/images/qr-code.jpeg" 
                download="mytrust-payment-qr.jpeg"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-text-primary dark:text-white rounded-xl transition-all border border-divider-light dark:border-border-dark active:translate-y-0.5"
              >
                <Download size={14} /> Download QR Code
              </a>
            </div>
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <QrCode size={14} className="text-primary-500" /> QR Payment Instructions
              </h4>
              <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
                Scan the QR code using your EasyPaisa, JazzCash, or generic banking app to make your transaction. Click on the code to zoom in.
              </p>
              {selectedPlan ? (
                <div className="text-xs text-text-primary dark:text-white bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-900/20 p-4 rounded-xl leading-relaxed space-y-1.5">
                  <div>
                    Earning Plan: <strong className="font-semibold">{selectedPlan.name}</strong>
                  </div>
                  <div>
                    Transfer Amount: <strong className="font-extrabold text-primary-600 dark:text-primary-400 text-sm">Rs. {Number(selectedPlan.price).toFixed(2)}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-text-muted italic">Select a plan from the list above to get price details.</p>
              )}
            </div>
          </div>

          <form onSubmit={handlePurchaseSubmit} className="space-y-4">
            
            {/* Method Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Payment Channel
              </label>
              <div className="grid grid-cols-2 gap-4">
                {(['JazzCash', 'EasyPaisa'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`flex items-center justify-center gap-2 py-3 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      method === m
                        ? 'bg-primary-50/50 dark:bg-primary-950/10 border-primary-500 text-primary-600 dark:text-primary-400'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-border-light dark:border-border-dark text-text-secondary hover:bg-slate-100'
                    }`}
                  >
                    <Smartphone size={16} /> {m}
                  </button>
                ))}
              </div>
            </div>

            {/* TID */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Transaction ID (TID)
              </label>
              <input
                type="text"
                required
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-border-light dark:border-border-dark rounded-xl text-sm focus:outline-none focus:border-primary-500 text-text-primary dark:text-white"
                placeholder="12-digit transaction ID confirmation number"
              />
            </div>

            {/* Screenshot upload */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-slate-300">
                Receipt Screenshot Proof
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-light dark:border-border-dark rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-2.5 text-text-muted" />
                    <p className="text-xs text-text-secondary dark:text-slate-300 font-medium">
                      {screenshot ? screenshot.name : 'Click to upload screenshot proof'}
                    </p>
                    <p className="text-[10px] text-text-muted mt-1">PNG, JPG, WebP up to 5MB</p>
                  </div>
                  <input type="file" required className="hidden" accept="image/*" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || uploading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm transition-all active:translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {loading || uploading ? 'Uploading Receipt Details...' : 'Request Plan Activation'}
            </button>
          </form>
        </div>

        {/* History Column */}
        <div className="lg:col-span-5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-text-primary dark:text-white text-base">Plan Purchases</h3>
            <button 
              onClick={loadPurchaseHistory} 
              className="text-text-muted hover:text-text-secondary cursor-pointer"
              title="Refresh Queue"
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
                    <span className="text-xs font-bold text-text-primary dark:text-white">{item.plans?.name || 'Unknown Plan'}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      item.status === 'Approved' ? 'bg-success-100 dark:bg-success-950/20 text-success-700 dark:text-success-400' :
                      item.status === 'Pending' ? 'bg-warning-100 dark:bg-warning-950/20 text-warning-700 dark:text-warning-400' :
                      'bg-danger-100 dark:bg-danger-950/20 text-danger-700 dark:text-danger-400'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">Cost paid:</span>
                    <span className="font-bold text-text-primary dark:text-white financial-nums">Rs. {Number(item.plans?.price || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-text-muted">TID:</span>
                    <span className="font-mono text-text-secondary dark:text-slate-300 text-[10px]">{item.transaction_id}</span>
                  </div>
                  {item.remarks && (
                    <div className="text-[10px] text-text-secondary bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-divider-light dark:border-border-dark">
                      <strong>Feedback:</strong> {item.remarks}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-text-muted">
                <Layers className="mx-auto mb-2 text-text-muted" size={24} />
                <p className="text-xs">No plan purchases submitted yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QR Zoom Modal */}
      {isQrZoomed && (
        <div 
          onClick={() => setIsQrZoomed(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out animate-fadeIn"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl relative max-w-sm w-full border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center cursor-default space-y-4 animate-scaleUp"
          >
            <button 
              onClick={() => setIsQrZoomed(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-text-secondary dark:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
            <h3 className="text-sm font-bold text-center text-slate-800 dark:text-white uppercase tracking-wider">
              Scan Payment QR Code
            </h3>
            <div className="relative w-80 h-80 bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-center shadow-inner">
              <Image 
                src="/images/qr-code.jpeg" 
                alt="Payment QR Code" 
                width={290} 
                height={290}
                className="rounded-lg object-contain"
              />
            </div>
            <p className="text-center text-xxs text-text-muted">
              Scan from your mobile device to complete transaction
            </p>
            <a 
              href="/images/qr-code.jpeg" 
              download="mytrust-payment-qr.jpeg"
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-xs font-bold text-white rounded-xl transition-all active:translate-y-0.5"
            >
              <Download size={14} /> Save QR to Device
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
