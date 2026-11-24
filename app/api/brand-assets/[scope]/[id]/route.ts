import { assetAccess, assetHeaders } from "@/lib/brand-assets";
import { sql } from "@/lib/db";
import { uuid } from "@/lib/portal-validation";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ scope: string; id: string }> },
) {
  const { scope, id } = await params;
  const access = await assetAccess(scope);
  if (!access || !uuid.test(id))
    return new Response("Asset unavailable", { status: 404 });
  const [asset] = await sql<{ data: Buffer; filename: string; mime: string }>(
    "SELECT data,filename,mime FROM brand_assets WHERE id=$1 AND scope=$2 AND NOT archived AND ($3 OR published)",
    [id, access.scope, access.user.role === "admin"],
  );
  if (!asset) return new Response("Asset unavailable", { status: 404 });
  const preview = new URL(request.url).searchParams.get("preview") === "1";
  if (
    preview &&
    !["image/png", "image/jpeg", "image/webp"].includes(asset.mime)
  )
    return new Response("Preview unavailable", { status: 404 });
  return new Response(new Uint8Array(asset.data), {
    headers: assetHeaders(asset.filename, asset.mime, preview),
  });
}
