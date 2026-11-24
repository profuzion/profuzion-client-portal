import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { getBrand } from "@/lib/brands";
import { listAssets } from "@/lib/brand-assets";
import { BrandGuide } from "@/components/brand-guide";
export const dynamic = "force-dynamic";
export default async function ProfuzionGuide() {
  const user = await requireAdmin();
  const brand = await getBrand();
  const assets = await listAssets("agency");
  return (
    <Shell
      user={user}
      title="Profuzion brand guidelines"
      overline="OUR STUDIO / OUR BRAND"
      actions={
        <>
          <Link className="btn btn-outline" href="/admin/brand/assets/agency">
            Manage downloads
          </Link>
          <Link className="btn btn-primary" href="/admin/brand">
            Edit guidelines
          </Link>
        </>
      }
    >
      <BrandGuide
        kit={brand.published}
        assets={assets}
        scope="agency"
        publishedAt={brand.published_at}
      />
    </Shell>
  );
}
