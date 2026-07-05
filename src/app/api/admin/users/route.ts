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

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminUser = await verifyAdmin(supabase);
    if (!adminUser) return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('profiles')
      .select('id, full_name, country, created_at');

    if (search.trim()) {
      query = query.ilike('full_name', `%${search}%`);
    }

    query = query.order('created_at', { ascending: false }).limit(100);

    const { data: profiles, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Enrich with wallet data
    const ids = (profiles || []).map((p: any) => p.id);
    let walletMap: Record<string, any> = {};
    if (ids.length > 0) {
      const { data: wallets } = await supabase
        .from('wallets')
        .select('id, available_balance, pending_balance, streak_count')
        .in('id', ids);
      if (wallets) {
        walletMap = Object.fromEntries(wallets.map((w: any) => [w.id, w]));
      }
    }

    const result = (profiles || []).map((p: any) => ({
      ...p,
      wallets: walletMap[p.id] || null,
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
