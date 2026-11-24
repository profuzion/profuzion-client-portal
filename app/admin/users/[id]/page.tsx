import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { UserForm, type ManagedUser } from "@/components/user-form";
import { removeMembership } from "../actions";
import { uuid } from "@/lib/portal-validation";
export const dynamic = "force-dynamic";
export default async function EditUser({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireAdmin();
  const { id } = await params;
  if (!uuid.test(id)) notFound();
  const [target] = await sql<ManagedUser>(
    "SELECT id,name,email,role,notify_welcome,notify_password_change,notify_password_reset FROM users WHERE id=$1",
    [id],
  );
  if (!target) notFound();
  const clients = await sql<{ id: string; name: string }>(
    "SELECT id,name FROM clients ORDER BY name",
  );
  const memberships = await sql<{
    client_id: string;
    role: string;
    name: string;
  }>(
    "SELECT m.client_id,m.role,c.name FROM memberships m JOIN clients c ON c.id=m.client_id WHERE m.user_id=$1 ORDER BY c.name",
    [id],
  );
  const q = await searchParams;
  return (
    <Shell
      user={user}
      title={target.name}
      overline="PEOPLE & ACCESS"
      actions={
        <Link href="/admin/users" className="btn btn-outline">
          Back to users
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
          Access updated.
        </div>
      )}
      <UserForm
        user={target}
        clients={clients}
        clientId={memberships[0]?.client_id}
        membership={memberships[0]?.role}
      />
      {target.role === "client" && (
        <section className="panel spaced">
          <h2>Current workspace access</h2>
          {memberships.length ? (
            memberships.map((m) => (
              <form
                action={removeMembership}
                key={m.client_id}
                className="membership-row"
              >
                <input type="hidden" name="id" value={id} />
                <input type="hidden" name="client_id" value={m.client_id} />
                <span>
                  {m.name} · {m.role}
                </span>
                <button className="btn btn-outline">Remove access</button>
              </form>
            ))
          ) : (
            <p className="muted">No workspaces assigned.</p>
          )}
        </section>
      )}
    </Shell>
  );
}
