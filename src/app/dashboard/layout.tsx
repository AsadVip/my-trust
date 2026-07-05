'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  LayoutDashboard, Calendar, Wallet, ArrowDownCircle, ArrowUpCircle, 
  Bell, User, Settings, LogOut, ShieldCheck, Menu, X, ShieldAlert
} from 'lucide-react';

interface Profile {
  full_name: string;
  avatar_url: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadUserData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        setEmailConfirmed(!!user.email_confirmed_at);

        // Load profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single();
        
        if (profileData) {
          setProfile(profileData);
        }

        // Load unread notifications
        const { count } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'Unread');
        
        setUnreadCount(count || 0);
      } catch (err) {
        console.error('Error loading dashboard user data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadUserData();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Daily Check-in', href: '/dashboard/check-in', icon: Calendar },
    { name: 'Wallet Ledger', href: '/dashboard/wallet', icon: Wallet },
    { name: 'Deposit Funds', href: '/dashboard/deposit', icon: ArrowDownCircle },
    { name: 'Withdraw Payout', href: '/dashboard/withdraw', icon: ArrowUpCircle },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, count: unreadCount },
    { name: 'Profile Management', href: '/dashboard/profile', icon: User },
    { name: 'System Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-text-muted">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg-light dark:bg-bg-dark text-text-primary transition-colors duration-200">
      
      {/* Desktop Sidebar (Persistent 280px) */}
      <aside className="hidden md:flex flex-col w-70 bg-surface-light dark:bg-surface-dark border-r border-border-light dark:border-border-dark shrink-0">
        {/* Sidebar Header Logo */}
        <div className="h-18 flex items-center px-6 border-b border-divider-light dark:border-border-dark">
          <Link href="/dashboard" className="flex items-center space-x-2 text-primary-600 dark:text-primary-400 font-bold">
            <LayoutDashboard size={22} className="stroke-[2.5px]" />
            <span className="text-text-primary dark:text-white tracking-tight">My Trust</span>
          </Link>
        </div>

        {/* Sidebar Middle Navigation */}
        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                    : 'text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted group-hover:text-text-secondary'} />
                  <span>{item.name}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xxs font-bold bg-primary-600 text-white rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer Account */}
        <div className="p-4 border-t border-divider-light dark:border-border-dark bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center space-x-3 px-2 py-1">
            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm shrink-0 uppercase border border-primary-200 dark:border-primary-800">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-grow">
              <h5 className="text-xs font-semibold text-text-primary dark:text-white truncate">
                {profile?.full_name || 'User'}
              </h5>
              <div className="flex items-center gap-1 mt-0.5">
                {emailConfirmed ? (
                  <span className="text-[10px] text-success-600 dark:text-success-400 font-medium flex items-center gap-0.5">
                    <ShieldCheck size={10} /> Verified
                  </span>
                ) : (
                  <span className="text-[10px] text-danger-600 dark:text-danger-400 font-medium flex items-center gap-0.5">
                    <ShieldAlert size={10} /> Unverified
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-text-muted hover:text-danger-500 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/20 transition-all cursor-pointer"
              title="Log Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark shrink-0">
        <Link href="/dashboard" className="flex items-center space-x-1.5 text-primary-600 dark:text-primary-400 font-bold">
          <LayoutDashboard size={20} className="stroke-[2.5px]" />
          <span className="text-text-primary dark:text-white text-base tracking-tight">My Trust</span>
        </Link>

        <div className="flex items-center space-x-2">
          {/* Notifications link */}
          <Link
            href="/dashboard/notifications"
            className="p-2 rounded-xl text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 relative cursor-pointer"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-600 rounded-full"></span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Collapsible Navigation Menu */}
      {isSidebarOpen && (
        <div className="md:hidden bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 border-l-4 border-primary-600'
                    : 'text-text-secondary hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'} />
                  <span>{item.name}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-2 py-0.5 text-xxs font-bold bg-primary-600 text-white rounded-full">
                    {item.count}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="h-px bg-divider-light dark:bg-divider-dark my-2"></div>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/10 rounded-xl text-sm font-medium cursor-pointer text-left"
          >
            <LogOut size={18} />
            <span>Log Out</span>
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <main className="flex-grow flex flex-col min-w-0">
        {/* Content Body */}
        <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar (5-button max) */}
      <nav className="md:hidden sticky bottom-0 z-40 bg-surface-light dark:bg-surface-dark border-t border-border-light dark:border-border-dark flex items-center justify-around h-16 py-1 select-none">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            pathname === '/dashboard' ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'
          }`}
        >
          <LayoutDashboard size={18} />
          <span className="text-[10px] mt-0.5 font-medium">Home</span>
        </Link>
        <Link
          href="/dashboard/check-in"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            pathname === '/dashboard/check-in' ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'
          }`}
        >
          <Calendar size={18} />
          <span className="text-[10px] mt-0.5 font-medium">Check-in</span>
        </Link>
        <Link
          href="/dashboard/wallet"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            pathname === '/dashboard/wallet' ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'
          }`}
        >
          <Wallet size={18} />
          <span className="text-[10px] mt-0.5 font-medium">Wallet</span>
        </Link>
        <Link
          href="/dashboard/notifications"
          className={`flex flex-col items-center justify-center w-14 h-full relative ${
            pathname === '/dashboard/notifications' ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'
          }`}
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-3.5 w-1.5 h-1.5 bg-primary-600 rounded-full"></span>
          )}
          <span className="text-[10px] mt-0.5 font-medium">Inbox</span>
        </Link>
        <Link
          href="/dashboard/profile"
          className={`flex flex-col items-center justify-center w-14 h-full ${
            pathname === '/dashboard/profile' ? 'text-primary-600 dark:text-primary-400' : 'text-text-muted'
          }`}
        >
          <User size={18} />
          <span className="text-[10px] mt-0.5 font-medium">Profile</span>
        </Link>
      </nav>

    </div>
  );
}
