'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Bell, Check, Trash2, Shield, Calendar, Wallet, 
  Info, Loader, MessageSquare, AlertTriangle, RefreshCw
} from 'lucide-react';

interface AppNotification {
  id: string;
  category: 'Financial' | 'Reward' | 'Security' | 'Platform';
  title: string;
  message: string;
  status: 'Unread' | 'Read' | 'Archived';
  created_at: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'All' | 'Unread'>('All');
  
  const supabase = createClient();

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'Unread') {
        query = query.eq('status', 'Unread');
      }

      const { data } = await query;
      if (data) {
        setNotifications(data as AppNotification[]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ status: 'Read' })
        .eq('id', id);
      
      if (!error) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, status: 'Read' } : n)
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ status: 'Read' })
        .eq('user_id', user.id)
        .eq('status', 'Unread');
      
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, status: 'Read' as const })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Security':
        return <Shield className="text-danger-500" size={18} />;
      case 'Reward':
        return <Calendar className="text-success-500" size={18} />;
      case 'Financial':
        return <Wallet className="text-primary-500" size={18} />;
      default:
        return <Info className="text-accent-500" size={18} />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Security':
        return 'bg-danger-50 dark:bg-danger-950/20 border-danger-200 text-danger-700 dark:text-danger-400';
      case 'Reward':
        return 'bg-success-50 dark:bg-success-950/20 border-success-200 text-success-700 dark:text-success-400';
      case 'Financial':
        return 'bg-primary-50 dark:bg-primary-950/20 border-primary-200 text-primary-700 dark:text-primary-400';
      default:
        return 'bg-slate-50 dark:bg-slate-800 border-border-light text-text-secondary dark:text-slate-300';
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-divider-light dark:border-border-dark pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary dark:text-white">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Stay updated with wallet alerts, check-in confirmations, security notices, and platform updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-4 py-2.5 text-xs font-semibold bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 transition-all cursor-pointer"
            >
              <Check size={14} /> Mark All as Read
            </button>
          )}
          <button 
            onClick={loadNotifications}
            className="p-2 border border-border-light dark:border-border-dark text-text-muted hover:text-text-secondary rounded-xl hover:bg-slate-50 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-divider-light dark:border-border-dark gap-6">
        {(['All', 'Unread'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-4 text-sm font-semibold relative transition-all cursor-pointer ${
              activeTab === tab 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab}
            {tab === 'Unread' && unreadCount > 0 && (
              <span className="ml-1.5 px-2 py-0.5 text-xxs bg-primary-600 text-white rounded-full">
                {unreadCount}
              </span>
            )}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 rounded-full animate-slideRight"></span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-muted">
          <Loader className="animate-spin text-primary-500 mb-3" size={24} />
          <p className="text-xs">Fetching alerts...</p>
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-4">
          {notifications.map((item) => (
            <div 
              key={item.id} 
              className={`p-6 border rounded-2xl shadow-sm flex gap-4 transition-all duration-200 ${
                item.status === 'Unread' 
                  ? 'bg-surface-light dark:bg-surface-dark border-primary-200 dark:border-primary-900/40 relative' 
                  : 'bg-surface-light dark:bg-surface-dark border-border-light dark:border-border-dark opacity-80'
              }`}
            >
              {/* Unread Left indicator */}
              {item.status === 'Unread' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600 rounded-l-2xl"></div>
              )}

              {/* Category Icon */}
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${getCategoryColor(item.category)}`}>
                {getCategoryIcon(item.category)}
              </div>

              {/* Content */}
              <div className="flex-grow space-y-1 min-w-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <h4 className={`text-sm sm:text-base text-text-primary dark:text-white truncate ${
                    item.status === 'Unread' ? 'font-bold' : 'font-semibold'
                  }`}>
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-text-muted">
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary dark:text-slate-300 leading-relaxed pr-8">
                  {item.message}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col justify-between shrink-0">
                {item.status === 'Unread' ? (
                  <button
                    onClick={() => handleMarkAsRead(item.id)}
                    className="p-1.5 text-text-muted hover:text-success-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check size={16} />
                  </button>
                ) : (
                  <div></div>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-1.5 text-text-muted hover:text-danger-500 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  title="Delete Alert"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-border-light dark:border-border-dark rounded-2xl bg-surface-light dark:bg-surface-dark">
          <Bell className="mx-auto text-text-muted mb-2 animate-bounce" size={28} />
          <h4 className="font-semibold text-text-primary dark:text-white mb-1">You&apos;re all caught up!</h4>
          <p className="text-xs text-text-muted">No notifications matching this filter.</p>
        </div>
      )}
    </div>
  );
}
