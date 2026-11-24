import Link from "next/link";
import { Shell } from "@/components/shell";
import { AgreementList } from "@/components/agreement-list";
import { requireClientAccess } from "@/lib/auth";
import { getClient } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function Agreements({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, clientId } = await requireClientAccess(slug);
  const client = await getClient(slug);
  return <Shell user={user} clientSlug={slug} title="Signed agreements" overline={`${client.name.toUpperCase()} / WORKSPACE`} actions={<Link href={user.role === "admin" ? `/admin/clients/${slug}/agreements` : `/c/${slug}`} className="btn btn-outline">{user.role === "admin" ? "Manage agreements" : "Back to workspace"}</Link>}>
    <p className="page-intro">View and download your completed agreements in one place.</p>
    <AgreementList clientId={clientId} slug={slug}/>
  </Shell>;
}
