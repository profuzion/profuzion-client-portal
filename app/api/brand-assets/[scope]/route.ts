import { assetAccess } from "@/lib/brand-assets";
import {
  MAX_ASSET_BYTES,
  assetCategories,
  safeFilename,
  fileKind,
} from "@/lib/asset-files";
import { sql } from "@/lib/db";
import { uuid } from "@/lib/portal-validation";
import { revalidatePath } from "next/cache";
export const runtime = "nodejs";
async function limitedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Choose a file.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > MAX_ASSET_BYTES + 128 * 1024) {
      await reader.cancel();
      throw new Error("Files must be 20 MB or smaller.");
    }
    chunks.push(value);
  }
  return new Response(Buffer.concat(chunks), {
    headers: { "Content-Type": request.headers.get("content-type") || "" },
  }).formData();
}
export async function POST(
  request: Request,
  { params }: { params: Promise<{ scope: string }> },
) {
  const { scope } = await params;
  const access = await assetAccess(scope, true);
  if (!access) return new Response("Not authorized", { status: 403 });
  const origin = request.headers.get("origin");
  if (!origin || new URL(origin).host !== request.headers.get("host"))
    return new Response("Invalid request origin", { status: 403 });
  const target = new URL(
    `/admin/brand/assets/${encodeURIComponent(scope)}`,
    request.url,
  );
  try {
    const form = await limitedForm(request);
    const mode = String(form.get("mode") || "upload");
    if (mode !== "upload") {
      const id = String(form.get("id") || "");
      if (
        !uuid.test(id) ||
        !["publish", "unpublish", "archive", "restore"].includes(mode)
      )
        throw new Error("Invalid asset action.");
      const statement =
        mode === "publish"
          ? "published=true"
          : mode === "unpublish"
            ? "published=false"
            : mode === "archive"
              ? "archived=true,published=false"
              : "archived=false,published=false";
      const rows = await sql(
        `UPDATE brand_assets SET ${statement} WHERE id=$1 AND scope=$2 RETURNING id`,
        [id, access.scope],
      );
      if (!rows.length) throw new Error("Asset not found.");
    } else {
      const title = String(form.get("title") || "").trim(),
        category = String(form.get("category") || ""),
        usage = String(form.get("usage_notes") || "").trim(),
        license = String(form.get("license_notes") || "").trim();
      if (
        !title ||
        title.length > 150 ||
        !Object.hasOwn(assetCategories, category) ||
        usage.length > 2000 ||
        license.length > 2000
      )
        throw new Error("Check the asset title, category and notes.");
      if (form.get("rights_confirmed") !== "on")
        throw new Error(
          "Confirm that you have permission to distribute this file.",
        );
      const file = form.get("file");
      if (!(file instanceof File) || !file.size || file.size > MAX_ASSET_BYTES)
        throw new Error("Choose a file up to 20 MB.");
      const filename = safeFilename(file.name);
      const data = new Uint8Array(await file.arrayBuffer());
      const { mime } = fileKind(filename, data);
      await sql(
        "INSERT INTO brand_assets(scope,client_id,title,category,filename,mime,size_bytes,data,usage_notes,license_notes,uploaded_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)",
        [
          access.scope,
          access.clientId,
          title,
          category,
          filename,
          mime,
          data.length,
          Buffer.from(data),
          usage,
          license,
          access.user.id,
        ],
      );
    }
    revalidatePath("/", "layout");
    target.searchParams.set("saved", "1");
  } catch (e) {
    const known = e instanceof Error && !(e as { code?: string }).code;
    target.searchParams.set(
      "error",
      known
        ? e.message
        : "Could not save the asset. Verify database setup and try again.",
    );
  }
  return Response.redirect(target, 303);
}
