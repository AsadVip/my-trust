import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, method, transactionId, screenshotUrl } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Deposit amount must be greater than zero.' }, { status: 400 });
    }

    if (!method || !['JazzCash', 'EasyPaisa'].includes(method)) {
      return NextResponse.json({ error: 'Invalid payment method selected.' }, { status: 400 });
    }

    if (!transactionId || transactionId.trim() === '') {
      return NextResponse.json({ error: 'Transaction ID (TID) is required.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('submit_deposit_request', {
      user_uuid: user.id,
      deposit_amount: amount,
      method,
      tid: transactionId.trim(),
      screenshot: screenshotUrl || null
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
