-- Fix withdrawals minimum amount constraint from 100 to 70

ALTER TABLE public.withdrawals
  DROP CONSTRAINT IF EXISTS withdrawals_amount_check;

ALTER TABLE public.withdrawals
  ADD CONSTRAINT withdrawals_amount_check CHECK (amount >= 70.00);
