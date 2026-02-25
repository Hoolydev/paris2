-- Fix permissions: drop ALL existing policies first, then recreate
-- Safe to run multiple times (idempotent)

-- 1. Drop all existing policies on properties
DROP POLICY IF EXISTS "Allow public read access" ON properties;
DROP POLICY IF EXISTS "Allow public insert" ON properties;
DROP POLICY IF EXISTS "Allow public update" ON properties;
DROP POLICY IF EXISTS "Allow public delete" ON properties;
DROP POLICY IF EXISTS "Allow full access for authenticated users" ON properties;

-- 2. Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 3. Recreate policies
CREATE POLICY "Allow public read access" ON properties FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON properties FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON properties FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete" ON properties FOR DELETE TO public USING (true);

-- 4. Grant schema permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;