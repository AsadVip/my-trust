-- INIT SCHEMA FOR MY TRUST PLATFORM

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number TEXT,
    country TEXT,
    timezone TEXT,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    notifications_pref JSONB DEFAULT '{"email": true, "rewards": true, "deposits": true, "withdrawals": true, "announcements": true}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. WALLETS TABLE
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    available_balance NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (available_balance >= 0),
    pending_balance NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (pending_balance >= 0),
    lifetime_earnings NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (lifetime_earnings >= 0),
    total_deposits NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (total_deposits >= 0),
    total_withdrawals NUMERIC(12,2) DEFAULT 0.00 NOT NULL CHECK (total_withdrawals >= 0),
    streak_count INTEGER DEFAULT 0 NOT NULL CHECK (streak_count >= 0),
    last_check_in TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. DAILY CHECK-INS TABLE
CREATE TABLE IF NOT EXISTS public.daily_check_ins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    base_reward NUMERIC(12,2) NOT NULL CHECK (base_reward >= 0),
    bonus_reward NUMERIC(12,2) NOT NULL CHECK (bonus_reward >= 0),
    streak_count INTEGER NOT NULL CHECK (streak_count >= 0),
    total_credited NUMERIC(12,2) NOT NULL CHECK (total_credited >= 0),
    campaign_ref TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. DEPOSITS TABLE
