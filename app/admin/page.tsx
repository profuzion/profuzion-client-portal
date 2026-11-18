import Link from "next/link";
import { ArrowUpRight, BriefcaseBusiness, ChevronRight, Clock3, Layers3, Plus, UsersRound } from "lucide-react";
import { Shell } from "@/components/shell";
import { EmptyClients } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Client } from "@/lib/models";
export const dynamic = "force-dynamic";

type ClientWithStats = Client & { section_count: string; approved_count: string; member_count: string };
export default async function AdminHome() {
  const user = await requireAdmin();
  const clients = await sql<ClientWithStats>(`SELECT c.*,
    (SELECT count(*)::text FROM sections s WHERE s.client_id=c.id) AS section_count,
    (SELECT count(*)::text FROM sections s WHERE s.client_id=c.id AND s.status='approved') AS approved_count,
    (SELECT count(*)::text FROM memberships m WHERE m.client_id=c.id) AS member_count
    FROM clients c ORDER BY c.created_at DESC`);
  const inProgress = await sql<{ count: string }>("SELECT COUNT(DISTINCT client_id)::text AS count FROM sections WHERE status IN ('in_progress','review')");
  const awaiting = await sql<{ count: string }>("SELECT COUNT(*)::text AS count FROM sections WHERE status='review'");
  return <Shell user={user} title="Your agency, all in one place." overline="PROFUZION / ADMIN DASHBOARD" actions={<Link href="/admin/clients/new" className="btn btn-primary"><Plus size={16}/>New client</Link>}>
    <p className="page-intro">A clearer way to manage every project, presentation, and client relationship.</p>
    <div className="stats-grid">
      <div className="stat-card"><div className="stat-top"><span>CLIENT WORKSPACES</span><BriefcaseBusiness size={19}/></div><strong>{clients.length.toString().padStart(2,"0")}</strong><small>All your active client spaces</small></div>
      <div className="stat-card"><div className="stat-top"><span>ACTIVE PROJECTS</span><Layers3 size={19}/></div><strong>{String(inProgress[0]?.count ?? 0).padStart(2,"0")}</strong><small>Work currently in motion</small></div>
      <div className="stat-card"><div className="stat-top"><span>AWAITING REVIEW</span><Clock3 size={19}/></div><strong>{String(awaiting[0]?.count ?? 0).padStart(2,"0")}</strong><small>Sections ready for approval</small></div>
      <div className="stat-card"><div className="stat-top"><span>CLIENT ACCOUNTS</span><UsersRound size={19}/></div><strong>{String(clients.reduce((n,c)=>n+Number(c.member_count),0)).padStart(2,"0")}</strong><small>Invited collaborators</small></div>
    </div>
    <div className="section-heading"><div><p className="overline">MANAGE RELATIONSHIPS</p><h2>Client workspaces <span className="counter">{clients.length}</span></h2></div><Link href="/admin/clients/new" className="text-link">Create new <ArrowUpRight size={17}/></Link></div>
    {!clients.length ? <EmptyClients/> : <div className="client-list">
      {clients.map(c => <Link href={`/admin/clients/${c.slug}`} className="client-list-item" key={c.id}>
        <span className={`client-monogram tone-${c.accent}`}>{c.name.split(/\s+/).slice(0,2).map(w=>w[0]).join("")}</span>
        <span className="client-list-main"><strong>{c.name}</strong><small>{c.industry || "Brand project"}</small></span>
        <span className="progress-inline"><span>{c.approved_count}/{c.section_count} approved</span><span className="progress-track"><span style={{width: `${Number(c.section_count) ? Math.round(100*Number(c.approved_count)/Number(c.section_count)) : 0}%`}}/></span></span>
        <span className="member-count"><UsersRound size={16}/>{c.member_count}</span><ChevronRight size={19} className="chevron"/>
      </Link>)}
    </div>}
    <div className="bottom-note"><span className="note-symbol">✳</span><span><strong>Designed for the journey, not just the deliverable.</strong><br/>Every proposal, strategy, identity and website in its proper place.</span></div>
  </Shell>;
}
