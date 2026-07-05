import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function verifyAdmin(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  const { data: admin } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return admin ? user : null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const user = await verifyAdmin(supabase);
    if (!user) return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });

    const [
      { count: totalUsers },
      { count: pendingDeposits },
      { count: pendingWithdrawals },
      { count: pendingPlans },
      { data: wallets },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('deposits').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('withdrawals').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('user_plans').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      supabase.from('wallets').select('available_balance, lifetime_earnings'),
    ]);

    let totalLiability = 0;
    let totalRewardsDistributed = 0;
    (wallets || []).forEach((w: any) => {
      totalLiability += Number(w.available_balance);
      totalRewardsDistributed += Number(w.lifetime_earnings);
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      pendingDeposits: pendingDeposits || 0,
      pendingWithdrawals: pendingWithdrawals || 0,
      pendingPlans: pendingPlans || 0,
      totalLiability,
      totalRewardsDistributed,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
