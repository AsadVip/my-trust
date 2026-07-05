'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { 
  Shield, LayoutDashboard, Users, Wallet, Calendar, 
  ArrowDownCircle, ArrowUpCircle, ScrollText, Settings, 
  LogOut, Menu, X, Bell, ShieldCheck, Loader
} from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminRole, setAdminRole] = useState('Administrator');
  const [adminName, setAdminName] = useState('Admin');
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadAdminData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/admin/login');
          return;
        }

        const { data: admin, error } = await supabase
          .from('admin_users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error || !admin) {
          router.push('/login');
          return;
        }

        setAdminRole(admin.role);
        setAdminName(user.email?.split('@')[0] || 'Admin');

        // Fetch pending counts via server API (avoids RLS issues)
        try {
          const statsRes = await fetch('/api/admin/stats');
          if (statsRes.ok) {
            const statsData = await statsRes.json();
            setPendingCount((statsData.pendingPlans || 0) + (statsData.pendingWithdrawals || 0));
          }
        } catch (_) { /* silently ignore count errors */ }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadAdminData();
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  const menuItems = [
    { name: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', href: '/admin/users', icon: Users },
    { name: 'Deposit Approvals', href: '/admin/deposits', icon: ArrowDownCircle, badge: pendingCount },
    { name: 'Withdrawal Queue', href: '/admin/withdrawals', icon: ArrowUpCircle },
    { name: 'Reward Earning Settings', href: '/admin/rewards', icon: Calendar },
    { name: 'Audit Security Logs', href: '/admin/security', icon: ScrollText },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm text-slate-400">Loading admin terminal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900 text-slate-100 transition-colors duration-200">
      
      {/* Desktop Admin Sidebar (300px) */}
      <aside className="hidden md:flex flex-col w-75 bg-slate-950 border-r border-slate-800 shrink-0">
        <div className="h-18 flex items-center px-6 border-b border-slate-800 space-x-2.5 text-primary-500">
          <Shield size={22} className="stroke-[2.5px]" />
          <span className="text-white font-bold tracking-tight">Admin Portal</span>
        </div>

        <nav className="flex-grow py-6 px-4 space-y-1.5 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all group ${
                  isActive
                    ? 'bg-primary-950/30 text-primary-400 border-l-4 border-primary-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xxs font-bold bg-primary-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/80">
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <h5 className="text-xs font-semibold text-white truncate">{adminName}</h5>
              <span className="text-[10px] text-primary-400 font-medium flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} /> {adminRole}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 cursor-pointer"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-slate-950 border-b border-slate-800 shrink-0">
        <Link href="/admin/dashboard" className="flex items-center space-x-2 text-primary-500 font-bold">
          <Shield size={20} className="stroke-[2.5px]" />
          <span className="text-white text-base tracking-tight">Admin Portal</span>
        </Link>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-2 rounded-xl text-slate-400 hover:bg-slate-900 cursor-pointer"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* Mobile Sidebar Navigation */}
      {isSidebarOpen && (
        <div className="md:hidden bg-slate-950 border-b border-slate-800 p-4 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-primary-950/30 text-primary-400 border-l-4 border-primary-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon size={18} className={isActive ? 'text-primary-400' : 'text-slate-500'} />
                  <span>{item.name}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xxs font-bold bg-primary-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="h-px bg-slate-850 my-2"></div>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              handleLogout();
            }}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-400 hover:bg-red-950/20 rounded-xl text-sm font-semibold cursor-pointer text-left"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Main Workspace content */}
      <main className="flex-grow flex flex-col min-w-0 bg-slate-900 text-slate-100">
        <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>

    </div>
  );
}
