-- UPDATES FOR PLANS SYSTEM - MY TRUST PLATFORM

-- 1. Create plans definition table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    duration_days INTEGER NOT NULL CHECK (duration_days > 0),
    base_reward NUMERIC(12,2) NOT NULL CHECK (base_reward >= 0),
    streak_bonus NUMERIC(12,2) NOT NULL CHECK (streak_bonus >= 0),
    milestones JSONB DEFAULT '{"7": 20.00, "15": 50.00, "30": 150.00}'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create user plans purchase tracker
CREATE TABLE IF NOT EXISTS public.user_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.plans(id) ON DELETE RESTRICT NOT NULL,
    transaction_id TEXT NOT NULL UNIQUE,
    screenshot_url TEXT NOT NULL,
    status TEXT DEFAULT 'Pending' NOT NULL CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    remarks TEXT,
    activated_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    streak_count INTEGER DEFAULT 0 NOT NULL CHECK (streak_count >= 0),
    last_check_in TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Update transactions check constraint to allow plan-related metadata linking
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_type_check CHECK (
    type IN ('Daily Reward', 'Streak Bonus', 'Promotional Bonus', 'Deposit', 'Deposit Reversal', 'Withdrawal', 'Withdrawal Reversal', 'Admin Adjustment', 'Refund', 'Penalty', 'Plan Purchase')
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
-- Plans: Anyone logged in can view plans, only Admins can create/edit them
CREATE POLICY "Users can view plans" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins can manage plans" ON public.plans USING (public.is_admin(auth.uid()));

-- User Plans: Users can view and insert their own purchases, Admins can read/write everything
CREATE POLICY "Users can view own purchases" ON public.user_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit purchases" ON public.user_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view and edit all purchases" ON public.user_plans USING (public.is_admin(auth.uid()));

-- 6. Trigger update timestamp
CREATE TRIGGER update_plans_timestamp BEFORE UPDATE ON public.plans FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();
CREATE TRIGGER update_user_plans_timestamp BEFORE UPDATE ON public.user_plans FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();


-- ---------------------------------------------------------------------
-- TRANSACTION HANDLERS (SECURITY DEFINER FUNCTIONS)
-- ---------------------------------------------------------------------

-- Purchase Request Handler
CREATE OR REPLACE FUNCTION public.purchase_plan_request(
    p_user_uuid UUID,
    p_plan_uuid UUID,
    p_tid TEXT,
    p_screenshot TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_purchase_uuid UUID;
BEGIN
    -- Auth check
    IF auth.uid() <> p_user_uuid AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized plan purchase request.';
    END IF;

    -- Verify TID is unique
    IF EXISTS (SELECT 1 FROM public.user_plans WHERE transaction_id = trim(p_tid)) THEN
        RAISE EXCEPTION 'Transaction ID (TID) has already been submitted.';
    END IF;

    INSERT INTO public.user_plans (user_id, plan_id, transaction_id, screenshot_url, status)
    VALUES (p_user_uuid, p_plan_uuid, trim(p_tid), p_screenshot, 'Pending')
    RETURNING id INTO v_purchase_uuid;

    RETURN jsonb_build_object(
        'success', true,
        'purchase_id', v_purchase_uuid,
        'status', 'Pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin Approval Handler
CREATE OR REPLACE FUNCTION public.admin_approve_plan_purchase(
    p_purchase_uuid UUID,
    p_reviewer_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_purchase RECORD;
    v_plan RECORD;
    v_wallet RECORD;
BEGIN
    -- Admin guard
    IF NOT public.is_admin(p_reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    -- Get purchase record with lock
    SELECT * INTO v_purchase FROM public.user_plans WHERE id = p_purchase_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan purchase request not found.';
    END IF;

    IF v_purchase.status <> 'Pending' THEN
        RAISE EXCEPTION 'Plan purchase request is already %', v_purchase.status;
    END IF;

    -- Get plan details
    SELECT * INTO v_plan FROM public.plans WHERE id = v_purchase.plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan definition not found.';
    END IF;

    -- Get user wallet with lock
    SELECT * INTO v_wallet FROM public.wallets WHERE id = v_purchase.user_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User wallet not found.';
    END IF;

    -- Update purchase record status to Approved
    UPDATE public.user_plans
    SET status = 'Approved',
        activated_at = now(),
        expires_at = now() + (v_plan.duration_days || ' days')::INTERVAL,
        updated_at = now()
    WHERE id = p_purchase_uuid;

    -- Update user wallet (increment total deposits by plan cost)
    UPDATE public.wallets
    SET total_deposits = total_deposits + v_plan.price,
        updated_at = now()
    WHERE id = v_purchase.user_id;

    -- Log transaction in ledger
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id, admin_ref)
    VALUES (
        v_purchase.user_id,
        'Deposit', -- Log as Deposit transaction to match Ledger type schemas
        v_plan.price,
        v_wallet.available_balance,
        v_wallet.available_balance,
        'Completed',
        'user_plans',
        p_purchase_uuid,
        format('Approved Plan Purchase: %s (Rs. %s)', v_plan.name, v_plan.price::TEXT)
    );

    -- Log admin audit
    INSERT INTO public.audit_logs (admin_id, action, module, new_value, status)
    VALUES (
        p_reviewer_uuid,
        'Approve Plan Purchase',
        'user_plans',
        jsonb_build_object('purchase_id', p_purchase_uuid, 'user_id', v_purchase.user_id, 'plan_name', v_plan.name),
        'Success'
    );

    -- Dispatch notification to user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_purchase.user_id,
        'Financial',
        'Plan Activated Successfully',
        format('Your purchase for the plan "%s" has been approved! Start your daily check-ins to claim rewards.', v_plan.name)
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin Rejection Handler
CREATE OR REPLACE FUNCTION public.admin_reject_plan_purchase(
    p_purchase_uuid UUID,
    p_remarks TEXT,
    p_reviewer_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_purchase RECORD;
    v_plan RECORD;
BEGIN
    -- Admin guard
    IF NOT public.is_admin(p_reviewer_uuid) THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.';
    END IF;

    -- Get purchase record with lock
    SELECT * INTO v_purchase FROM public.user_plans WHERE id = p_purchase_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan purchase request not found.';
    END IF;

    IF v_purchase.status <> 'Pending' THEN
        RAISE EXCEPTION 'Plan purchase request is already %', v_purchase.status;
    END IF;

    SELECT * INTO v_plan FROM public.plans WHERE id = v_purchase.plan_id;

    -- Update purchase record to Rejected
    UPDATE public.user_plans
    SET status = 'Rejected',
        remarks = p_remarks,
        updated_at = now()
    WHERE id = p_purchase_uuid;

    -- Log admin audit
    INSERT INTO public.audit_logs (admin_id, action, module, new_value, status)
    VALUES (
        p_reviewer_uuid,
        'Reject Plan Purchase',
        'user_plans',
        jsonb_build_object('purchase_id', p_purchase_uuid, 'user_id', v_purchase.user_id, 'remarks', p_remarks),
        'Success'
    );

    -- Dispatch notification to user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        v_purchase.user_id,
        'Financial',
        'Plan Purchase Rejected',
        format('Your purchase for the plan "%s" was rejected. Reason: %s', COALESCE(v_plan.name, 'Unknown Plan'), COALESCE(p_remarks, 'No reason provided.'))
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Plan Check-In Handler
CREATE OR REPLACE FUNCTION public.perform_plan_check_in(
    p_user_uuid UUID,
    p_user_plan_uuid UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_plan RECORD;
    v_plan RECORD;
    v_wallet RECORD;
    v_time_diff INTERVAL;
    v_next_streak INTEGER := 1;
    v_base_reward NUMERIC(12,2);
    v_streak_bonus NUMERIC(12,2);
    v_bonus_earned NUMERIC(12,2) := 0.00;
    v_total_earned NUMERIC(12,2);
    v_result JSONB;
BEGIN
    -- Auth guard
    IF auth.uid() <> p_user_uuid AND NOT public.is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Unauthorized check-in operation.';
    END IF;

    -- Lock the user plan row to prevent concurrent adjustments
    SELECT * INTO v_user_plan FROM public.user_plans WHERE id = p_user_plan_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User plan record not found.';
    END IF;

    IF v_user_plan.user_id <> p_user_uuid THEN
        RAISE EXCEPTION 'User plan record does not belong to this user.';
    END IF;

    IF v_user_plan.status <> 'Approved' THEN
        RAISE EXCEPTION 'Plan is not active. Current status: %', v_user_plan.status;
    END IF;

    IF v_user_plan.expires_at IS NOT NULL AND v_user_plan.expires_at < now() THEN
        RAISE EXCEPTION 'This plan has expired.';
    END IF;

    -- Load parent plan config
    SELECT * INTO v_plan FROM public.plans WHERE id = v_user_plan.plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Plan definition details not found.';
    END IF;

    -- Lock the user wallet row
    SELECT * INTO v_wallet FROM public.wallets WHERE id = p_user_uuid FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'User wallet not found.';
    END IF;

    -- Cooldown and Streak Logic
    IF v_user_plan.last_check_in IS NOT NULL THEN
        v_time_diff := now() - v_user_plan.last_check_in;
        
        -- Cooldown: 24h
        IF v_time_diff < INTERVAL '24 hours' THEN
            RAISE EXCEPTION 'You can check in for this plan only once every 24 hours. Remaining time: %', (INTERVAL '24 hours' - v_time_diff);
        END IF;
        
        -- Streak maintenance check: <= 48h
        IF v_time_diff <= INTERVAL '48 hours' THEN
            v_next_streak := v_user_plan.streak_count + 1;
        ELSE
            v_next_streak := 1;
        END IF;
    ELSE
        v_next_streak := 1;
    END IF;

    -- Calculate rewards:
    -- Every day: base_reward only
    -- Milestone days (7, 15, 30): base_reward + milestone_bonus
    -- No daily streak_bonus accumulation
    v_base_reward := v_plan.base_reward;
    v_bonus_earned := 0.00;

    -- Milestone bonus only on configured days
    IF v_plan.milestones ? v_next_streak::TEXT THEN
        v_bonus_earned := (v_plan.milestones->>v_next_streak::TEXT)::NUMERIC;
    END IF;

    v_total_earned := v_base_reward + v_bonus_earned;

    -- Update user plan state
    UPDATE public.user_plans
    SET streak_count = v_next_streak,
        last_check_in = now(),
        updated_at = now()
    WHERE id = p_user_plan_uuid;

    -- Credit user wallet
    UPDATE public.wallets
    SET available_balance = available_balance + v_total_earned,
        lifetime_earnings = lifetime_earnings + v_total_earned,
        updated_at = now()
    WHERE id = p_user_uuid;

    -- Record check-in event log
    INSERT INTO public.daily_check_ins (user_id, check_in_time, base_reward, bonus_reward, streak_count, total_credited, campaign_ref)
    VALUES (p_user_uuid, now(), v_base_reward, v_bonus_earned, v_next_streak, v_total_earned, format('plan_purchase:%s', p_user_plan_uuid::TEXT));

    -- Log transaction in ledger
    INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id)
    VALUES (
        p_user_uuid, 
        'Daily Reward', 
        v_total_earned, 
        v_wallet.available_balance, 
        v_wallet.available_balance + v_total_earned, 
        'Completed', 
        'user_plans', 
        p_user_plan_uuid
    );

    -- Dispatch notification to user
    INSERT INTO public.notifications (user_id, category, title, message)
    VALUES (
        p_user_uuid,
        'Reward',
        'Daily Reward Credited',
        format('Plan: %s. Successfully checked in! Credited +%s rewards. Streak is %s.', v_plan.name, v_total_earned::TEXT, v_next_streak::TEXT)
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


-- ---------------------------------------------------------------------
-- INITIAL SEED DATA FOR PLANS
-- ---------------------------------------------------------------------

INSERT INTO public.plans (name, price, duration_days, base_reward, streak_bonus, milestones)
VALUES 
(
    'Bronze Starter', 
    1000.00, 
    30, 
    15.00, 
    1.00, 
    '{"7": 10.00, "15": 25.00, "30": 60.00}'::jsonb
),
(
    'Silver Premium', 
    3000.00, 
    30, 
    50.00, 
    3.00, 
    '{"7": 30.00, "15": 80.00, "30": 200.00}'::jsonb
),
(
    'Gold Enterprise', 
    10000.00, 
    30, 
    200.00, 
    10.00, 
    '{"7": 100.00, "15": 300.00, "30": 800.00}'::jsonb
)
ON CONFLICT (name) DO UPDATE 
SET price = EXCLUDED.price,
    duration_days = EXCLUDED.duration_days,
    base_reward = EXCLUDED.base_reward,
    streak_bonus = EXCLUDED.streak_bonus,
    milestones = EXCLUDED.milestones;


-- ---------------------------------------------------------------------
-- STORAGE BUCKETS POLICIES FOR RECEIPTS
-- ---------------------------------------------------------------------

-- Ensure receipts bucket metadata is set to public
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Remove existing policies to avoid conflict
DROP POLICY IF EXISTS "Allow public receipts read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated receipts insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow user receipts update" ON storage.objects;
DROP POLICY IF EXISTS "Allow user receipts delete" ON storage.objects;

-- Create security policies for receipts folder operations
CREATE POLICY "Allow public receipts read" ON storage.objects FOR SELECT TO public USING (bucket_id = 'receipts');
CREATE POLICY "Allow authenticated receipts insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'receipts');
CREATE POLICY "Allow user receipts update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'receipts');
CREATE POLICY "Allow user receipts delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'receipts');

