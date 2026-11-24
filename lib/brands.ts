import { sql } from "@/lib/db";
import { agencyBrand, defaultBrand, type BrandKit } from "@/lib/brand-theme";

export type BrandRecord = {
  draft: BrandKit;
  published: BrandKit | null;
  revision: number;
  published_at: Date | null;
};
export async function getBrand(
  clientId?: string,
  name?: string,
): Promise<BrandRecord> {
  const fallback = {
    draft: clientId ? defaultBrand(name) : agencyBrand,
    published: null,
    revision: 0,
    published_at: null,
  };
  try {
    const rows = await sql<BrandRecord>(
      "SELECT draft,published,revision,published_at FROM brand_kits WHERE scope=$1",
      [clientId || "agency"],
    );
    if (!rows[0]) return fallback;
    return {
      ...rows[0],
      draft: { ...fallback.draft, ...rows[0].draft },
      published: rows[0].published
        ? { ...fallback.draft, ...rows[0].published }
        : null,
    };
  } catch (error) {
    // Existing deployments keep working before the additive migration is run.
    if ((error as { code?: string }).code === "42P01") return fallback;
    throw error;
  }
}
export async function publishedBrand(clientId?: string, name?: string) {
  return (
    (await getBrand(clientId, name)).published ??
    (clientId ? defaultBrand(name) : agencyBrand)
  );
}
