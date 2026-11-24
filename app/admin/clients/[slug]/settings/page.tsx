import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { saveClientSettings, deleteClient } from "./actions";
import { SubmitButton } from "@/components/submit-button";
export const dynamic = "force-dynamic";
export default async function Settings({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireAdmin();
  const { slug } = await params;
  const client = await getClient(slug);
  const q = await searchParams;
  return (
    <Shell
      user={user}
      title="Workspace settings"
      overline={client.name}
      actions={
        <Link className="btn btn-outline" href={`/admin/clients/${slug}`}>
          Back to workspace
        </Link>
      }
    >
      {q.error && (
        <div role="alert" className="notice notice-error">
          {q.error}
        </div>
      )}
      {q.saved && (
        <div role="status" className="notice notice-success">
          Client settings saved.
        </div>
      )}
      <form action={saveClientSettings} className="form-stack panel">
        <input type="hidden" name="slug" value={slug} />
        <label>
          Client name
          <input
            name="name"
            required
            maxLength={150}
            defaultValue={client.name}
          />
        </label>
        <label>
          Industry
          <input
            name="industry"
            maxLength={100}
            defaultValue={client.industry}
          />
        </label>
        <label>
          Project summary
          <textarea
            name="description"
            maxLength={600}
            defaultValue={client.description}
          />
        </label>
        <label>
          Workspace accent
          <select name="accent" defaultValue={client.accent}>
            {["orange", "blue", "green", "violet"].map((c) => (
              <option value={c} key={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <p className="muted">
          Workspace address: /c/{slug}. The address stays stable so existing
          links continue to work.
        </p>
        <SubmitButton>Save settings</SubmitButton>
      </form>
      <section className="panel danger-zone spaced">
        <h2>Delete this workspace</h2>
        <p>
          This permanently removes the client’s project sections, approvals,
          agreements, brand settings, invitations, support tickets and history.
          User accounts remain, but lose access to this workspace.
        </p>
        <form action={deleteClient} className="form-stack">
          <input type="hidden" name="slug" value={slug} />
          <label>
            Type <strong>{slug}</strong> to confirm
            <input name="confirmation" required autoComplete="off" />
          </label>
          <SubmitButton className="btn btn-danger">
            Permanently delete workspace
          </SubmitButton>
        </form>
      </section>
    </Shell>
  );
}
