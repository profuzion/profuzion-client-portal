import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireClientAccess } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { sql } from "@/lib/db";
import { TicketList, type Ticket } from "@/components/ticket-list";
import { createTicket } from "@/app/support-actions";
import { SubmitButton } from "@/components/submit-button";
export const dynamic = "force-dynamic";
export default async function Support({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const { user, clientId } = await requireClientAccess(slug);
  const client = await getClient(slug);
  const q = await searchParams;
  const tickets = await sql<Ticket>(
    "SELECT t.*,c.slug,c.name AS client_name FROM support_tickets t JOIN clients c ON c.id=t.client_id WHERE t.client_id=$1 ORDER BY (t.status='resolved'),t.updated_at DESC",
    [clientId],
  );
  return (
    <Shell
      user={user}
      clientSlug={slug}
      title="How can we help?"
      overline={`${client.name} / SUPPORT`}
      actions={
        <Link className="btn btn-primary" href="#new-request">
          New request
        </Link>
      }
    >
      <p className="page-intro">
        A direct line to your studio. Keep questions, changes and progress
        together.
      </p>
      <div className="support-metrics">
        <span>
          <strong>
            {tickets.filter((t) => t.status !== "resolved").length}
          </strong>{" "}
          Active requests
        </span>
        <span>
          <strong>
            {tickets.filter((t) => t.status === "waiting").length}
          </strong>{" "}
          Awaiting your reply
        </span>
        <span>
          <strong>
            {tickets.filter((t) => t.status === "resolved").length}
          </strong>{" "}
          Resolved
        </span>
      </div>
      <TicketList tickets={tickets} />
      <section id="new-request" className="panel spaced">
        <p className="overline">LET’S MOVE IT FORWARD</p>
        <h2>Start a request</h2>
        <p className="muted">
          Tell us what you need. For a technical issue, include the page URL,
          what happened, and what you expected.
        </p>
        {q.error && (
          <div role="alert" className="notice notice-error">
            {q.error}
          </div>
        )}
        <form action={createTicket} className="form-stack">
          <input type="hidden" name="slug" value={slug} />
          <label>
            Subject
            <input
              name="subject"
              required
              maxLength={160}
              placeholder="What would you like help with?"
            />
          </label>
          <div className="form-grid">
            <label>
              Request type
              <select name="category">
                <option value="change">Change request</option>
                <option value="question">Question</option>
                <option value="issue">Troubleshooting</option>
              </select>
            </label>
            <label>
              Priority
              <select name="priority">
                <option value="normal">Normal</option>
                <option value="high">High — blocking our work</option>
              </select>
            </label>
          </div>
          <label>
            Details
            <textarea name="body" required maxLength={10000} rows={6} />
          </label>
          <SubmitButton>Send request</SubmitButton>
        </form>
      </section>
    </Shell>
  );
}
