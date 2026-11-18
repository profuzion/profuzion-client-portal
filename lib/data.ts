import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import type { Client, Section, Activity } from "@/lib/models";

export async function getClient(slug: string) {
  const rows = await sql<Client>("SELECT * FROM clients WHERE slug=$1 LIMIT 1", [slug]);
  if (!rows[0]) notFound();
  return rows[0];
}
export async function getSections(clientId: string) {
  return sql<Section>(
    `SELECT * FROM sections WHERE client_id=$1 ORDER BY CASE kind
      WHEN 'proposal' THEN 1 WHEN 'strategy' THEN 2 WHEN 'identity' THEN 3 ELSE 4 END`,
    [clientId]);
}
export async function getSection(clientId: string, kind: string) {
  const rows = await sql<Section>("SELECT * FROM sections WHERE client_id=$1 AND kind=$2 LIMIT 1", [clientId, kind]);
  if (!rows[0]) notFound();
  return rows[0];
}
export async function getActivities(clientId: string) {
  return sql<Activity>("SELECT * FROM activities WHERE client_id=$1 ORDER BY created_at DESC LIMIT 6", [clientId]);
}
