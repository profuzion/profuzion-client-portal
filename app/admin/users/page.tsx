import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { emailConfigured } from "@/lib/notifications";
export const dynamic = "force-dynamic";
export default async function Users({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; mail?: string }>;
}) {
  const user = await requireAdmin();
  const q = await searchParams;
  const users = await sql<{
    id: string;
    name: string;
    email: string;
    role: string;
    workspaces: string | null;
  }>(
    "SELECT u.id,u.name,u.email,u.role,string_agg(c.name, ', ' ORDER BY c.name) AS workspaces FROM users u LEFT JOIN memberships m ON m.user_id=u.id LEFT JOIN clients c ON c.id=m.client_id GROUP BY u.id ORDER BY lower(u.name)",
  );
  return (
    <Shell
      user={user}
      title="People & access"
      overline="AGENCY / USER MANAGEMENT"
      actions={
        <Link href="/admin/users/new" className="btn btn-primary">
          Add user
        </Link>
      }
    >
      <p className="page-intro">
        The right people, with the right access. Manage accounts, passwords and
        email preferences.
      </p>
      {q.saved && (
        <div role="status" className="notice notice-success">
          User saved.
          {q.mail === "sent"
            ? " Notification email sent."
            : q.mail === "disabled"
              ? " No notification email sent."
              : ""}
        </div>
      )}
      {(!emailConfigured() ||
        ["failed", "unconfigured"].includes(q.mail || "")) && (
        <div className="notice notice-error" role="status">
          {q.mail === "failed"
            ? "The account was saved, but its notification email failed. Check your SMTP settings."
            : "Email delivery is not configured. Accounts and preferences can be saved, but no emails will be sent until SMTP is configured."}
        </div>
      )}
      <div className="people-list">
        {users.map((u) => (
          <Link
            href={`/admin/users/${u.id}`}
            className="person-row panel"
            key={u.id}
          >
            <span className="avatar">{u.name[0]}</span>
            <span className="person-info">
              <strong>{u.name}</strong>
              <span>{u.email}</span>
              <small>
                {u.role === "admin"
                  ? "All workspaces"
                  : u.workspaces || "No workspace assigned"}
              </small>
            </span>
            <span className="status">
              {u.role === "admin" ? "Administrator" : "Client"}
            </span>
            <span aria-hidden="true">↗</span>
          </Link>
        ))}
      </div>
    </Shell>
  );
}
