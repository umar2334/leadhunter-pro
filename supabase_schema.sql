-- LeadHunter Pro — Supabase Schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS leads (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name             TEXT NOT NULL,
  phone            TEXT,
  website          TEXT,
  address          TEXT,
  category         TEXT,
  rating           NUMERIC(3,1),
  review_count     INTEGER,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('no_website','weak_website','has_website')),
  analysis_score   INTEGER CHECK (analysis_score >= 0 AND analysis_score <= 100),
  analysis_issues  TEXT[] DEFAULT '{}',
  analysis_summary TEXT,
  maps_url         TEXT UNIQUE,
  status           TEXT NOT NULL DEFAULT 'new'
                     CHECK (status IN ('new','contacted','replied','converted','dead')),
  outreach_sent    BOOLEAN NOT NULL DEFAULT false,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes for dashboard filters
CREATE INDEX IF NOT EXISTS idx_leads_opportunity ON leads(opportunity_type);
CREATE INDEX IF NOT EXISTS idx_leads_status      ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_category    ON leads(category);
CREATE INDEX IF NOT EXISTS idx_leads_created     ON leads(created_at DESC);

-- Enable Row Level Security (optional — add auth later)
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
