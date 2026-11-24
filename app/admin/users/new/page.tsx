import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { UserForm } from "@/components/user-form";
import Link from "next/link";
export const dynamic = "force-dynamic";
export default async function NewUser({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; client?: string }>;
}) {
  const user = await requireAdmin();
  const q = await searchParams;
  const clients = await sql<{ id: string; name: string }>(
    "SELECT id,name FROM clients ORDER BY name",
  );
  return (
    <Shell
      user={user}
      title="Add a person"
      overline="PEOPLE & ACCESS"
      actions={
        <Link className="btn btn-outline" href="/admin/users">
          Back to users
        </Link>
      }
    >
      <p className="page-intro">
        Create an account and choose how they collaborate with your studio.
      </p>
      {q.error && (
        <div className="notice notice-error" role="alert">
          {q.error}
        </div>
      )}
      <UserForm clients={clients} clientId={q.client} />
    </Shell>
  );
}
