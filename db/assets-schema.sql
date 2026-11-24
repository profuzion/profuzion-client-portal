CREATE TABLE IF NOT EXISTS brand_assets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
 scope TEXT NOT NULL,
 title TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 150),
 category TEXT NOT NULL CHECK(category IN ('logos','fonts','social','templates','imagery','other')),
 filename TEXT NOT NULL,
 mime TEXT NOT NULL,
 size_bytes INTEGER NOT NULL CHECK(size_bytes BETWEEN 1 AND 20971520),
 data BYTEA NOT NULL,
 usage_notes TEXT NOT NULL DEFAULT '',
 license_notes TEXT NOT NULL DEFAULT '',
 published BOOLEAN NOT NULL DEFAULT false,
 archived BOOLEAN NOT NULL DEFAULT false,
 uploaded_by UUID NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CHECK ((scope='agency' AND client_id IS NULL) OR (client_id IS NOT NULL AND scope=client_id::text))
);
CREATE INDEX IF NOT EXISTS brand_assets_by_scope ON brand_assets(scope,archived,published,category);
