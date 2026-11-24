import Link from "next/link";
import { ArrowRight, Check, Clock3, ExternalLink, Milestone, Sparkles } from "lucide-react";
import { Shell } from "@/components/shell";
import { SectionCard } from "@/components/ui";
import { requireClientAccess } from "@/lib/auth";
import { getActivities, getClient, getSections } from "@/lib/data";
export const dynamic = "force-dynamic";
export default async function ClientHome({ params }: { params: Promise<{slug:string}> }) {
  const {slug}=await params;
  const {user,clientId}=await requireClientAccess(slug);
  const [client,sections,activities]=await Promise.all([getClient(slug),getSections(clientId),getActivities(clientId)]);
  const complete=sections.filter(s=>s.status==='approved').length;
  const review=sections.filter(s=>s.status==='review').length;
  return <Shell user={user} clientSlug={slug} title={client.name} overline="YOUR BRAND JOURNEY" actions={user.role==="admin"?<Link href={`/admin/clients/${slug}`} className="btn btn-outline">Manage workspace <ArrowRight size={16}/></Link>:undefined}>
    <div className="welcome-hero"><div className="welcome-copy"><span className="hero-eyebrow"><Sparkles size={15}/> YOUR PROFUZION EXPERIENCE</span><h2>Let's build something<br/><em>that means more.</em></h2><p>{client.description || "A dedicated space for the thinking, creativity and craftsmanship behind your brand."}</p></div><div className="hero-art"><span className="hero-orbit hero-orbit-one"/><span className="hero-orbit hero-orbit-two"/><span className="hero-center">P<span>.</span></span></div></div>
    <div className="next-step"><div><span className="overline">YOUR NEXT STEP</span><p>{review ? `${review} project ${review === 1 ? 'section is' : 'sections are'} ready for your review.` : complete === sections.length ? 'Your project sections are approved. We’re here for what comes next.' : 'Your project is moving forward. We’ll post new work here as it is ready.'}</p></div><Link className="btn btn-outline" href={review ? `/c/${slug}/${sections.find(s=>s.status==='review')!.kind}` : `/c/${slug}/support`}>{review?'Review your work':'Contact the studio'} <ArrowRight size={16}/></Link></div>
    <div className="section-heading"><div><p className="overline">YOUR PROJECT</p><h2>Everything in its place.</h2></div><span className="muted small">Explore each section <ArrowRight size={15}/></span></div>
    <div className="sections-grid">{sections.map(s=><SectionCard key={s.id} section={s} href={`/c/${slug}/${s.kind}`}/>)}</div>
    <div className="panel" style={{ marginTop: 20 }}><h2 className="panel-title">Signed agreements</h2><p className="muted">Completed contracts and agreements, available for secure viewing and download.</p><Link className="btn btn-outline" href={`/c/${slug}/agreements`}>View agreements</Link></div>
    <div className="client-bottom-grid"><div className="panel"><div className="panel-heading"><div><p className="overline">MOVING FORWARD</p><h3>Project progress</h3></div><Milestone size={22}/></div><div className="progress-large"><strong>{Math.round((complete/4)*100)}%</strong><span>{complete} of 4 sections approved</span></div><div className="progress-track progress-large-track"><span style={{width:`${complete/4*100}%`}}/></div><div className="progress-meta"><span><Check size={15}/> {complete} approved</span><span><Clock3 size={15}/> {review} ready for review</span></div></div>
      <div className="panel"><div className="panel-heading"><div><p className="overline">LATEST MOMENTS</p><h3>Project activity</h3></div><Sparkles size={22}/></div><div className="activity-list">{activities.slice(0,4).map(a=><div key={a.id} className="activity-line"><span className="activity-dot"/><span>{a.label}</span><small>{new Date(a.created_at).toLocaleDateString("en-CA",{month:"short",day:"numeric"})}</small></div>)}</div></div>
    </div>
  </Shell>;
}
