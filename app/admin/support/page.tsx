import Link from "next/link";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { TicketList, type Ticket } from "@/components/ticket-list";
export const dynamic = "force-dynamic";
export default async function SupportQueue({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await requireAdmin();
  const q = await searchParams;
  const view = ["active", "resolved", "all"].includes(q.view || "")
    ? q.view
    : "active";
  const tickets = await sql<Ticket>(
    "SELECT t.*,c.name AS client_name,c.slug FROM support_tickets t JOIN clients c ON c.id=t.client_id WHERE ($1='all' OR ($1='active' AND t.status!='resolved') OR ($1='resolved' AND t.status='resolved')) ORDER BY (t.priority='high') DESC,t.updated_at DESC",
    [view],
  );
  return (
    <Shell user={user} title="Client support" overline="AGENCY / CONVERSATIONS">
      <p className="page-intro">
        Every request, one clear view. High-priority requests appear first.
      </p>
      <nav className="filter-tabs" aria-label="Filter requests">
        {["active", "resolved", "all"].map((v) => (
          <Link
            key={v}
            aria-current={view === v ? "page" : undefined}
            href={`/admin/support?view=${v}`}
          >
            {v === "active"
              ? "Active requests"
              : v === "resolved"
                ? "Resolved"
                : "All requests"}
          </Link>
        ))}
      </nav>
      <TicketList tickets={tickets} agency />
    </Shell>
  );
}
