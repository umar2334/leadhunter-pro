-- Run this in Supabase SQL Editor (supabase.com → your project → SQL Editor)

-- 1. Add user_id column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- 3. Users can only see/edit their own leads
CREATE POLICY "Users see own leads" ON leads
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users insert own leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users update own leads" ON leads
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users delete own leads" ON leads
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
