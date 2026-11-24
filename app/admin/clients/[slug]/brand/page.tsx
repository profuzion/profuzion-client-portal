import Link from "next/link";
import { Shell } from "@/components/shell";
import { BrandEditor } from "@/components/brand-editor";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { getBrand } from "@/lib/brands";
export const dynamic = "force-dynamic";
export default async function ClientBrand({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAdmin();
  const { slug } = await params;
  const client = await getClient(slug);
  const brand = await getBrand(client.id, client.name);
  return (
    <Shell
      user={user}
      title={`${client.name} brand`}
      actions={
        <>
          <Link
            className="btn btn-primary"
            href={`/admin/brand/assets/${slug}`}
          >
            Manage downloads
          </Link>
          <Link className="btn btn-outline" href={`/c/${slug}/brand`}>
            View published guide
          </Link>
          <Link className="btn btn-outline" href={`/admin/clients/${slug}`}>
            Back to client
          </Link>
        </>
      }
    >
      <BrandEditor
        initial={brand.draft}
        revision={brand.revision}
        slug={slug}
        name={client.name}
        published={!!brand.published}
      />
    </Shell>
  );
}
