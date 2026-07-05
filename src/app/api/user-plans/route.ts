import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adminQuery = searchParams.get('admin') === 'true';
    const statusQuery = searchParams.get('status');

    if (adminQuery) {
      // Admin verification
      const { data: admin, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      
      if (adminCheckError || !admin) {
        return NextResponse.json({ error: 'Access Denied. Admin privileges required.' }, { status: 403 });
      }

      // Admin: fetch all user_plans with plan + profile name joined
      let query = supabase
        .from('user_plans')
        .select('*, plans(*)');

      if (statusQuery) {
        query = query.eq('status', statusQuery);
      }
      query = query.order('created_at', { ascending: false });

      const { data: purchasesRaw, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      // Enrich with profile names in a second pass
      const userIds = [...new Set((purchasesRaw || []).map((p: any) => p.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profileRows } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        if (profileRows) {
          profileMap = Object.fromEntries(profileRows.map((p: any) => [p.id, p.full_name]));
        }
      }

      const data = (purchasesRaw || []).map((p: any) => ({
        ...p,
        profiles: { full_name: profileMap[p.user_id] || 'Unknown User' }
      }));

      return NextResponse.json(data);
    } else {
      // Normal user query — their own plans only
      const { data, error } = await supabase
        .from('user_plans')
        .select('*, plans(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
      return NextResponse.json(data);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, transactionId, screenshotUrl } = await request.json();

    if (!planId) {
      return NextResponse.json({ error: 'Earning plan choice is required.' }, { status: 400 });
    }
    if (!transactionId || transactionId.trim() === '') {
      return NextResponse.json({ error: 'Transaction ID (TID) is required.' }, { status: 400 });
    }
    if (!screenshotUrl || screenshotUrl.trim() === '') {
      return NextResponse.json({ error: 'Screenshot proof of payment is required.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('purchase_plan_request', {
      p_user_uuid: user.id,
      p_plan_uuid: planId,
      p_tid: transactionId.trim(),
      p_screenshot: screenshotUrl
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Admin approve or reject plan requests
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: admin } = await supabase
      .from('admin_users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Access Denied.' }, { status: 403 });
    }

    const { purchaseId, action, remarks } = await request.json();

    if (!purchaseId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid parameters provided.' }, { status: 400 });
    }

    if (action === 'approve') {
      const { data, error } = await supabase.rpc('admin_approve_plan_purchase', {
        p_purchase_uuid: purchaseId,
        p_reviewer_uuid: user.id
      });
      if (error) throw error;
      return NextResponse.json({ success: true, approved: data });
    } else {
      const { data, error } = await supabase.rpc('admin_reject_plan_purchase', {
        p_purchase_uuid: purchaseId,
        p_remarks: remarks || 'Declined by Administrator.',
        p_reviewer_uuid: user.id
      });
      if (error) throw error;
      return NextResponse.json({ success: true, rejected: data });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
