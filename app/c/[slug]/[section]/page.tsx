import Link from "next/link";
import { sql } from "@/lib/db";
import { ArrowLeft, ArrowUpRight, ExternalLink, LockKeyhole, Sparkles } from "lucide-react";
import { Shell } from "@/components/shell";
import { approveSectionAction } from "@/app/actions";
import { SectionIcon, Status } from "@/components/ui";
import { requireClientAccess } from "@/lib/auth";
import { getClient, getSection } from "@/lib/data";
import { sectionOrder } from "@/lib/models";
import { notFound } from "next/navigation";
import { hasPresentation } from "@/lib/winkler-proposal";
export const dynamic = "force-dynamic";
export default async function ClientSection({ params }: { params: Promise<{slug:string;section:string}> }) {
  const {slug,section}=await params;
  if(!sectionOrder.includes(section as typeof sectionOrder[number]))notFound();
  const {user,clientId}=await requireClientAccess(slug);
  const [client,data]=await Promise.all([getClient(slug),getSection(clientId,section)]);
  const owner = user.role === "client" && (await sql("SELECT 1 FROM memberships WHERE user_id=$1 AND client_id=$2 AND role='owner'", [user.id,clientId])).length > 0;
  const attached = section === "proposal" && await hasPresentation(data.id);
  return <Shell user={user} clientSlug={slug} title={data.title} overline={`${client.name.toUpperCase()} / ${user.role === "admin" ? "ADMIN REVIEW" : "YOUR PROJECT"}`} actions={<>{user.role === "admin" && <Link href={`/admin/clients/${slug}/${section}`} className="btn btn-primary">Edit section</Link>}<Link href={`/c/${slug}`} className="btn btn-outline"><ArrowLeft size={16}/>Overview</Link></>}>
    <p className="page-intro">{data.summary}</p><div className="presentation"><div className={`presentation-head accent-${section}`}><span className="presentation-symbol"><SectionIcon kind={data.kind} size={30}/></span><div><p className="overline">THE PROFUZION PROCESS / {section.toUpperCase()}</p><h2>{data.title}</h2><p>{data.summary}</p></div><span className="presentation-index">0{sectionOrder.indexOf(data.kind)+1} / 04</span></div>
    <div className="presentation-body"><div className="presentation-main"><p className="overline">YOUR PRESENTATION</p><div className="presentation-content">{data.body.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=><p key={i}>{paragraph}</p>)}</div>
      {attached && <a className="btn btn-primary" href={`/c/${slug}/proposal/presentation`} target="_blank" rel="noopener noreferrer">Open interactive proposal <ExternalLink size={16}/></a>}
      {owner && data.status === "review" &&
        <form action={approveSectionAction} className="approval-form"><input type="hidden" name="slug" value={slug}/><input type="hidden" name="kind" value={section}/>
          <p>Please review the presentation carefully before approving.</p>
          <button type="submit" className="btn btn-primary">Approve this section <ArrowUpRight size={17}/></button>
        </form>}
      {data.kind === "website" && client.website_preview_url && <a className="btn btn-primary" href={client.website_preview_url} target="_blank" rel="noopener noreferrer">Open website preview <ExternalLink size={17}/></a>}
      </div><aside className="presentation-side"><p className="overline">CURRENT STATUS</p><Status status={data.status}/><div className="presentation-divider"/><p className="overline">LAST UPDATED</p><strong>{new Date(data.updated_at).toLocaleDateString("en-CA",{month:"long",day:"numeric",year:"numeric"})}</strong><div className="presentation-divider"/><span className="presentation-private"><LockKeyhole size={15}/> Visible only to your team and Profuzion.</span></aside></div>
    </div>
    <Link className="back-link" href={`/c/${slug}`}><ArrowLeft size={17}/> Back to all sections</Link>
  </Shell>;
}
