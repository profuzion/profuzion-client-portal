import { listAgreements } from "@/lib/agreements";
import { setAgreementVisibility } from "@/app/admin/clients/[slug]/agreements/actions";

export async function AgreementList({ clientId, slug, admin = false }: { clientId: string; slug: string; admin?: boolean }) {
  const documents = await listAgreements(clientId, admin);
  if (!documents.length) return <div className="panel"><h2 className="panel-title">No signed agreements yet</h2><p className="muted">{admin ? "Import a completed agreement from Zoho Sign to review it here." : "Your signed agreements will appear here once Profuzion makes them available."}</p></div>;
  return <div className="form-stack">{documents.map(document => <article key={document.id} className="panel">
    <div className="panel-heading"><h2>{document.title}</h2><span className="status">{document.published ? "Signed agreement" : "Admin review only"}</span></div>
    <p className="muted">Added {new Date(document.imported_at).toLocaleDateString("en-CA", { dateStyle: "long" })}</p>
    {admin && <p className="muted">Zoho recipients: {document.recipients || "Not supplied. Check the PDF before publishing."}</p>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
      <a className="btn btn-primary" href={`/api/clients/${slug}/agreements/${document.id}`} target="_blank" rel="noopener noreferrer">View signed PDF</a>
      <a className="btn btn-outline" href={`/api/clients/${slug}/agreements/${document.id}?download=1`}>Download PDF</a>
    </div>
    {admin && <form action={setAgreementVisibility.bind(null, slug)} className="form-stack" style={{ marginTop: 20 }}>
      <input type="hidden" name="id" value={document.id}/><input type="hidden" name="published" value={String(!document.published)}/>
      {!document.published && <label style={{ display: "flex", alignItems: "center", gap: 10 }}><input style={{ width: "auto" }} type="checkbox" name="confirmed" required/>I reviewed the PDF and recipients. This agreement belongs to this client.</label>}
      <button type="submit" className="btn btn-outline">{document.published ? "Hide from client" : "Publish to client workspace"}</button>
    </form>}
  </article>)}</div>;
}
