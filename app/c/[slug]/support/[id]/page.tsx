import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireClientAccess } from "@/lib/auth";
import { sql } from "@/lib/db";
import { updateTicket } from "@/app/support-actions";
import { SubmitButton } from "@/components/submit-button";
import {
  ticketStatuses,
  ticketCategories,
  uuid,
} from "@/lib/portal-validation";
import type { Ticket } from "@/components/ticket-list";
export const dynamic = "force-dynamic";
export default async function Thread({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { slug, id } = await params;
  const { user, clientId } = await requireClientAccess(slug);
  if (!uuid.test(id)) notFound();
  const [ticket] = await sql<Ticket>(
    "SELECT t.*,c.slug,c.name AS client_name FROM support_tickets t JOIN clients c ON c.id=t.client_id WHERE t.id=$1 AND t.client_id=$2",
    [id, clientId],
  );
  if (!ticket) notFound();
  const messages = await sql<{
    id: string;
    body: string;
    name: string;
    role: string;
    created_at: Date;
  }>(
    "SELECT m.id,m.body,m.created_at,u.name,u.role FROM ticket_messages m JOIN users u ON u.id=m.author_id WHERE m.ticket_id=$1 ORDER BY m.created_at,m.id",
    [id],
  );
  const q = await searchParams;
  return (
    <Shell
      user={user}
      clientSlug={slug}
      title={ticket.subject}
      overline={`${ticket.client_name} / REQUEST #${ticket.number}`}
      actions={
        <Link
          className="btn btn-outline"
          href={user.role === "admin" ? "/admin/support" : `/c/${slug}/support`}
        >
          All requests
        </Link>
      }
    >
      <div className="thread-meta">
        <span className={`ticket-status ticket-${ticket.status}`}>
          {ticketStatuses[ticket.status]}
        </span>
        <span>{ticketCategories[ticket.category]}</span>
        <span>
          {ticket.priority === "high" ? "High priority" : "Normal priority"}
        </span>
      </div>
      {q.saved && (
        <div className="notice notice-success" role="status">
          Request updated.
        </div>
      )}
      <div className="thread-layout">
        <section aria-label="Conversation" className="conversation">
          {messages.map((m) => (
            <article
              className={`message panel ${m.role === "admin" ? "message-agency" : ""}`}
              key={m.id}
            >
              <header>
                <span className="avatar">{m.name[0]}</span>
                <div>
                  <strong>{m.name}</strong>
                  <small>
                    {m.role === "admin" ? "Profuzion Studio" : "Client"}
                  </small>
                </div>
                <time dateTime={new Date(m.created_at).toISOString()}>
                  {new Date(m.created_at).toLocaleString("en-CA", {
                    timeZone: "America/Winnipeg",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  CT
                </time>
              </header>
              <p>{m.body}</p>
            </article>
          ))}
          <form action={updateTicket} className="form-stack panel">
            <input type="hidden" name="id" value={id} />
            <label>
              Your reply
              <textarea
                name="body"
                required
                maxLength={10000}
                rows={5}
                placeholder="Keep the conversation moving…"
              />
            </label>
            <p className="muted">
              Replies reopen a resolved request. Agency replies mark the request
              as waiting for the client.
            </p>
            <SubmitButton>Send reply</SubmitButton>
          </form>
        </section>
        <aside className="panel thread-sidebar">
          <h2>Request status</h2>
          <p className="muted">
            {user.role === "admin"
              ? "Keep the client informed as work progresses."
              : "Resolved? Close the request here. You can reopen it any time."}
          </p>
          <form action={updateTicket} className="form-stack">
            <input type="hidden" name="id" value={id} />
            <label>
              Status
              <select
                name="status"
                defaultValue={
                  user.role === "admin"
                    ? ticket.status
                    : ticket.status === "resolved"
                      ? "resolved"
                      : "open"
                }
              >
                {Object.entries(ticketStatuses)
                  .filter(
                    ([key]) =>
                      user.role === "admin" ||
                      ["open", "resolved"].includes(key),
                  )
                  .map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
              </select>
            </label>
            <SubmitButton className="btn btn-outline">
              Update status
            </SubmitButton>
          </form>
        </aside>
      </div>
    </Shell>
  );
}
