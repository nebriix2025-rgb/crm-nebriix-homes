-- Migration: Add Referral System
-- This adds support for tracking agent referrals and their earnings

-- Add referred_by column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create referral_earnings table to track earnings from referrals
CREATE TABLE IF NOT EXISTS public.referral_earnings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    referred_agent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    earning_type VARCHAR(50) NOT NULL CHECK (earning_type IN ('signup_fee', 'commission_share')),
    earning_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure referrer and referred agent are different
    CONSTRAINT different_users CHECK (referrer_id != referred_agent_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referrer ON public.referral_earnings(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_referred ON public.referral_earnings(referred_agent_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_created ON public.referral_earnings(created_at);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON public.users(referred_by);

-- RLS Policies for referral_earnings
ALTER TABLE public.referral_earnings ENABLE ROW LEVEL SECURITY;

-- Admins can view all referral earnings
CREATE POLICY "Admins can view all referral earnings" ON public.referral_earnings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can view their own referral earnings (as referrer)
CREATE POLICY "Users can view own referral earnings" ON public.referral_earnings
    FOR SELECT
    USING (referrer_id = auth.uid());

-- Only admins can insert referral earnings
CREATE POLICY "Admins can insert referral earnings" ON public.referral_earnings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update referral earnings
CREATE POLICY "Admins can update referral earnings" ON public.referral_earnings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete referral earnings
CREATE POLICY "Admins can delete referral earnings" ON public.referral_earnings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Comment on table
COMMENT ON TABLE public.referral_earnings IS 'Tracks earnings from agent referrals - 10% signup fee and commission shares';
COMMENT ON COLUMN public.referral_earnings.earning_type IS 'Type of earning: signup_fee (10% of new agent signup) or commission_share (% of referred agent deals)';
