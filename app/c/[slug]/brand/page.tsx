import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireClientAccess } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { getBrand } from "@/lib/brands";
import { listAssets } from "@/lib/brand-assets";
import { BrandGuide } from "@/components/brand-guide";
export const dynamic = "force-dynamic";
export default async function Guidelines({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { user, clientId } = await requireClientAccess(slug);
  const client = await getClient(slug);
  const brand = await getBrand(clientId, client.name);
  const assets = await listAssets(clientId);
  return (
    <Shell
      user={user}
      clientSlug={slug}
      title="Brand guidelines"
      overline={`${client.name} / BRAND HOME`}
      actions={
        <Link className="btn btn-outline" href={`/c/${slug}`}>
          Back to workspace
        </Link>
      }
    >
      <BrandGuide
        kit={brand.published}
        assets={assets}
        scope={slug}
        publishedAt={brand.published_at}
      />
    </Shell>
  );
}
