import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Shell } from "@/components/shell";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import type { Client } from "@/lib/models";
export const dynamic = "force-dynamic";
export default async function Portal() {
  const user = await requireUser();
  if (user.role === "admin") { const { redirect } = await import("next/navigation"); redirect("/admin"); }
  const clients = await sql<Client>(`SELECT c.* FROM clients c JOIN memberships m ON m.client_id=c.id WHERE m.user_id=$1 ORDER BY c.name`, [user.id]);
  return <Shell user={user} title={`Welcome, ${user.name.split(" ")[0]}.`} overline="YOUR WORKSPACES"><p className="page-intro">Everything we're creating together, in one place.</p>
    <div className="client-grid">{clients.map(c => <Link href={`/c/${c.slug}`} className="client-tile" key={c.id}><span className={`client-monogram tone-${c.accent}`}>{c.name.split(/\s+/).slice(0,2).map(w=>w[0]).join("")}</span><span><strong>{c.name}</strong><small>{c.industry || "Brand experience"}</small></span><ArrowUpRight size={19}/></Link>)}</div>
    {!clients.length && <div className="empty"><Building2 size={28}/><h3>Your workspace is being prepared.</h3><p>Profuzion will grant access when your project is ready.</p></div>}
  </Shell>;
}
