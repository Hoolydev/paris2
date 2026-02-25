-- Create properties table matching the TypeScript interface
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    price TEXT NOT NULL,
    image TEXT,
    images TEXT[], -- Array of strings for multiple images
    location TEXT NOT NULL,
    bedrooms INTEGER NOT NULL DEFAULT 0,
    suites INTEGER DEFAULT 0,
    area TEXT,
    land_area TEXT,
    built_area TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common filtering/sorting
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(location);

-- Enable Row Level Security (RLS)
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Policy to allow public read access (anyone can view properties)
CREATE POLICY "Allow public read access" 
ON properties FOR SELECT 
TO public 
USING (true);

-- Policy to allow full access for authenticated users (or service role)
-- Note: Calls using the Service Role Key bypass RLS automatically.
-- If you are using valid Supabase Auth, you can enable this:
-- CREATE POLICY "Allow full access for authenticated users" 
-- ON properties FOR ALL 
-- TO authenticated 
-- USING (true) 
-- WITH CHECK (true);
