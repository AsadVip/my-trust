'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Save, CheckCircle, AlertCircle, Loader, 
  Layers, Edit3, Sparkles, RefreshCw, X
} from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  base_reward: number;
  streak_bonus: number;
  milestones: Record<string, number>;
}

export default function AdminPlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('1000.00');
  const [duration, setDuration] = useState('30');
  const [baseReward, setBaseReward] = useState('15.00');
  const [streakBonus, setStreakBonus] = useState('1.00');
  const [milestone7, setMilestone7] = useState('10.00');
  const [milestone15, setMilestone15] = useState('25.00');
  const [milestone30, setMilestone30] = useState('60.00');

  const formRef = useRef<HTMLDivElement>(null);

  const loadPlansList = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setPlans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError('Unable to load plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPlansList(); }, []);

  const handleEditClick = (p: Plan) => {
    setEditId(p.id);
    setEditName(p.name);
    setName(p.name);
    setPrice(Number(p.price).toFixed(2));
    setDuration(p.duration_days.toString());
    setBaseReward(Number(p.base_reward).toFixed(2));
    setStreakBonus(Number(p.streak_bonus).toFixed(2));
    setMilestone7(Number(p.milestones?.['7'] || 0).toFixed(2));
    setMilestone15(Number(p.milestones?.['15'] || 0).toFixed(2));
    setMilestone30(Number(p.milestones?.['30'] || 0).toFixed(2));
    setError(null);
    setSuccess(null);
    // Scroll the editor panel into view
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleResetForm = () => {
    setEditId(null);
    setEditName('');
    setName('');
    setPrice('1000.00');
    setDuration('30');
    setBaseReward('15.00');
    setStreakBonus('1.00');
    setMilestone7('10.00');
    setMilestone15('25.00');
    setMilestone30('60.00');
    setError(null);
    setSuccess(null);
  };

  const handleSavePlanConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setBtnLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const milestonesObj = {
        '7': parseFloat(milestone7) || 0,
        '15': parseFloat(milestone15) || 0,
        '30': parseFloat(milestone30) || 0,
      };

      const planData = {
        id: editId || undefined,
        name: name.trim(),
        price: parseFloat(price),
        duration_days: parseInt(duration),
        base_reward: parseFloat(baseReward),
        streak_bonus: parseFloat(streakBonus),
        milestones: milestonesObj,
      };

      const res = await fetch('/api/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(planData),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Failed to save plan.');
        setBtnLoading(false);
        return;
      }

      setSuccess(editId ? `"${name}" updated successfully!` : `"${name}" plan created!`);
      handleResetForm();
      loadPlansList();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setBtnLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Fetching platform plans database...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Earning Plans Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create, update, and audit investment packages and their dynamic daily check-in rewards.
          </p>
        </div>
        <button 
          onClick={loadPlansList}
          className="p-2.5 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer"
          title="Refresh List"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="p-4 bg-red-950/20 border border-red-800/40 text-red-400 rounded-xl text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      {success && (
        <div className="p-5 bg-success-950/20 border border-success-900/40 text-success-400 rounded-xl flex items-start gap-3">
          <CheckCircle className="shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="font-bold text-sm">Plan Saved!</h4>
            <p className="text-xs text-slate-300 mt-1">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)} className="ml-auto shrink-0 cursor-pointer"><X size={14} /></button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── Editor Form Panel ── */}
        <div
          ref={formRef}
          className={`lg:col-span-5 bg-slate-950 rounded-2xl shadow-sm space-y-6 border transition-all duration-300 p-8 ${
            editId
              ? 'border-primary-600 ring-2 ring-primary-600/20'
              : 'border-slate-800'
          }`}
        >
          {/* Edit mode banner */}
          {editId && (
            <div className="flex items-center justify-between px-4 py-2.5 bg-primary-950/30 border border-primary-800/40 rounded-xl">
              <div className="flex items-center gap-2">
                <Edit3 className="text-primary-400" size={14} />
                <span className="text-xs font-semibold text-primary-300">
                  Editing: <span className="text-white">{editName}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetForm}
                className="text-slate-500 hover:text-white cursor-pointer"
                title="Cancel edit"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <h3 className="font-bold text-white text-base flex items-center gap-2">
            {editId ? (
              <><Edit3 className="text-primary-400" size={18} /> Edit Earning Plan</>
            ) : (
              <><Plus className="text-primary-500" size={18} /> Create Earning Plan</>
            )}
          </h3>

          <form onSubmit={handleSavePlanConfig} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Plan Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Platinum Starter"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-primary-500 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Price (PKR)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Duration (Days)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Base Reward/Day (Rs.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min={0}
                  value={baseReward}
                  onChange={(e) => setBaseReward(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Streak Bonus/Day (Rs.)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min={0}
                  value={streakBonus}
                  onChange={(e) => setStreakBonus(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-primary-500 text-white"
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="border-t border-slate-800 pt-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-warning-400" />
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Milestone Bonus Rewards (Rs.)</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Day 7 Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={milestone7}
                    onChange={(e) => setMilestone7(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xxs focus:outline-none focus:border-primary-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Day 15 Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={milestone15}
                    onChange={(e) => setMilestone15(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xxs focus:outline-none focus:border-primary-500 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-400">Day 30 Bonus</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={milestone30}
                    onChange={(e) => setMilestone30(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xxs focus:outline-none focus:border-primary-500 text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {editId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex-1 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <X size={13} /> Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={btnLoading}
                className={`flex-1 py-2.5 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 ${
                  editId
                    ? 'bg-primary-600 hover:bg-primary-500'
                    : 'bg-success-700 hover:bg-success-600'
                }`}
              >
                {btnLoading ? (
                  <><Loader className="animate-spin" size={13} /> Saving...</>
                ) : editId ? (
                  <><Save size={13} /> Update Plan</>
                ) : (
                  <><Plus size={13} /> Add New Plan</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* ── Existing Plans List ── */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 p-6 rounded-2xl shadow-sm space-y-5">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Layers className="text-primary-500" size={18} /> Active Packages List
          </h3>

          <div className="space-y-4">
            {plans.length > 0 ? (
              plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-5 border rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all duration-200 ${
                    editId === p.id
                      ? 'border-primary-600 bg-primary-950/10'
                      : 'border-slate-800 bg-slate-900/10 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{p.name}</h4>
                      {editId === p.id && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-primary-800/40 text-primary-300 px-1.5 py-0.5 rounded-full">
                          Editing
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{p.duration_days} Days Active Lifespan</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xxs text-slate-400">
                      <span>Base: <strong className="text-white">Rs. {Number(p.base_reward).toFixed(2)}/day</strong></span>
                      <span>Streak: <strong className="text-white">+Rs. {Number(p.streak_bonus).toFixed(2)}</strong></span>
                      <span>Day 7: <strong className="text-warning-300">Rs. {Number(p.milestones?.['7'] || 0).toFixed(0)}</strong></span>
                      <span>Day 15: <strong className="text-warning-300">Rs. {Number(p.milestones?.['15'] || 0).toFixed(0)}</strong></span>
                      <span>Day 30: <strong className="text-warning-300">Rs. {Number(p.milestones?.['30'] || 0).toFixed(0)}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                    <span className="text-base font-bold text-success-400 financial-nums">Rs. {Number(p.price).toFixed(0)}</span>
                    <button
                      onClick={() => handleEditClick(p)}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-semibold cursor-pointer flex items-center gap-1.5 transition-all ${
                        editId === p.id
                          ? 'bg-primary-600 text-white border border-primary-500'
                          : 'bg-slate-900 border border-slate-800 hover:bg-primary-900/30 hover:border-primary-700 hover:text-primary-300 text-slate-400'
                      }`}
                    >
                      <Edit3 size={11} />
                      {editId === p.id ? 'Currently Editing' : 'Modify Plan'}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 text-slate-500">
                <Layers className="mx-auto mb-2 text-slate-600" size={24} />
                <p className="text-xs font-semibold text-white mb-1">No plans configured</p>
                <p className="text-xs">Use the form to create your first earning plan.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
