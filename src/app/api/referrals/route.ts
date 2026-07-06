import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch users referred by this user
    const { data: referrals, error: referralsError } = await supabase
      .from('profiles')
      .select('id, full_name, created_at')
      .eq('referred_by', user.id);

    if (referralsError) {
      return NextResponse.json({ error: referralsError.message }, { status: 400 });
    }

    // For each referred user, check if they have active/approved plans
    const referralData = [];
    for (const ref of referrals || []) {
      const { count: planCount } = await supabase
        .from('user_plans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', ref.id)
        .eq('status', 'Approved');

      referralData.push({
        id: ref.id,
        full_name: ref.full_name,
        created_at: ref.created_at,
        has_plan: (planCount || 0) > 0
      });
    }

    // Fetch transactions for promotional bonuses to calculate total commissions
    const { data: transactions, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'Promotional Bonus')
      .order('created_at', { ascending: false });

    if (txError) {
      return NextResponse.json({ error: txError.message }, { status: 400 });
    }

    const totalCommission = (transactions || []).reduce((acc: number, tx: any) => acc + Number(tx.amount), 0);

    return NextResponse.json({
      referrals: referralData,
      totalCommission,
      transactions: transactions || []
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
