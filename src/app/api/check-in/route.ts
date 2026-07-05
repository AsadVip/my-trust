import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateCheckInStatus } from '@/lib/checkInRules';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userPlanId = searchParams.get('userPlanId');

    if (userPlanId) {
      // Query specific active plan
      const { data: userPlan, error } = await supabase
        .from('user_plans')
        .select('*, plans(*)')
        .eq('id', userPlanId)
        .eq('user_id', user.id)
        .single();

      if (error || !userPlan) {
        return NextResponse.json({ error: error?.message || 'Plan not found.' }, { status: 400 });
      }

      const lastCheckIn = userPlan.last_check_in ? new Date(userPlan.last_check_in) : null;
      const now = new Date();
      
      const { eligible, secondsRemaining } = calculateCheckInStatus(
        lastCheckIn,
        userPlan.streak_count,
        now
      );

      return NextResponse.json({
        eligible,
        secondsRemaining,
        streakCount: userPlan.streak_count,
        lastCheckIn,
        planName: userPlan.plans.name
      });
    }

    // Query all active (Approved) plans for user
    const { data: userPlans, error: plansError } = await supabase
      .from('user_plans')
      .select('*, plans(*)')
      .eq('user_id', user.id)
      .eq('status', 'Approved');

    if (plansError) {
      return NextResponse.json({ error: plansError.message }, { status: 400 });
    }

    const now = new Date();
    const plansStatus = userPlans.map((up) => {
      const lastCheckIn = up.last_check_in ? new Date(up.last_check_in) : null;
      const { eligible, secondsRemaining } = calculateCheckInStatus(
        lastCheckIn,
        up.streak_count,
        now
      );
      return {
        userPlanId: up.id,
        planName: up.plans.name,
        eligible,
        secondsRemaining,
        streakCount: up.streak_count,
        lastCheckIn,
        expiresAt: up.expires_at
      };
    });

    return NextResponse.json(plansStatus);
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

    const { userPlanId } = await request.json();
    if (!userPlanId) {
      return NextResponse.json({ error: 'Active user plan ID is required.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('perform_plan_check_in', {
      p_user_uuid: user.id,
      p_user_plan_uuid: userPlanId
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
