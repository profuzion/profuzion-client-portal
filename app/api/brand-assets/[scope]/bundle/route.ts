import { zipSync, strToU8 } from "fflate";
import { assetAccess, assetHeaders } from "@/lib/brand-assets";
import { assetCategories, safeFilename } from "@/lib/asset-files";
import { sql, transaction } from "@/lib/db";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ scope: string }> },
) {
  const { scope } = await params;
  const access = await assetAccess(scope);
  if (!access) return new Response("Brand unavailable", { status: 404 });
  const category = new URL(request.url).searchParams.get("category");
  if (category && !Object.hasOwn(assetCategories, category))
    return new Response("Unknown category", { status: 400 });
  // A consistent snapshot keeps the size check and downloaded files in agreement.
  const assets = await transaction(async (db) => {
    await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ");
    const totals = await db.query(
      "SELECT count(*)::int AS count,COALESCE(sum(size_bytes),0)::bigint AS bytes FROM brand_assets WHERE scope=$1 AND published AND NOT archived AND ($2::text IS NULL OR category=$2)",
      [access.scope, category],
    );
    if (
      totals.rows[0].count > 200 ||
      Number(totals.rows[0].bytes) > 100 * 1024 * 1024
    )
      return null;
    return (
      await db.query<{
        id: string;
        filename: string;
        category: string;
        data: Buffer;
        usage_notes: string;
        license_notes: string;
      }>(
        "SELECT id,filename,category,data,usage_notes,license_notes FROM brand_assets WHERE scope=$1 AND published AND NOT archived AND ($2::text IS NULL OR category=$2) ORDER BY category,created_at",
        [access.scope, category],
      )
    ).rows;
  });
  if (!assets)
    return new Response(
      "This bundle is too large. Download a category or individual files instead.",
      { status: 413 },
    );
  if (!assets.length)
    return new Response("No published assets available.", { status: 404 });
  const files: Record<string, Uint8Array> = {};
  const notes = [
    `${access.name} — Brand assets`,
    "Only published assets are included.",
    "",
  ];
  for (const asset of assets) {
    const name = `${asset.category}/${asset.id.slice(0, 8)}-${asset.filename}`;
    files[name] = new Uint8Array(asset.data);
    notes.push(name, asset.usage_notes, asset.license_notes, "");
  }
  files["READ-ME.txt"] = strToU8(notes.join("\n"));
  return new Response(zipSync(files, { level: 0 }), {
    headers: assetHeaders(
      `${safeFilename(access.name)}-${category || "brand-kit"}.zip`,
      "application/zip",
    ),
  });
}
