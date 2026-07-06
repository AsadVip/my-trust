-- REFERRAL SYSTEM & COMMISSION SETUP - MY TRUST PLATFORM

-- 1. Add referred_by column to public.profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Update Row Level Security policies for public.profiles
-- Drop existing referred view policy if it exists to allow recreations
DROP POLICY IF EXISTS "Users can view profiles of users they referred" ON public.profiles;

-- Create policy allowing referrers to query basic profile info of their referrals
CREATE POLICY "Users can view profiles of users they referred" 
ON public.profiles FOR SELECT 
USING (referred_by = auth.uid());

-- 3. Update the handle_new_user trigger function to capture referred_by metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_name TEXT;
    v_referred_by UUID;
BEGIN
    default_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
    
    -- Extract referred_by safe-casting to UUID
    BEGIN
        IF new.raw_user_meta_data->>'referred_by' IS NOT NULL THEN
            v_referred_by := (new.raw_user_meta_data->>'referred_by')::UUID;
        ELSE
            v_referred_by := NULL;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        v_referred_by := NULL;
    END;

    INSERT INTO public.profiles (id, full_name, timezone, theme, referred_by)
    VALUES (new.id, default_name, 'UTC', 'system', v_referred_by);
    
    INSERT INTO public.wallets (id)
    VALUES (new.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Modify Deposit Approval Handler to credit 20% commission on standard deposits
CREATE OR REPLACE FUNCTION public.admin_approve_deposit(
    deposit_uuid UUID,
    reviewer_uuid UUID,
    admin_remarks TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deposit RECORD;
    v_wallet RECORD;
    v_referrer_id UUID;
    v_referrer_wallet RECORD;
    v_commission NUMERIC(12,2);
    v_ref_name TEXT;
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

    -- Referral Commission (20%)
    -- Check if this user was referred by someone and prevent self-referral
    SELECT referred_by, full_name INTO v_referrer_id, v_ref_name 
    FROM public.profiles 
    WHERE id = v_deposit.user_id;

    IF v_referrer_id IS NOT NULL AND v_referrer_id <> v_deposit.user_id THEN
        -- Lock referrer's wallet
        SELECT * INTO v_referrer_wallet FROM public.wallets WHERE id = v_referrer_id FOR UPDATE;
        IF FOUND THEN
            v_commission := v_deposit.amount * 0.20;

            -- Credit referrer's wallet
            UPDATE public.wallets
            SET available_balance = available_balance + v_commission,
                lifetime_earnings = lifetime_earnings + v_commission
            WHERE id = v_referrer_id;

            -- Record transaction for referrer
            INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id, admin_ref)
            VALUES (
                v_referrer_id,
                'Promotional Bonus',
                v_commission,
                v_referrer_wallet.available_balance,
                v_referrer_wallet.available_balance + v_commission,
                'Completed',
                'deposits',
                deposit_uuid,
                format('Referral commission from %s (Deposit: Rs. %s)', v_ref_name, v_deposit.amount::TEXT)
            );

            -- Notify referrer
            INSERT INTO public.notifications (user_id, category, title, message)
            VALUES (
                v_referrer_id,
                'Reward',
                'Referral Commission Credited',
                format('You have received Rs. %s (20%%) referral commission because your referral %s deposited Rs. %s!', v_commission::TEXT, v_ref_name, v_deposit.amount::TEXT)
            );
        END IF;
    END IF;

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


-- 5. Modify Plan Purchase Approval Handler to credit 20% commission on plan purchases
CREATE OR REPLACE FUNCTION public.admin_approve_plan_purchase(
    p_purchase_uuid UUID,
    p_reviewer_uuid UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_purchase RECORD;
    v_plan RECORD;
    v_wallet RECORD;
    v_referrer_id UUID;
    v_referrer_wallet RECORD;
    v_commission NUMERIC(12,2);
    v_ref_name TEXT;
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

    -- Referral Commission (20%)
    -- Check if this user was referred by someone and prevent self-referral
    SELECT referred_by, full_name INTO v_referrer_id, v_ref_name 
    FROM public.profiles 
    WHERE id = v_purchase.user_id;

    IF v_referrer_id IS NOT NULL AND v_referrer_id <> v_purchase.user_id THEN
        -- Lock referrer's wallet
        SELECT * INTO v_referrer_wallet FROM public.wallets WHERE id = v_referrer_id FOR UPDATE;
        IF FOUND THEN
            v_commission := v_plan.price * 0.20;

            -- Credit referrer's wallet
            UPDATE public.wallets
            SET available_balance = available_balance + v_commission,
                lifetime_earnings = lifetime_earnings + v_commission
            WHERE id = v_referrer_id;

            -- Record transaction for referrer
            INSERT INTO public.transactions (user_id, type, amount, balance_before, balance_after, status, related_entity_type, related_entity_id, admin_ref)
            VALUES (
                v_referrer_id,
                'Promotional Bonus',
                v_commission,
                v_referrer_wallet.available_balance,
                v_referrer_wallet.available_balance + v_commission,
                'Completed',
                'user_plans',
                p_purchase_uuid,
                format('Referral commission from %s (Plan Purchase: %s)', v_ref_name, v_plan.name)
            );

            -- Notify referrer
            INSERT INTO public.notifications (user_id, category, title, message)
            VALUES (
                v_referrer_id,
                'Reward',
                'Referral Commission Credited',
                format('You have received Rs. %s (20%%) referral commission because your referral %s purchased plan %s!', v_commission::TEXT, v_ref_name, v_plan.name)
            );
        END IF;
    END IF;

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
