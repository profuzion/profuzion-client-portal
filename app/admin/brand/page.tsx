import Link from "next/link";
import { Shell } from "@/components/shell";
import { BrandEditor } from "@/components/brand-editor";
import { requireAdmin } from "@/lib/auth";
import { getBrand } from "@/lib/brands";
export const dynamic = "force-dynamic";
export default async function AgencyBrand() {
  const user = await requireAdmin();
  const brand = await getBrand();
  return (
    <Shell
      user={user}
      title="Profuzion brand"
      overline="AGENCY SETTINGS"
      actions={
        <>
          <Link className="btn btn-outline" href="/admin/brand/view">
            View published guide
          </Link>
          <Link className="btn btn-primary" href="/admin/brand/assets/agency">
            Manage downloads
          </Link>
        </>
      }
    >
      <p className="page-intro">
        One brand kit for your guidelines and administration dashboard. No
        duplicate client account needed.
      </p>
      <BrandEditor
        initial={brand.draft}
        revision={brand.revision}
        name="Profuzion"
        published={!!brand.published}
      />
    </Shell>
  );
}
