-- Migration: Add Rewards System
-- This adds support for rewards management (Admin CRUD) and user rewards display

-- Add points_balance column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;

-- Create rewards table for storing available rewards
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT,
    points_required INTEGER DEFAULT 0,
    category VARCHAR(50) NOT NULL CHECK (category IN ('cash_bonus', 'gift_voucher', 'experience', 'recognition_badge')),
    criteria_type VARCHAR(50) CHECK (criteria_type IN ('points', 'deals_closed', 'revenue_earned', 'leads_converted', 'manual')),
    criteria_value INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_rewards table for tracking which users have earned/redeemed rewards
CREATE TABLE IF NOT EXISTS public.user_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'earned', 'fulfilled')),
    progress INTEGER DEFAULT 0,
    earned_at TIMESTAMPTZ,
    fulfilled_at TIMESTAMPTZ,
    fulfilled_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Each user can only have one entry per reward
    UNIQUE(user_id, reward_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_sort_order ON public.rewards(sort_order);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON public.user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_reward ON public.user_rewards(reward_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON public.user_rewards(status);

-- Trigger to update updated_at on rewards
CREATE OR REPLACE FUNCTION update_rewards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

CREATE TRIGGER trigger_user_rewards_updated_at
    BEFORE UPDATE ON public.user_rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_rewards_updated_at();

-- RLS Policies for rewards table
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Everyone can view active rewards
CREATE POLICY "Anyone can view active rewards" ON public.rewards
    FOR SELECT
    USING (is_active = true);

-- Admins can view all rewards (including inactive)
CREATE POLICY "Admins can view all rewards" ON public.rewards
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can insert rewards
CREATE POLICY "Admins can insert rewards" ON public.rewards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update rewards
CREATE POLICY "Admins can update rewards" ON public.rewards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete rewards
CREATE POLICY "Admins can delete rewards" ON public.rewards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for user_rewards table
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

-- Users can view their own rewards
CREATE POLICY "Users can view own rewards" ON public.user_rewards
    FOR SELECT
    USING (user_id = auth.uid());

-- Admins can view all user rewards
CREATE POLICY "Admins can view all user rewards" ON public.user_rewards
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can insert user rewards
CREATE POLICY "Admins can insert user rewards" ON public.user_rewards
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can update user rewards
CREATE POLICY "Admins can update user rewards" ON public.user_rewards
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only admins can delete user rewards
CREATE POLICY "Admins can delete user rewards" ON public.user_rewards
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Comments
COMMENT ON TABLE public.rewards IS 'Available rewards that agents can earn through performance';
COMMENT ON TABLE public.user_rewards IS 'Tracks which rewards each user has earned or is progressing towards';
COMMENT ON COLUMN public.rewards.category IS 'Reward category: cash_bonus, gift_voucher, experience, recognition_badge';
COMMENT ON COLUMN public.rewards.criteria_type IS 'How the reward is earned: points, deals_closed, revenue_earned, leads_converted, or manual';
COMMENT ON COLUMN public.user_rewards.status IS 'Reward status: locked (not available), available (can be earned), earned (achieved), fulfilled (admin delivered)';
