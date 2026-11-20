import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { Status } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { getClient, getSection, getSections } from "@/lib/data";
import { sectionOrder } from "@/lib/models";
import { hasPresentation } from "@/lib/winkler-proposal";

export const dynamic = "force-dynamic";

export default async function AdminReview({ params }: { params: Promise<{ slug: string; section: string }> }) {
  const user = await requireAdmin();
  const { slug, section } = await params;
  if (!sectionOrder.includes(section as typeof sectionOrder[number])) notFound();
  const client = await getClient(slug);
  const [data, sections] = await Promise.all([getSection(client.id, section), getSections(client.id)]);
  const attached = section === "proposal" && await hasPresentation(data.id);
  return <Shell user={user} title={data.title} overline={`${client.name.toUpperCase()} / ADMIN WORKSPACE`} actions={<>
    <Link href={`/admin/clients/${slug}`} className="btn btn-outline">Back to workspace</Link>
    <Link href={`/admin/clients/${slug}/${section}`} className="btn btn-primary">Edit {data.title}</Link>
  </>}>
    <nav aria-label="Client sections" style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
      {sections.map(item => <Link key={item.id} href={`/admin/clients/${slug}/${item.kind}/view`} aria-current={item.kind === section ? "page" : undefined} className={`btn ${item.kind === section ? "btn-primary" : "btn-outline"}`}>{item.title}</Link>)}
    </nav>
    <p className="page-intro">{data.summary}</p>
    <Status status={data.status}/>
    {attached ? <iframe title={`${client.name} interactive proposal`} src={`/admin/clients/${slug}/${section}/view/document`} sandbox="allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox" style={{ display: "block", width: "100%", height: "80vh", border: "1px solid var(--line)", borderRadius: 14, marginTop: 20, background: "white" }}/> :
      <div className="panel" style={{ marginTop: 20 }}><div className="presentation-content">{data.body.split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div></div>}
    {section === "website" && client.website_preview_url && <p><a href={client.website_preview_url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Open website preview</a></p>}
  </Shell>;
}
