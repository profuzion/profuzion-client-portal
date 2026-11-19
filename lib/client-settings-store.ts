import { transaction } from "@/lib/db";
import type { ClientSettingsValues } from "@/lib/client-settings-validation";

// These helpers are used only by the admin-authenticated Server Actions.
export async function saveClientSettings(clientId: string, values: ClientSettingsValues, adminName: string) {
  return transaction(async (db) => {
    const current = await db.query<{ slug: string }>(
      "SELECT slug FROM clients WHERE id = $1 FOR UPDATE", [clientId],
    );
    if (!current.rows[0]) return { status: "missing" as const };
    await db.query(
      `UPDATE clients
       SET name = $2, industry = $3, description = $4, slug = $5,
           accent = $6, website_preview_url = $7
       WHERE id = $1`,
      [clientId, values.name, values.industry, values.description,
        values.slug, values.accent, values.website_preview_url || null],
    );
    await db.query("INSERT INTO activities (client_id, label) VALUES ($1, $2)",
      [clientId, `Client settings updated by ${adminName}`]);
    // The existing UNIQUE(slug) constraint handles concurrent slug claims.
    return { status: "saved" as const, previousSlug: current.rows[0].slug, slug: values.slug };
  });
}

export async function deleteClientWorkspace(clientId: string, confirmation: string) {
  return transaction(async (db) => {
    const current = await db.query<{ name: string; slug: string }>(
      "SELECT name, slug FROM clients WHERE id = $1 FOR UPDATE", [clientId],
    );
    const client = current.rows[0];
    if (!client) return { status: "missing" as const };
    // Compare with the locked, current database name, never a submitted expected name.
    if (confirmation !== client.name) return { status: "confirmation" as const };
    // Verified in the supplied schema: client-owned rows cascade, and approvals
    // cascade through sections. Shared users and their sessions are retained.
    await db.query("DELETE FROM clients WHERE id = $1", [clientId]);
    return { status: "deleted" as const, slug: client.slug };
  });
}
