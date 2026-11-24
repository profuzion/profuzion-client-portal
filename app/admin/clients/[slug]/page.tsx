import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, Copy, Eye, ExternalLink, MailPlus, Monitor, PencilLine, ShieldCheck } from "lucide-react";
import { Shell } from "@/components/shell";
import { Status, SectionIcon } from "@/components/ui";
import { createInvitationAction, updatePreviewAction } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { getClient, getSections, getActivities } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function AdminClient({ params, searchParams }: {
  params: Promise<{ slug: string }>; searchParams: Promise<{ invite?: string; reviewer?: string; saved?: string; error?: string }>;
}) {
  const user = await requireAdmin();
  const {slug}=await params;
  const client=await getClient(slug);
  const [sections, activities, query]=await Promise.all([getSections(client.id),getActivities(client.id),searchParams]);
  return <Shell user={user} title={client.name} overline="CLIENT WORKSPACE / ADMINISTRATION" actions={<><Link className="btn btn-outline" href="/admin"><ArrowLeft size={16}/>All clients</Link><Link className="btn btn-primary" href={`/admin/clients/${slug}/proposal/view`}><ExternalLink size={16}/>Review client work</Link></>}>
    <p className="page-intro">{client.description || "Your central place to manage this client's proposals, strategy, identity, and website."}</p>
    <div className="page-actions" style={{marginBottom:24}}><Link className="btn btn-outline" href={`/admin/clients/${slug}/settings`}>Client settings</Link><Link className="btn btn-outline" href={`/c/${slug}/support`}>Support requests</Link><Link className="btn btn-outline" href={`/admin/clients/${slug}/brand`}>Brand guidelines & portal theme</Link><Link className="btn btn-outline" href={`/c/${slug}/brand`}>View published guidelines</Link></div>
    {query.saved && <div className="notice notice-success" role="status">Changes saved successfully.</div>}
    {query.error && <div className="notice notice-error" role="alert">{query.error}</div>}
    {query.reviewer === "ready" && <div className="notice notice-success" role="status">Private reviewer access is ready. No email was sent.</div>}
    {query.reviewer === "reset" && <div className="notice notice-success" role="status">Private reviewer password reset. No email was sent.</div>}
    <div className="section-heading"><div><p className="overline">PRESENTATIONS & DELIVERABLES</p><h2>Project sections</h2></div><span className="muted small">4 separate areas</span></div>
    <div className="manage-section-grid">{sections.map(s=><div className="manage-section" key={s.id}><span className={`section-icon accent-${s.kind}`}><SectionIcon kind={s.kind}/></span><div><strong>{s.title}</strong><p>{s.summary}</p><Status status={s.status}/></div><Link href={`/admin/clients/${slug}/${s.kind}/view`} className="icon-btn" title={`Review ${s.title} as admin`}><Eye size={17}/></Link><Link href={`/admin/clients/${slug}/${s.kind}`} className="icon-btn" title={`Edit ${s.title}`}><PencilLine size={17}/></Link></div>)}</div>
    <div className="panel" style={{ marginTop: 20 }}><h2 className="panel-title">Signed agreements</h2><p className="muted">Completed contracts and agreements, available for secure viewing and download.</p><Link className="btn btn-outline" href={`/admin/clients/${slug}/agreements`}>Manage agreements</Link></div>
    <div className="two-column-panels"><div className="panel"><div className="panel-heading"><div><p className="overline">PEOPLE & ACCESS</p><h3>Client accounts</h3></div><ShieldCheck size={22}/></div><p className="muted">Create an account, generate a password, choose access levels and control notification preferences.</p><Link className="btn btn-primary" href={`/admin/users/new?client=${client.id}`}>Add client user</Link> <Link className="btn btn-outline" href="/admin/users">Manage users</Link></div><div className="panel"><div className="panel-heading"><div><p className="overline">COLLABORATION</p><h3>Invite your client</h3></div><MailPlus size={22}/></div><p className="muted">Issue a secure, one-time invitation link. Share it privately with your client. Links expire after seven days.</p>
      <form action={createInvitationAction} className="inline-form"><input type="hidden" name="slug" value={slug}/><label className="grow">Client email<input name="email" type="email" placeholder="client@company.com" required/></label><button className="btn btn-primary" type="submit">Generate invite</button></form>
      {query.invite && <div className="invite-output"><strong>Invitation link (shown once)</strong><input readOnly value={query.invite} aria-label="Invitation URL"/><p>Copy the URL above and send it to the intended recipient. Do not post it publicly.</p></div>}
      <p className="helper"><ShieldCheck size={15}/> Only authorized accounts can see this workspace.</p>
    </div><div className="panel"><div className="panel-heading"><div><p className="overline">WEBSITE DEVELOPMENT</p><h3>Website preview</h3></div><Monitor size={22}/></div><p className="muted">Connect this client to the separate development site you're hosting on Velocity or WordPress.</p>
      <form action={updatePreviewAction} className="form-stack"><input type="hidden" name="slug" value={slug}/><label>Secure preview URL<input name="website_preview_url" type="url" placeholder="https://preview.example.com" defaultValue={client.website_preview_url || ""}/></label><button type="submit" className="btn btn-outline">Save preview link <ArrowRight size={16}/></button></form>
    </div></div>
    <div className="section-heading"><div><p className="overline">CHANGES & MILESTONES</p><h2>Activity</h2></div></div>
    <div className="activity-list">{activities.map(a=><div key={a.id} className="activity-line"><span className="activity-dot"/><span>{a.label}</span><small>{new Date(a.created_at).toLocaleDateString("en-CA",{month:"short",day:"numeric",year:"numeric"})}</small></div>)}</div>
  </Shell>;
}
