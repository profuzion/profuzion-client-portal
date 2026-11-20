import Link from "next/link";
import { Shell } from "@/components/shell";
import { AgreementList } from "@/components/agreement-list";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { zohoConfigured } from "@/lib/zoho-sign";
import { importAgreement } from "./actions";
export const dynamic = "force-dynamic";
export default async function Agreements({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ error?: string; imported?: string }> }) {
  const user = await requireAdmin();
  const { slug } = await params;
  const client = await getClient(slug);
  const query = await searchParams;
  const configured = zohoConfigured();
  return <Shell user={user} title="Agreements" overline={`${client.name.toUpperCase()} / ADMIN WORKSPACE`} actions={<Link href={`/admin/clients/${slug}`} className="btn btn-outline">Back to workspace</Link>}>
    <p className="page-intro">Review signed agreements and choose when they appear in this client's workspace.</p>
    {query.error && <p role="alert" className="notice notice-error">{query.error}</p>}
    {query.imported && <p role="status" className="notice notice-success">Imported for your review. Open the PDF and confirm the client before publishing.</p>}
    <section className="panel" style={{ marginBottom: 24 }}><h2 className="panel-title">Import from Zoho Sign</h2>
      <p className="muted">{configured ? "Connection settings are present. Import a completed request to verify the connection." : "Zoho Sign is awaiting connection. Existing agreements remain available."}</p>
      <form action={importAgreement.bind(null, slug)} className="form-stack">
        <label>Zoho Sign request ID<input name="request_id" inputMode="numeric" pattern="[0-9]{5,40}" maxLength={40} required disabled={!configured}/></label>
        <button type="submit" className="btn btn-primary" disabled={!configured}>Import for review</button>
      </form>
      <p className="helper">Imports completed PDFs with the completion certificate. No signing requests or emails are sent.</p>
    </section>
    <AgreementList clientId={client.id} slug={slug} admin/>
  </Shell>;
}
