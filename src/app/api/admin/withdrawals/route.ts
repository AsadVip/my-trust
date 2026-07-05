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

// GET: List withdrawals (with user names)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const adminUser = await verifyAdmin(supabase);
    if (!adminUser) return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';

    let query = supabase
      .from('withdrawals')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }
    if (search.trim()) {
      query = query.ilike('account_number', `%${search}%`);
    }

    const { data: withdrawals, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Enrich with profile names
    const userIds = [...new Set((withdrawals || []).map((w: any) => w.user_id))];
    let profileMap: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      if (profiles) {
        profileMap = Object.fromEntries(profiles.map((p: any) => [p.id, p.full_name]));
      }
    }

    const result = (withdrawals || []).map((w: any) => ({
      ...w,
      profiles: { id: w.user_id, full_name: profileMap[w.user_id] || 'Unknown User' },
    }));

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Approve or reject a withdrawal
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const adminUser = await verifyAdmin(supabase);
    if (!adminUser) return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });

    const { withdrawalId, action, remarks } = await request.json();
    if (!withdrawalId || !action || !['complete', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters.' }, { status: 400 });
    }

    const rpcName = action === 'complete' ? 'admin_complete_withdrawal' : 'admin_reject_withdrawal';
    const { data, error } = await supabase.rpc(rpcName, {
      withdrawal_uuid: withdrawalId,
      reviewer_uuid: adminUser.id,
      admin_remarks: remarks || '',
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
