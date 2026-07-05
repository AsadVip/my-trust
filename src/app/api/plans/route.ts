import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: plans, error } = await supabase
      .from('plans')
      .select('*')
      .order('price', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(plans);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// Admin only: create/modify plan definitions
export async function POST(request: Request) {
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
      .maybeSingle();

    if (!admin) {
      return NextResponse.json({ error: 'Access Denied. Admin privileges required.' }, { status: 403 });
    }

    const { id, name, price, duration_days, base_reward, streak_bonus, milestones } = await request.json();

    if (!name || price < 0 || duration_days <= 0 || base_reward < 0 || streak_bonus < 0) {
      return NextResponse.json({ error: 'Invalid plan parameters.' }, { status: 400 });
    }

    let result;
    if (id) {
      // Update
      const { data, error } = await supabase
        .from('plans')
        .update({
          name,
          price,
          duration_days,
          base_reward,
          streak_bonus,
          milestones: milestones || {},
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // Create
      const { data, error } = await supabase
        .from('plans')
        .insert({
          name,
          price,
          duration_days,
          base_reward,
          streak_bonus,
          milestones: milestones || {}
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({ success: true, plan: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
