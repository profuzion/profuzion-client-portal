-- Run once before deploying the brand workspace. Safe to run again.
CREATE TABLE IF NOT EXISTS brand_kits (
  scope TEXT PRIMARY KEY,
  client_id UUID UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  draft JSONB NOT NULL,
  published JSONB,
  revision INTEGER NOT NULL DEFAULT 1,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  CHECK ((scope = 'agency' AND client_id IS NULL) OR (client_id IS NOT NULL AND scope = client_id::text))
);
