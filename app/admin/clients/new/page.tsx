import Link from "next/link";
import { ArrowLeft, ArrowRight, Layers3 } from "lucide-react";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { createClientAction } from "@/app/actions";
export const dynamic = "force-dynamic";
export default async function NewClient({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const user = await requireAdmin();
  const { error } = await searchParams;
  return <Shell user={user} title="Create a client workspace." overline="CLIENTS / NEW WORKSPACE" actions={<Link className="btn btn-outline" href="/admin"><ArrowLeft size={16}/>All clients</Link>}>
    <p className="page-intro">One client, four organized sections, and space to grow the relationship.</p>
    <div className="editor-grid"><div className="panel"><h2 className="panel-title">Client details</h2><p className="muted">Use the client's business name. The URL slug becomes their private workspace address.</p>
      {error && <div className="notice notice-error">{error}</div>}
      <form action={createClientAction} className="form-stack"><label>Client name <span className="required">*</span><input name="name" placeholder="e.g. All-West Crane & Rigging" maxLength={150} required/></label>
        <label>Workspace URL slug <span className="required">*</span><input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" placeholder="e.g. all-west-crane" maxLength={65} required/><small>Accessible at /c/your-client-slug</small></label>
        <label>Industry<input name="industry" placeholder="e.g. Industrial services" maxLength={100}/></label>
        <label>Project summary<textarea name="description" rows={4} placeholder="A short description of the brand transformation..." maxLength={600}/></label>
        <label>Workspace accent<select name="accent" defaultValue="orange"><option value="orange">Profuzion orange</option><option value="blue">Slate blue</option><option value="green">Botanical green</option><option value="violet">Soft violet</option></select></label>
        <button className="btn btn-primary btn-large" type="submit">Create workspace <ArrowRight size={18}/></button>
      </form></div>
      <div className="editor-side"><div className="feature-panel"><Layers3 size={27}/><h3>What gets created?</h3><p>Each new workspace starts with four independently managed presentation sections.</p><div className="check-list"><span>✓ Project proposal</span><span>✓ Brand strategy</span><span>✓ Brand identity</span><span>✓ Website & previews</span></div></div></div>
    </div>
  </Shell>;
}
