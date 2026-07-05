import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify if user's email is verified as required by PRD
    if (!user.email_confirmed_at) {
      return NextResponse.json({ error: 'Email must be verified before making a withdrawal.' }, { status: 403 });
    }

    const { amount, method, accountNumber, accountHolder } = await request.json();

    if (!amount || amount < 70) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is Rs. 70.' }, { status: 400 });
    }


    if (!method || !['JazzCash', 'EasyPaisa'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method selected.' }, { status: 400 });
    }

    if (!accountNumber || accountNumber.trim() === '') {
      return NextResponse.json({ error: 'Account number is required.' }, { status: 400 });
    }

    if (!accountHolder || accountHolder.trim() === '') {
      return NextResponse.json({ error: 'Account holder name is required.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('submit_withdrawal_request', {
      user_uuid: user.id,
      withdraw_amount: amount,
      method,
      acc_number: accountNumber.trim(),
      acc_holder: accountHolder.trim()
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
