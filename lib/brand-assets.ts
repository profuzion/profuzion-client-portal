import { getUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { AssetCategory } from "@/lib/asset-files";
export type BrandAsset = {
  id: string;
  title: string;
  category: AssetCategory;
  filename: string;
  mime: string;
  size_bytes: number;
  usage_notes: string;
  license_notes: string;
  published: boolean;
  archived: boolean;
  created_at: Date;
};
export async function assetAccess(scope: string, adminOnly = false) {
  const user = await getUser();
  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;
  if (scope === "agency")
    return user.role === "admin"
      ? { user, scope: "agency", clientId: null, name: "Profuzion" }
      : null;
  const [client] = await sql<{ id: string; name: string }>(
    "SELECT c.id,c.name FROM clients c WHERE c.slug=$1 AND ($2='admin' OR EXISTS(SELECT 1 FROM memberships m WHERE m.client_id=c.id AND m.user_id=$3))",
    [scope, user.role, user.id],
  );
  return client
    ? { user, scope: client.id, clientId: client.id, name: client.name }
    : null;
}
export async function listAssets(scope: string, manage = false) {
  try {
    return await sql<BrandAsset>(
      "SELECT id,title,category,filename,mime,size_bytes,usage_notes,license_notes,published,archived,created_at FROM brand_assets WHERE scope=$1 AND ($2 OR (published AND NOT archived)) ORDER BY archived,category,created_at DESC",
      [scope, manage],
    );
  } catch (e) {
    if ((e as { code?: string }).code === "42P01") return [];
    throw e;
  }
}
export function assetHeaders(
  filename: string,
  mime = "application/octet-stream",
  inline = false,
) {
  return {
    "Content-Type": mime,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
    "Cache-Control": "private, no-store",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Cross-Origin-Resource-Policy": "same-origin",
  };
}
