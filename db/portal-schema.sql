-- Additive, repeatable migration for user preferences and support.
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_welcome BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_password_change BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_password_reset BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS support_tickets (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 number BIGSERIAL UNIQUE NOT NULL,
 client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
 created_by UUID NOT NULL REFERENCES users(id),
 subject TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 160),
 category TEXT NOT NULL CHECK (category IN ('change','question','issue')),
 priority TEXT NOT NULL CHECK (priority IN ('normal','high')) DEFAULT 'normal',
 status TEXT NOT NULL CHECK (status IN ('open','in_progress','waiting','resolved')) DEFAULT 'open',
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_messages (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
 author_id UUID NOT NULL REFERENCES users(id),
 body TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 10000),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tickets_by_client ON support_tickets(client_id,updated_at DESC);
CREATE INDEX IF NOT EXISTS messages_by_ticket ON ticket_messages(ticket_id,created_at);
