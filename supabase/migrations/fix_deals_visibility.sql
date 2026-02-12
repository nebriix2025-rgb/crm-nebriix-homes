-- Migration: Fix deals visibility - Allow all authenticated users to view all deals
-- This is required for CRM agents to have full visibility into all deals
-- Run this in Supabase SQL Editor

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view their deals or all if admin" ON deals;

-- Create new policy that allows all authenticated users to view all deals
CREATE POLICY "All authenticated users can view all deals" ON deals FOR SELECT USING (
  auth.uid() IS NOT NULL
);

-- Note: Update and Insert policies remain unchanged - users can only modify their own deals
