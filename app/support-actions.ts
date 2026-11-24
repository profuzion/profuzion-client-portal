"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireClientAccess, requireUser } from "@/lib/auth";
import { transaction } from "@/lib/db";
import {
  field,
  uuid,
  ticketCategories,
  ticketStatuses,
} from "@/lib/portal-validation";
export async function createTicket(form: FormData) {
  const slug = field(form, "slug", 65);
  const { user, clientId } = await requireClientAccess(slug);
  const page = `/c/${slug}/support`;
  const subject = field(form, "subject", 160),
    body = field(form, "body", 10000),
    category = field(form, "category", 30),
    priority = field(form, "priority", 20);
  if (
    !subject ||
    !body ||
    !Object.hasOwn(ticketCategories, category) ||
    !["normal", "high"].includes(priority)
  )
    redirect(`${page}?error=Please+complete+all+ticket+fields.`);
  const id = await transaction(async (db) => {
    // Recheck access while the request is committed.
    const access = await db.query(
      "SELECT id FROM clients c WHERE id=$1 AND ($2='admin' OR EXISTS (SELECT 1 FROM memberships WHERE client_id=c.id AND user_id=$3)) FOR SHARE",
      [clientId, user.role, user.id],
    );
    if (!access.rowCount) throw new Error("Workspace access changed.");
    const result = await db.query(
      "INSERT INTO support_tickets(client_id,created_by,subject,category,priority) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [clientId, user.id, subject, category, priority],
    );
    await db.query(
      "INSERT INTO ticket_messages(ticket_id,author_id,body) VALUES($1,$2,$3)",
      [result.rows[0].id, user.id, body],
    );
    await db.query("INSERT INTO activities(client_id,label) VALUES($1,$2)", [
      clientId,
      `Support request opened: ${subject}`,
    ]);
    return result.rows[0].id;
  });
  revalidatePath(page);
  revalidatePath("/admin/support");
  redirect(`${page}/${id}`);
}
export async function updateTicket(form: FormData) {
  const user = await requireUser();
  const id = field(form, "id", 36);
  if (!uuid.test(id)) throw new Error("Invalid ticket.");
  const body = field(form, "body", 10000),
    status = field(form, "status", 30);
  if (status && !Object.hasOwn(ticketStatuses, status))
    throw new Error("Invalid status.");
  const slug = await transaction(async (db) => {
    const result = await db.query<{
      client_id: string;
      slug: string;
      status: string;
    }>(
      "SELECT t.client_id,c.slug,t.status FROM support_tickets t JOIN clients c ON c.id=t.client_id WHERE t.id=$1 AND ($2='admin' OR EXISTS(SELECT 1 FROM memberships m WHERE m.client_id=t.client_id AND m.user_id=$3)) FOR UPDATE OF t",
      [id, user.role, user.id],
    );
    const ticket = result.rows[0];
    if (!ticket) throw new Error("Ticket unavailable.");
    if (
      user.role !== "admin" &&
      status &&
      !["resolved", "open"].includes(status)
    )
      throw new Error("Only your agency can set that status.");
    if (!body && !status) return ticket.slug;
    if (body)
      await db.query(
        "INSERT INTO ticket_messages(ticket_id,author_id,body) VALUES($1,$2,$3)",
        [id, user.id, body],
      );
    const next =
      status ||
      (body ? (user.role === "admin" ? "waiting" : "open") : ticket.status);
    await db.query(
      "UPDATE support_tickets SET status=$2,updated_at=now() WHERE id=$1",
      [id, next],
    );
    if (next !== ticket.status)
      await db.query("INSERT INTO activities(client_id,label) VALUES($1,$2)", [
        ticket.client_id,
        `Support request ${ticketStatuses[next as keyof typeof ticketStatuses].toLowerCase()}`,
      ]);
    return ticket.slug;
  });
  revalidatePath("/admin/support");
  revalidatePath(`/c/${slug}/support`);
  redirect(`/c/${slug}/support/${id}?saved=1`);
}
