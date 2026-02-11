-- Migration: Add media columns to properties and attachments to deals
-- Run this in Supabase SQL Editor if tables already exist

-- Add videos and documents columns to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS videos JSONB DEFAULT '[]';
ALTER TABLE properties ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]';

-- Add attachments column to deals table
ALTER TABLE deals ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]';

-- Update storage bucket policies (run in Supabase Dashboard -> Storage -> Policies)
-- These buckets should already be created as PUBLIC buckets:
-- 1. property-files (public)
-- 2. deal-files (public)
