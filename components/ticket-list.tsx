import Link from "next/link";
import { ticketStatuses, ticketCategories } from "@/lib/portal-validation";
export type Ticket = {
  id: string;
  number: string;
  subject: string;
  status: keyof typeof ticketStatuses;
  category: keyof typeof ticketCategories;
  priority: string;
  updated_at: Date;
  slug: string;
  client_name: string;
};
export function TicketList({
  tickets,
  agency = false,
}: {
  tickets: Ticket[];
  agency?: boolean;
}) {
  return tickets.length ? (
    <div className="ticket-list">
      {tickets.map((t) => (
        <Link
          className="ticket-row"
          href={`/c/${t.slug}/support/${t.id}`}
          key={t.id}
        >
          <span className="ticket-number">#{t.number}</span>
          <span className="ticket-summary">
            <strong>{t.subject}</strong>
            <span>
              {agency ? `${t.client_name} · ` : ""}
              {ticketCategories[t.category]}
              {t.priority === "high" ? " · High priority" : ""}
            </span>
          </span>
          <span className={`ticket-status ticket-${t.status}`}>
            {ticketStatuses[t.status]}
          </span>
          <time dateTime={new Date(t.updated_at).toISOString()}>
            {new Date(t.updated_at).toLocaleDateString("en-CA", {
              month: "short",
              day: "numeric",
            })}
          </time>
        </Link>
      ))}
    </div>
  ) : (
    <div className="empty">
      <h3>Everything is up to date.</h3>
      <p>
        No requests here yet. Start a conversation when you need a change, an
        answer, or a hand with something.
      </p>
    </div>
  );
}
