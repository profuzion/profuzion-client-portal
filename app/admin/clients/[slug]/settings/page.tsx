import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import type { ClientSettingsValues } from "@/lib/client-settings-validation";
import { ClientSettingsForm } from "./settings-form";
import styles from "./settings.module.css";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ClientSettingsPage({ params }: {
  params: Promise<{ slug: string }>;
}) {
  const user = await requireAdmin();
  const { slug } = await params;
  const client = await getClient(slug);
  const values: ClientSettingsValues = {
    name: client.name, industry: client.industry, description: client.description,
    slug: client.slug, accent: client.accent, website_preview_url: client.website_preview_url ?? "",
  };
  return (
    <Shell user={user} title="Client Settings" overline="PROFUZION / CLIENT MANAGEMENT"
      actions={<Link href={`/admin/clients/${client.slug}`} className="btn btn-outline">Back to workspace</Link>}>
      <div className={styles.settings}>
        <p className="page-intro">Manage {client.name}&apos;s workspace details and access.</p>
        <ClientSettingsForm key={JSON.stringify(values)} clientId={client.id} initialValues={values} />
      </div>
    </Shell>
  );
}
