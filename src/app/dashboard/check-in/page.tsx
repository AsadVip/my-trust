'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Calendar, Award, CheckCircle, Flame, Clock, 
  Sparkles, Loader, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

interface ActivePlanStatus {
  userPlanId: string;
  planName: string;
  eligible: boolean;
  secondsRemaining: number;
  streakCount: number;
  lastCheckIn: string | null;
  expiresAt: string | null;
}

interface CheckInHistory {
  id: string;
  check_in_time: string;
  base_reward: number;
  bonus_reward: number;
  streak_count: number;
  total_credited: number;
  campaign_ref: string | null;
}

export default function CheckInPage() {
  const [activePlans, setActivePlans] = useState<ActivePlanStatus[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [history, setHistory] = useState<CheckInHistory[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [btnLoading, setBtnLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const loadCheckInState = async (autoSelect = true) => {
    try {
      setError(null);
      const res = await fetch('/api/check-in');
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
        return;
      }

      setActivePlans(data);
      
      if (data.length > 0 && autoSelect) {
        // Find first eligible plan or default to first
        const eligiblePlan = data.find((p: ActivePlanStatus) => p.eligible);
        setSelectedPlanId(eligiblePlan ? eligiblePlan.userPlanId : data[0].userPlanId);
      }
    } catch (err) {
      console.error('Error fetching check-in state:', err);
      setError('Unable to fetch check-in details.');
    } finally {
      setLoading(false);
    }
  };

  const loadCheckInLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: historyData } = await supabase
        .from('daily_check_ins')
        .select('*')
        .eq('user_id', user.id)
        .order('check_in_time', { ascending: false })
        .limit(10);
      
      if (historyData) {
        setHistory(historyData);
      }
    } catch (err) {
      console.error('Error loading check-in logs:', err);
    }
  };

  useEffect(() => {
    loadCheckInState();
    loadCheckInLogs();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Update countdown timers dynamically for all loaded user plans
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActivePlans((prevPlans) => 
        prevPlans.map((p) => {
          if (p.secondsRemaining > 0) {
            return {
              ...p,
              secondsRemaining: p.secondsRemaining - 1,
              eligible: p.secondsRemaining <= 1 ? true : p.eligible
            };
          }
          return p;
        })
      );
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activePlans]);

  const handleCheckIn = async () => {
    if (!selectedPlanId) return;
    setBtnLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userPlanId: selectedPlanId })
      });
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        setBtnLoading(false);
        return;
      }

      // Check-in Success! Fire confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });

      // Reload state (keep selected plan focused)
      await loadCheckInState(false);
      await loadCheckInLogs();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during check-in.');
    } finally {
      setBtnLoading(false);
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activePlan = activePlans.find(p => p.userPlanId === selectedPlanId);

  // Standard Milestone levels display helper
  const milestones = [
    { day: 7, label: 'Mega' },
    { day: 15, label: 'Ultra' },
    { day: 30, label: 'Mythic' }
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted">
        <Loader className="animate-spin text-primary-500 mb-3" size={28} />
        <p className="text-sm">Configuring check-in calendars...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-divider-light dark:border-border-dark pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
          Earning Calendar
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Complete daily check-ins for your active earning plans to accumulate multipliers and claim milestone bonuses.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 dark:bg-danger-900/10 border border-danger-200 dark:border-danger-800/40 text-danger-700 dark:text-danger-400 rounded-xl text-xs sm:text-sm flex items-start gap-2">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {activePlans.length === 0 ? (
        <div className="p-8 text-center bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-2xl shadow-sm space-y-4">
          <Layers className="mx-auto text-text-muted animate-pulse" size={32} />
          <h3 className="text-base font-bold text-text-primary dark:text-white">No Active Earning Plans</h3>
          <p className="text-xs sm:text-sm text-text-muted max-w-md mx-auto">
            You must purchase and activate an earning plan before checking in. Once your plan purchase is verified, it will appear here.
          </p>
          <div className="pt-2">
            <Link 
              href="/dashboard/deposit" 
              className="inline-flex px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
            >
              Browse Earning Plans
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Main check-in panel */}
          <div className="md:col-span-7 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-8 rounded-2xl shadow-sm space-y-8 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary-400/10 rounded-full blur-3xl -z-10"></div>
            
            {/* Plan Selector tabs */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Earning Plan Selector</label>
              <div className="flex flex-wrap gap-2">
                {activePlans.map((p) => {
                  const selected = p.userPlanId === selectedPlanId;
                  return (
                    <button
                      key={p.userPlanId}
                      onClick={() => setSelectedPlanId(p.userPlanId)}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selected
                          ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-border-light dark:border-border-dark text-text-secondary hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {p.planName} {p.eligible && '✨'}
                    </button>
                  );
                })}
              </div>
            </div>

            {activePlan && (
              <>
                {/* Streak Milestones */}
                <div className="space-y-4 pt-2">
                  <h3 className="font-bold text-xs text-text-muted uppercase tracking-wider">Active Plan Streak Milestones</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {milestones.map((m) => {
                      const reached = activePlan.streakCount >= m.day;
                      return (
                        <div 
                          key={m.day} 
                          className={`p-3 border rounded-xl text-center space-y-1 transition-all ${
                            reached 
                              ? 'bg-success-50 dark:bg-success-950/20 border-success-200 dark:border-success-900/40' 
                              : 'bg-slate-50 dark:bg-slate-800/50 border-border-light dark:border-border-dark'
                          }`}
                        >
                          <Flame size={18} className={`mx-auto ${reached ? 'text-success-600 dark:text-success-400 animate-pulse' : 'text-text-disabled'}`} />
                          <p className={`text-xs font-bold ${reached ? 'text-success-700 dark:text-success-400' : 'text-text-secondary dark:text-slate-300'}`}>
                            Day {m.day}
                          </p>
                          <p className="text-[9px] text-text-muted font-medium">{m.label} Bonus</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Habit Streak Indicator */}
                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-divider-light dark:border-border-dark">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-500 flex items-center justify-center font-bold">
                      <Flame size={24} className="animate-pulse" />
                    </div>
                    <div>
                      <p className="text-xs text-text-muted font-medium">Consecutive Check-ins</p>
                      <h4 className="text-lg font-bold text-text-primary dark:text-white mt-0.5">
                        {activePlan.streakCount} Days Streak
                      </h4>
                    </div>
                  </div>
                  {activePlan.streakCount > 0 && (
                    <span className="text-[10px] bg-success-100 dark:bg-success-950/30 text-success-700 dark:text-success-400 px-3 py-1.5 rounded-full font-semibold">
                      Maintained
                    </span>
                  )}
                </div>

                {/* Checkin buttons / timers */}
                <div className="text-center space-y-4 pt-4">
                  {activePlan.eligible ? (
                    <div className="space-y-4">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/30 text-primary-600 border border-primary-200 dark:border-primary-900/20">
                        <Sparkles size={14} className="animate-spin" /> Ready to claim rewards
                      </div>
                      <button
                        onClick={handleCheckIn}
                        disabled={btnLoading}
                        className="w-full py-4 text-base font-bold bg-primary-600 hover:bg-primary-700 text-white rounded-xl shadow-lg shadow-primary-500/10 hover:shadow-primary-500/20 cursor-pointer disabled:opacity-50 transition-all select-none animate-pulse-glow"
                      >
                        {btnLoading ? 'Processing Reward...' : 'Claim Daily Reward'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 text-text-muted text-xs font-semibold">
                        <Clock size={16} /> Check-in Cooldown Timer
                      </div>
                      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary dark:text-white financial-nums py-2.5 bg-slate-50 dark:bg-slate-800/50 border border-divider-light dark:border-border-dark rounded-xl">
                        {formatTime(activePlan.secondsRemaining)}
                      </div>
                      <button
                        disabled
                        className="w-full py-4 text-base font-bold bg-slate-100 dark:bg-slate-800 text-text-muted border border-border-light dark:border-border-dark rounded-xl cursor-not-allowed select-none"
                      >
                        Check-in complete for today
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* History queue */}
          <div className="md:col-span-5 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-6 rounded-2xl shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-text-primary dark:text-white text-base">Earning Logs</h3>
              <button 
                onClick={loadCheckInLogs}
                className="text-text-muted hover:text-text-secondary cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="space-y-4">
              {history.length > 0 ? (
                history.map((log) => (
                  <div key={log.id} className="flex justify-between items-center py-2 border-b border-divider-light dark:border-divider-dark last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle size={14} className="text-success-500" />
                        <span className="text-xs font-semibold text-text-primary dark:text-white">Day {log.streak_count}</span>
                      </div>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        {new Date(log.check_in_time).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-success-600 dark:text-success-400 financial-nums">
                        +Rs. {Number(log.total_credited).toFixed(2)}
                      </span>
                      <p className="text-[9px] text-text-muted mt-0.5">
                        Bonus: Rs. {Number(log.bonus_reward).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <Calendar className="mx-auto mb-2 text-text-muted" size={24} />
                  <p className="text-xs">No check-in logs recorded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
