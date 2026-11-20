import "server-only";
import { sql, transaction } from "@/lib/db";
import type { importZohoAgreement } from "@/lib/zoho-sign";

export type Agreement = { id: string; title: string; recipients: string; published: boolean; imported_at: Date };
const schema = `CREATE TABLE IF NOT EXISTS signed_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  region text NOT NULL, request_id text NOT NULL,
  title text NOT NULL, recipients text NOT NULL,
  pdf bytea NOT NULL, published boolean NOT NULL DEFAULT false,
  imported_by uuid NOT NULL REFERENCES users(id),
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(region,request_id)
)`;
export async function agreementsReady() {
  const [row] = await sql<{ present: boolean }>("SELECT to_regclass('public.signed_agreements') IS NOT NULL AS present");
  return row.present;
}
export async function listAgreements(clientId: string, admin = false) {
  if (!await agreementsReady()) return [];
  return sql<Agreement>("SELECT id,title,recipients,published,imported_at FROM signed_agreements WHERE client_id=$1 AND ($2 OR published) ORDER BY imported_at DESC", [clientId, admin]);
}
export async function saveAgreement(clientId: string, userId: string, document: Awaited<ReturnType<typeof importZohoAgreement>>) {
  return transaction(async db => {
    await db.query(schema);
    const result = await db.query("INSERT INTO signed_agreements(client_id,region,request_id,title,recipients,pdf,imported_by) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(region,request_id) DO NOTHING RETURNING id", [clientId, document.region, document.requestId, document.title, document.recipients, document.pdf, userId]);
    if (!result.rowCount) return false;
    await db.query("INSERT INTO activities(client_id,label) VALUES($1,$2)", [clientId, "Signed agreement imported for admin review"]);
    return true;
  });
}
