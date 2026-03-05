-- Migration to add new fields for better property details
-- Run this in Supabase SQL Editor

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS code TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS garage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Create an index/unique constraint on code if desired, but let's keep it flexible for now.
-- CREATE UNIQUE INDEX idx_properties_code ON properties(code);
