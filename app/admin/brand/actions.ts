"use server";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { transaction } from "@/lib/db";
import { validateBrand } from "@/lib/brand-theme";
import { revalidatePath } from "next/cache";

export async function saveBrand(
  slug: string | null,
  payload: unknown,
  revision: number,
  mode: "draft" | "publish" | "reset",
) {
  const user = await requireAdmin();
  if (
    !["draft", "publish", "reset"].includes(mode) ||
    !Number.isInteger(revision) ||
    revision < 0
  )
    return { error: "Invalid save request." };
  let kit;
  try {
    kit = validateBrand(payload);
  } catch (error) {
    return { error: (error as Error).message };
  }
  const client = slug ? await getClient(slug) : null;
  const scope = client?.id || "agency";
  try {
    const next = await transaction(async (db) => {
      // Serialize first creation and updates, including concurrent browser tabs.
      await db.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `brand:${scope}`,
      ]);
      const current = await db.query(
        "SELECT revision FROM brand_kits WHERE scope=$1 FOR UPDATE",
        [scope],
      );
      if ((current.rows[0]?.revision ?? 0) !== revision) return null;
      const rows = await db.query(
        `INSERT INTO brand_kits (scope,client_id,draft,published,updated_by,published_at)
        VALUES ($1,$2,$3,$4,$5,CASE WHEN $6='publish' THEN now() ELSE NULL END)
        ON CONFLICT (scope) DO UPDATE SET draft=$3,
        published=CASE WHEN $6='publish' THEN $3::jsonb WHEN $6='reset' THEN NULL ELSE brand_kits.published END,
        revision=brand_kits.revision+1,updated_by=$5,updated_at=now(),
        published_at=CASE WHEN $6='publish' THEN now() WHEN $6='reset' THEN NULL ELSE brand_kits.published_at END
        RETURNING revision`,
        [
          scope,
          client?.id ?? null,
          JSON.stringify(kit),
          mode === "publish" ? JSON.stringify(kit) : null,
          user.id,
          mode,
        ],
      );
      if (client && mode !== "draft")
        await db.query(
          "INSERT INTO activities (client_id,label) VALUES ($1,$2)",
          [
            client.id,
            mode === "publish"
              ? "Brand guidelines and portal theme published"
              : "Portal theme reset to defaults",
          ],
        );
      return rows.rows[0].revision as number;
    });
    if (next === null)
      return {
        error:
          "Another administrator saved this brand. Reload before making further changes.",
      };
    revalidatePath("/", "layout");
    return { revision: next };
  } catch (error) {
    if ((error as { code?: string }).code === "42P01")
      return {
        error:
          "The brand database migration must be run before saving. See the deployment instructions.",
      };
    throw error;
  }
}