CREATE TABLE IF NOT EXISTS public.deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('JazzCash', 'EasyPaisa')),
    transaction_id TEXT NOT NULL UNIQUE,
    screenshot_url TEXT,
    status TEXT DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Expired', 'Cancelled')),
    remarks TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. WITHDRAWALS TABLE
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12,2) NOT NULL CHECK (amount >= 100.00),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('JazzCash', 'EasyPaisa')),
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Processing', 'Completed', 'Rejected', 'Cancelled')),
    remarks TEXT,
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TRANSACTIONS TABLE (LEDGER)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('Daily Reward', 'Streak Bonus', 'Promotional Bonus', 'Deposit', 'Deposit Reversal', 'Withdrawal', 'Withdrawal Reversal', 'Admin Adjustment', 'Refund', 'Penalty')),
    amount NUMERIC(12,2) NOT NULL, -- Positive for credit, Negative for debit
    balance_before NUMERIC(12,2) NOT NULL CHECK (balance_before >= 0),
    balance_after NUMERIC(12,2) NOT NULL CHECK (balance_after >= 0),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed', 'Failed', 'Cancelled')),
    related_entity_type TEXT,
    related_entity_id UUID,
    admin_ref TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Financial', 'Reward', 'Security', 'Platform')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Unread' NOT NULL CHECK (status IN ('Unread', 'Read', 'Archived', 'Deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ADMIN USERS TABLE
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'Administrator' NOT NULL CHECK (role IN ('Super Administrator', 'Finance Manager', 'Content Manager', 'Administrator')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    ip_address TEXT,
    device_metadata TEXT,
    status TEXT NOT NULL CHECK (status IN ('Success', 'Failure')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. SUPPORT TICKETS & MESSAGES
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'Open' NOT NULL CHECK (status IN ('Open', 'Pending', 'Resolved', 'Closed', 'Escalated')),
    priority TEXT DEFAULT 'Normal' NOT NULL CHECK (priority IN ('Low', 'Normal', 'High', 'Critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. FAQ & CMS PAGES
CREATE TABLE IF NOT EXISTS public.faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    order_index INTEGER DEFAULT 0 NOT NULL,
    is_visible BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cms_pages (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'Draft' NOT NULL CHECK (status IN ('Draft', 'Published')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- SYSTEM TRIGGERS & FUNCTIONS
-- ----------------------------------------------------

-- Function to update updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply timestamp triggers
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_wallets_timestamp BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_deposits_timestamp BEFORE UPDATE ON public.deposits FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_withdrawals_timestamp BEFORE UPDATE ON public.withdrawals FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_support_tickets_timestamp BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_cms_pages_timestamp BEFORE UPDATE ON public.cms_pages FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- Trigger function to automatically create profile and wallet records upon user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
BEGIN
    default_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    INSERT INTO public.profiles (id, full_name, timezone, theme)
    VALUES (new.id, default_name, 'UTC', 'system');
    
    INSERT INTO public.wallets (id)
    VALUES (new.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper check if user is an administrator
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- SECURITY DEFINER TRANSACTION HANDLERS
-- ----------------------------------------------------

-- Daily Check-in atomic logic
CREATE OR REPLACE FUNCTION public.perform_daily_check_in(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_base_reward NUMERIC(12,2) := 10.00; -- Configurable fallback
    v_streak_bonus NUMERIC(12,2) := 2.00;  -- Configurable fallback (per day of streak)
    v_streak_multiplier INTEGER := 1;
    v_next_streak INTEGER := 1;
    v_total_earned NUMERIC(12,2);
    v_bonus_earned NUMERIC(12,2) := 0.00;
    v_time_diff INTERVAL;
    v_result JSONB;
BEGIN
    -- Auth Guard: ensure executing user is checking in for themselves OR is an admin override
    IF auth.uid() <> user_uuid AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized check-in operation.';
    END IF;

    -- Lock the wallet row to prevent concurrent adjustments
    SELECT * INTO v_wallet FROM public.wallets WHERE id = user_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet record not found.';
    END IF;

    -- Calculate time since last check-in
    IF v_wallet.last_check_in IS NOT NULL THEN
        v_time_diff := now() - v_wallet.last_check_in;
        
        -- Enforce 24 hour rule
        IF v_time_diff < INTERVAL '24 hours' THEN
            RAISE EXCEPTION 'You can check in only once every 24 hours. Remaining time: %', (INTERVAL '24 hours' - v_time_diff);
        END IF;
        
        -- Streak maintenance check: if last check in was within 48 hours, advance streak. Otherwise reset it.
        IF v_time_diff <= INTERVAL '48 hours' THEN
            v_next_streak := v_wallet.streak_count + 1;
        ELSE
            v_next_streak := 1;
        END IF;
    ELSE
        v_next_streak := 1;
    END IF;

    -- Load rewards from settings if available
    SELECT COALESCE((value->>'base_reward')::NUMERIC, v_base_reward),
           COALESCE((value->>'streak_bonus')::NUMERIC, v_streak_bonus)
    INTO v_base_reward, v_streak_bonus
    FROM public.platform_settings
    WHERE key = 'rewards';

    -- Streak Bonus Calculations
    v_bonus_earned := (v_next_streak - 1) * v_streak_bonus;
    
    -- Milestone bonuses (Day 7 -> 20.00, Day 30 -> 100.00 etc)
    IF v_next_streak = 7 THEN
        v_bonus_earned := v_bonus_earned + 20.00;
    ELSIF v_next_streak = 15 THEN
        v_bonus_earned := v_bonus_earned + 50.00;
    ELSIF v_next_streak = 30 THEN
        v_bonus_earned := v_bonus_earned + 150.00;
    END IF;

    v_total_earned := v_base_reward + v_bonus_earned;

    -- Update wallet state
    UPDATE public.wallets
    SET available_balance = available_balance + v_total_earned,
        lifetime_earnings = lifetime_earnings + v_total_earned,
        streak_count = v_next_streak,
        last_check_in = now(),
        updated_at = now()
    WHERE id = user_uuid;

    -- Record check-in event
    INSERT INTO public.daily_check_ins (user_id, check_in_time, base_reward, bonus_reward, streak_count, total_credited)
    VALUES (user_uuid, now(), v_base_reward, v_bonus_earned, v_next_streak, v_total_earned);

    -- Log transaction in ledger
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id)
    VALUES (
        user_uuid, 
        'Daily Reward', 
        v_total_earned, 
        v_wallet.available_balance, 
        v_wallet.available_balance + v_total_earned, 
        'Completed', 
        'daily_check_ins', 
        (SELECT id FROM public.daily_check_ins WHERE user_id = user_uuid ORDER BY check_in_time DESC LIMIT 1)
    );

    -- Dispatch notification
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        user_uuid,
        'Reward',
        'Daily Reward Credited',
        format('Successfully checked in! Credited +%s rewards. Streak count is now %s.', v_total_earned::TEXT, v_next_streak::TEXT)
    );

    v_result := jsonb_build_object(
        'success', true,
        'credited_amount', v_total_earned,
        'streak_count', v_next_streak,
        'available_balance', v_wallet.available_balance + v_total_earned
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit deposit request
CREATE OR REPLACE FUNCTION public.submit_deposit_request(
    user_uuid UUID,
    deposit_amount NUMERIC,
    method TEXT,
    tid TEXT,
    screenshot TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_exists BOOLEAN;
    v_deposit_id UUID;
BEGIN
    -- Auth check
    IF auth.uid() <> user_uuid THEN
        RAISE EXCEPTION 'Unauthorized deposit operation.';
    END IF;

    -- Check unique TID
    SELECT EXISTS (
        SELECT 1 FROM public.deposits WHERE lower(transaction_id) = lower(tid)
    ) INTO v_exists;

    IF v_exists THEN
        RAISE EXCEPTION 'This Transaction ID (TID) has already been submitted.';
    END IF;

    -- Insert pending deposit
    INSERT INTO public.deposits (user_id, amount, payment_method, transaction_id, screenshot_url, status)
    VALUES (user_uuid, deposit_amount, method, tid, screenshot, 'Pending')
    RETURNING id INTO v_deposit_id;

    -- Send initial submission notification
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        user_uuid,
        'Financial',
        'Deposit Submitted',
        format('Your deposit request of %s via %s is pending admin verification.', deposit_amount::TEXT, method)
    );

    RETURN jsonb_build_object(
        'success', true,
        'deposit_id', v_deposit_id,
        'status', 'Pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Submit withdrawal request
CREATE OR REPLACE FUNCTION public.submit_withdrawal_request(
    user_uuid UUID,
    withdraw_amount NUMERIC,
    method TEXT,
    acc_number TEXT,
    acc_holder TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_wallet RECORD;
    v_withdrawal_id UUID;
BEGIN
    -- Auth check
    IF auth.uid() <> user_uuid THEN
        RAISE EXCEPTION 'Unauthorized withdrawal operation.';
    END IF;

    -- Validate balance & lock
    SELECT * INTO v_wallet FROM public.wallets WHERE id = user_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet record not found.';
    END IF;

    IF v_wallet.available_balance < withdraw_amount THEN
        RAISE EXCEPTION 'Insufficient available balance. Required: %, Available: %', withdraw_amount, v_wallet.available_balance;
    END IF;

    -- Deduct from available, add to pending
    UPDATE public.wallets
    SET available_balance = available_balance - withdraw_amount,
        pending_balance = pending_balance + withdraw_amount
    WHERE id = user_uuid;

    -- Create withdrawal record
    INSERT INTO public.withdrawals (user_id, amount, payment_method, account_number, account_holder, status)
    VALUES (user_uuid, withdraw_amount, method, acc_number, acc_holder, 'Pending')
    RETURNING id INTO v_withdrawal_id;

    -- Create ledger pending transaction
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id)
    VALUES (
        user_uuid,
        'Withdrawal',
        -withdraw_amount,
        v_wallet.available_balance,
        v_wallet.available_balance - withdraw_amount,
        'Pending',
        'withdrawals',
        v_withdrawal_id
    );

    -- Send notification
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        user_uuid,
        'Financial',
        'Withdrawal Request Received',
        format('Successfully locked %s. Payout to account %s (%s) is processing.', withdraw_amount::TEXT, acc_number, method)
    );

    RETURN jsonb_build_object(
        'success', true,
        'withdrawal_id', v_withdrawal_id,
        'status', 'Pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Approve Deposit
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(
    deposit_uuid UUID,
    reviewer_uuid UUID,
    admin_remarks TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deposit RECORD;
    v_wallet RECORD;
BEGIN
    -- Verification check
    IF NOT public.is_admin(reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    -- Lock deposit row
    SELECT * INTO v_deposit FROM public.deposits WHERE id = deposit_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit record not found.';
    END IF;

    IF v_deposit.status <> 'Pending' AND v_deposit.status <> 'Under Review' THEN
        RAISE EXCEPTION 'Deposit is already processed. Current status: %', v_deposit.status;
    END IF;

    -- Lock wallet row
    SELECT * INTO v_wallet FROM public.wallets WHERE id = v_deposit.user_id FOR UPDATE;

    -- Update wallet stats
    UPDATE public.wallets
    SET available_balance = available_balance + v_deposit.amount,
        total_deposits = total_deposits + v_deposit.amount
    WHERE id = v_deposit.user_id;

    -- Update deposit row status
    UPDATE public.deposits
    SET status = 'Approved',
        remarks = admin_remarks,
        admin_id = reviewer_uuid
    WHERE id = deposit_uuid;

    -- Insert ledger entry
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id)
    VALUES (
        v_deposit.user_id,
        'Deposit',
        v_deposit.amount,
        v_wallet.available_balance,
        v_wallet.available_balance + v_deposit.amount,
        'Completed',
        'deposits',
        deposit_uuid
    );

    -- Notify user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_deposit.user_id,
        'Financial',
        'Deposit Approved',
        format('Your deposit of %s via %s (TID: %s) has been approved! Funds are available now.', v_deposit.amount::TEXT, v_deposit.payment_method, v_deposit.transaction_id)
    );

    -- Log admin action
    INSERT INTO public.audit_logs (admin_id, action, module, previous_value, new_value, status)
    VALUES (
        reviewer_uuid,
        'Approve Deposit',
        'Deposits',
        jsonb_build_object('deposit_id', deposit_uuid, 'status', v_deposit.status),
        jsonb_build_object('deposit_id', deposit_uuid, 'status', 'Approved'),
        'Success'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Reject Deposit
CREATE OR REPLACE FUNCTION public.admin_reject_deposit(
    deposit_uuid UUID,
    reviewer_uuid UUID,
    admin_remarks TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deposit RECORD;
BEGIN
    IF NOT public.is_admin(reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    SELECT * INTO v_deposit FROM public.deposits WHERE id = deposit_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Deposit record not found.';
    END IF;

    IF v_deposit.status <> 'Pending' AND v_deposit.status <> 'Under Review' THEN
        RAISE EXCEPTION 'Deposit is already processed. Current status: %', v_deposit.status;
    END IF;

    UPDATE public.deposits
    SET status = 'Rejected',
        remarks = admin_remarks,
        admin_id = reviewer_uuid
    WHERE id = deposit_uuid;

    -- Notify user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_deposit.user_id,
        'Financial',
        'Deposit Rejected',
        format('Your deposit of %s (TID: %s) was rejected. Reason: %s', v_deposit.amount::TEXT, v_deposit.transaction_id, COALESCE(admin_remarks, 'None specified.'))
    );

    INSERT INTO public.audit_logs (admin_id, action, module, previous_value, new_value, status)
    VALUES (
        reviewer_uuid,
        'Reject Deposit',
        'Deposits',
        jsonb_build_object('deposit_id', deposit_uuid, 'status', v_deposit.status),
        jsonb_build_object('deposit_id', deposit_uuid, 'status', 'Rejected'),
        'Success'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Complete Withdrawal
CREATE OR REPLACE FUNCTION public.admin_complete_withdrawal(
    withdrawal_uuid UUID,
    reviewer_uuid UUID,
    admin_remarks TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
BEGIN
    IF NOT public.is_admin(reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    -- Lock withdrawal
    SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = withdrawal_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal record not found.';
    END IF;

    IF v_withdrawal.status <> 'Pending' AND v_withdrawal.status <> 'Under Review' AND v_withdrawal.status <> 'Processing' THEN
        RAISE EXCEPTION 'Withdrawal is already completed/rejected. Current status: %', v_withdrawal.status;
    END IF;

    -- Lock wallet
    SELECT * INTO v_wallet FROM public.wallets WHERE id = v_withdrawal.user_id FOR UPDATE;

    -- Deduct from pending, update totals
    UPDATE public.wallets
    SET pending_balance = pending_balance - v_withdrawal.amount,
        total_withdrawals = total_withdrawals + v_withdrawal.amount
    WHERE id = v_withdrawal.user_id;

    -- Update withdrawal row
    UPDATE public.withdrawals
    SET status = 'Completed',
        remarks = admin_remarks,
        admin_id = reviewer_uuid
    WHERE id = withdrawal_uuid;

    -- Update pending transaction to completed
    UPDATE public.transactions
    SET status = 'Completed'
    WHERE related_entity_type = 'withdrawals' AND related_entity_id = withdrawal_uuid;

    -- Notify user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_withdrawal.user_id,
        'Financial',
        'Withdrawal Request Completed',
        format('Your withdrawal payout of %s has been transferred successfully to %s. Reference remarks: %s', v_withdrawal.amount::TEXT, v_withdrawal.account_number, COALESCE(admin_remarks, 'None'))
    );

    -- Log admin action
    INSERT INTO public.audit_logs (admin_id, action, module, previous_value, new_value, status)
    VALUES (
        reviewer_uuid,
        'Complete Withdrawal',
        'Withdrawals',
        jsonb_build_object('withdrawal_id', withdrawal_uuid, 'status', v_withdrawal.status),
        jsonb_build_object('withdrawal_id', withdrawal_uuid, 'status', 'Completed'),
        'Success'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Reject Withdrawal
CREATE OR REPLACE FUNCTION public.admin_reject_withdrawal(
    withdrawal_uuid UUID,
    reviewer_uuid UUID,
    admin_remarks TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_withdrawal RECORD;
    v_wallet RECORD;
BEGIN
    IF NOT public.is_admin(reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    SELECT * INTO v_withdrawal FROM public.withdrawals WHERE id = withdrawal_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal record not found.';
    END IF;

    IF v_withdrawal.status <> 'Pending' AND v_withdrawal.status <> 'Under Review' AND v_withdrawal.status <> 'Processing' THEN
        RAISE EXCEPTION 'Withdrawal is already completed/rejected. Current status: %', v_withdrawal.status;
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE id = v_withdrawal.user_id FOR UPDATE;

    -- Restore pending balance to available balance
    UPDATE public.wallets
    SET pending_balance = pending_balance - v_withdrawal.amount,
        available_balance = available_balance + v_withdrawal.amount
    WHERE id = v_withdrawal.user_id;

    -- Update withdrawal status
    UPDATE public.withdrawals
    SET status = 'Rejected',
        remarks = admin_remarks,
        admin_id = reviewer_uuid
    WHERE id = withdrawal_uuid;

    -- Mark transaction ledger as Failed/Cancelled
    UPDATE public.transactions
    SET status = 'Failed',
        admin_ref = admin_remarks
    WHERE related_entity_type = 'withdrawals' AND related_entity_id = withdrawal_uuid;

    -- Log refund in ledger
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id, admin_ref)
    VALUES (
        v_withdrawal.user_id,
        'Withdrawal Reversal',
        v_withdrawal.amount,
        v_wallet.available_balance,
        v_wallet.available_balance + v_withdrawal.amount,
        'Completed',
        'withdrawals',
        withdrawal_uuid,
        admin_remarks
    );

    -- Notify user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_withdrawal.user_id,
        'Financial',
        'Withdrawal Rejected - Funds Restored',
        format('Your withdrawal of %s has been rejected. Reason: %s. Funds have been returned to available balance.', v_withdrawal.amount::TEXT, COALESCE(admin_remarks, 'None'))
    );

    -- Log admin action
    INSERT INTO public.audit_logs (admin_id, action, module, previous_value, new_value, status)
    VALUES (
        reviewer_uuid,
        'Reject Withdrawal',
        'Withdrawals',
        jsonb_build_object('withdrawal_id', withdrawal_uuid, 'status', v_withdrawal.status),
        jsonb_build_object('withdrawal_id', withdrawal_uuid, 'status', 'Rejected'),
        'Success'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: Manual Wallet Adjustment
CREATE OR REPLACE FUNCTION public.admin_adjust_wallet(
    target_user_uuid UUID,
    adjustment_type TEXT, -- 'Credit' or 'Debit'
    adjust_amount NUMERIC,
    adjust_reason TEXT,
    reviewer_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet RECORD;
    v_balance_change NUMERIC;
BEGIN
    IF NOT public.is_admin(reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    IF adjust_amount <= 0 THEN
        RAISE EXCEPTION 'Adjustment amount must be positive.';
    END IF;

    SELECT * INTO v_wallet FROM public.wallets WHERE id = target_user_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Wallet record not found.';
    END IF;

    IF adjustment_type = 'Credit' THEN
        v_balance_change := adjust_amount;
    ELSIF adjustment_type = 'Debit' THEN
        v_balance_change := -adjust_amount;
        IF v_wallet.available_balance < adjust_amount THEN
            RAISE EXCEPTION 'Cannot perform debit. Available balance (%) is less than requested debit (%).', v_wallet.available_balance, adjust_amount;
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid adjustment type. Must be Credit or Debit.';
    END IF;

    -- Apply adjustment
    UPDATE public.wallets
    SET available_balance = available_balance + v_balance_change
    WHERE id = target_user_uuid;

    -- Record transaction
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, admin_ref)
    VALUES (
        target_user_uuid,
        'Admin Adjustment',
        v_balance_change,
        v_wallet.available_balance,
        v_wallet.available_balance + v_balance_change,
        'Completed',
        adjust_reason
    );

    -- Notify user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        target_user_uuid,
        'Financial',
        'Wallet Balance Adjusted',
        format('An administrator has adjusted your wallet balance. Adjustment: %s %s. Reason: %s', 
            CASE WHEN v_balance_change > 0 THEN '+' ELSE '' END, 
            v_balance_change::TEXT, 
            COALESCE(adjust_reason, 'No reason provided.')
        )
    );

    -- Log admin audit
    INSERT INTO public.audit_logs (admin_id, action, module, previous_value, new_value, status)
    VALUES (
        reviewer_uuid,
        'Wallet Adjustment',
        'Wallets',
        jsonb_build_object('user_id', target_user_uuid, 'available_balance', v_wallet.available_balance),
        jsonb_build_object('user_id', target_user_uuid, 'available_balance', v_wallet.available_balance + v_balance_change),
        'Success'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------

-- Profiles Policies
CREATE POLICY "Users can view own profiles" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profiles" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can read/write all profiles" ON public.profiles USING (public.is_admin(auth.uid()));

-- Wallets Policies
CREATE POLICY "Users can view own wallets" ON public.wallets FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read/write all wallets" ON public.wallets USING (public.is_admin(auth.uid()));

-- Daily Check-ins Policies
CREATE POLICY "Users can view own check-ins" ON public.daily_check_ins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all check-ins" ON public.daily_check_ins FOR SELECT USING (public.is_admin(auth.uid()));

-- Deposits Policies
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read/write all deposits" ON public.deposits USING (public.is_admin(auth.uid()));

-- Withdrawals Policies
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read/write all withdrawals" ON public.withdrawals USING (public.is_admin(auth.uid()));

-- Transactions Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions USING (public.is_admin(auth.uid()));

-- Notifications Policies
CREATE POLICY "Users can view/modify own notifications" ON public.notifications USING (auth.uid() = user_id);
CREATE POLICY "Admins can dispatch announcements" ON public.notifications FOR INSERT WITH CHECK (public.is_admin(auth.uid()));

-- Support Tickets Policies
CREATE POLICY "Users can view/create own tickets" ON public.support_tickets USING (auth.uid() = user_id);
CREATE POLICY "Admins can read/update all tickets" ON public.support_tickets USING (public.is_admin(auth.uid()));

-- Support Messages Policies
CREATE POLICY "Users can view own messages" ON public.support_messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can post messages on own tickets" ON public.support_messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Admins can read/write support messages" ON public.support_messages USING (public.is_admin(auth.uid()));

-- CMS Pages & FAQs (Publicly readable, admin writable)
CREATE POLICY "Public select on CMS" ON public.cms_pages FOR SELECT USING (true);
CREATE POLICY "Admin write on CMS" ON public.cms_pages USING (public.is_admin(auth.uid()));

CREATE POLICY "Public select on FAQ" ON public.faq FOR SELECT USING (true);
CREATE POLICY "Admin write on FAQ" ON public.faq USING (public.is_admin(auth.uid()));

-- Platform settings
CREATE POLICY "Public read platform configuration" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admin update settings" ON public.platform_settings USING (public.is_admin(auth.uid()));

-- Admin roles
CREATE POLICY "Admin visibility" ON public.admin_users FOR SELECT USING (public.is_admin(auth.uid()) OR auth.uid() = id);

-- Audit logs
CREATE POLICY "Admin audit logs visibility" ON public.audit_logs USING (public.is_admin(auth.uid()));

-- ----------------------------------------------------
-- INITIAL SEED DATA
-- ----------------------------------------------------

-- Insert default reward setting
INSERT INTO public.platform_settings (key, value)
VALUES ('rewards', '{"base_reward": 10.00, "streak_bonus": 2.00}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Seed initial FAQ entries
INSERT INTO public.faq (category, question, answer, order_index)
VALUES 
('Earning', 'How much can I earn from checking in daily?', 'You earn a base of 10.00 credits per day. For every consecutive day check-in, your streak count increases, and you receive an extra streak bonus of 2.00 credits per consecutive day. For example, on Day 3 your bonus is 4.00 credits, and on Day 7 you receive an additional milestone reward!', 1),
('Deposits', 'What payment methods are supported for funding?', 'We support deposits via regional payment services including JazzCash and EasyPaisa. You can transfer funds to the platform account shown on the deposit screen and submit your transaction details for verification.', 2),
('Withdrawals', 'What is the minimum withdrawal amount?', 'The minimum withdrawal limit is 100.00 credits. Withdrawals are processed manually by administrators within our configured processing window.', 3),
('Security', 'How long before a streak resets?', 'Your streak will reset to zero if you fail to check in within a 48-hour window of your last check-in. The platform check-in cooldown is 24 hours.', 4)
ON CONFLICT DO NOTHING;

-- Seed initial CMS pages
INSERT INTO public.cms_pages (id, title, content, status)
VALUES 
('terms', 'Terms & Conditions', 'Welcome to My Trust. By registering, you agree to follow our daily check-in policy, withdrawal rules, and anti-fraud guidelines. Duplicate account creations are strictly prohibited.', 'Published'),
('privacy', 'Privacy Policy', 'We take your privacy seriously. Your transactions and profile data are stored securely. We do not sell your personal information.', 'Published')
ON CONFLICT DO NOTHING;
