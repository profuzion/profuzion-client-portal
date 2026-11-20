import Link from "next/link";
import { ArrowLeft, ArrowRight, Eye, Info } from "lucide-react";
import { updateSectionAction } from "@/app/actions";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { getClient, getSection } from "@/lib/data";
import { sectionOrder, statuses, statusNames } from "@/lib/models";
import { notFound } from "next/navigation";
import { clientName, clientSlug, hasPresentation } from "@/lib/winkler-proposal";
import { ProposalUpload } from "./proposal-upload";
export const dynamic = "force-dynamic";
export default async function EditSection({ params, searchParams }: {
  params: Promise<{ slug: string; section: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user=await requireAdmin();
  const {slug,section}=await params;
  if (!sectionOrder.includes(section as typeof sectionOrder[number])) notFound();
  const client=await getClient(slug);
  const data=await getSection(client.id,section);
  const attached = section === "proposal" && await hasPresentation(data.id);
  const canAttach = section === "proposal" && slug === clientSlug && client.name === clientName;
  const {error}=await searchParams;
  return <Shell user={user} title={`Edit ${data.title}`} overline={`${client.name.toUpperCase()} / ${section.toUpperCase()}`} actions={<><Link href={`/admin/clients/${slug}`} className="btn btn-outline"><ArrowLeft size={16}/>Workspace</Link><Link href={`/c/${slug}/${section}`} className="btn btn-outline"><Eye size={16}/>Preview section</Link></>}>
    <p className="page-intro">Update what your client will see in this independent presentation section.</p>
    {canAttach && <ProposalUpload slug={slug} sectionId={data.id} />}
    {attached && <p><a className="btn btn-outline" href={`/c/${slug}/proposal/presentation`} target="_blank" rel="noopener noreferrer">View attached proposal <Eye size={16}/></a></p>}
    <div className="editor-grid"><div className="panel"><h2 className="panel-title">Presentation content</h2>{error && <div className="notice notice-error">{error}</div>}
      <form action={updateSectionAction} className="form-stack"><input type="hidden" name="slug" value={slug}/><input type="hidden" name="kind" value={section}/>
        <label>Section title<input name="title" defaultValue={data.title} maxLength={120} required/></label>
        <label>Short description<input name="summary" defaultValue={data.summary} maxLength={400}/></label>
        <label>Presentation content<textarea name="body" rows={13} defaultValue={data.body} maxLength={18000}/><small>Use paragraphs to organize this section. Rich visual presentations can later be added as custom Next.js components.</small></label>
        <label>Project status<select name="status" defaultValue={data.status}>{statuses.map(s=><option key={s} value={s}>{statusNames[s]}</option>)}</select></label>
        <button className="btn btn-primary btn-large" type="submit">Save section <ArrowRight size={18}/></button>
      </form>
    </div><div className="editor-side"><div className="feature-panel"><Info size={25}/><h3>Presentation-ready foundations.</h3><p>This first version includes a secure, text-based content editor. Animated proposals, strategy canvases, moodboards and file assets are the next layer — each can use the same client permissions.</p></div></div></div>
  </Shell>;
}
