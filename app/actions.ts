"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, transaction } from "@/lib/db";
import { requireAdmin, requireUser, digest, newToken, hashPassword, checkPassword, startSession, endSession } from "@/lib/auth";
import { sectionTemplates, sectionOrder, statuses } from "@/lib/models";

function value(form: FormData, key: string, max = 6000) {
  return String(form.get(key) ?? "").trim().slice(0, max);
}
function emailOf(form: FormData) { return value(form, "email", 254).toLowerCase(); }
function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export async function loginAction(form: FormData) {
  const email = emailOf(form);
  const password = String(form.get("password") ?? "").slice(0, 512);
  if (!email || !password) fail("/login", "Enter your email and password.");
  const [{ attempts }] = await sql<{ attempts: string }>(
    "SELECT COUNT(*)::text AS attempts FROM failed_logins WHERE email=$1 AND occurred_at > now() - interval '15 minutes'", [email]);
  if (Number(attempts) >= 8) fail("/login", "Too many attempts. Try again in 15 minutes.");
  const rows = await sql<{ id: string; password_hash: string; role: string }>(
    "SELECT id,password_hash,role FROM users WHERE email=$1 LIMIT 1", [email]);
  const valid = rows[0] ? await checkPassword(password, rows[0].password_hash) : false;
  if (!valid) {
    await sql("INSERT INTO failed_logins (email) VALUES ($1)", [email]);
    fail("/login", "The credentials did not match.");
  }
  await sql("DELETE FROM failed_logins WHERE email=$1", [email]);
  await startSession(rows[0].id);
  redirect(rows[0].role === "admin" ? "/admin" : "/portal");
}
export async function logoutAction() {
  await endSession();
  redirect("/login");
}
export async function createClientAction(form: FormData) {
  const user = await requireAdmin();
  const name = value(form, "name", 150);
  const slug = value(form, "slug", 65).toLowerCase();
  const industry = value(form, "industry", 100);
  const description = value(form, "description", 600);
  const accent = value(form, "accent", 20);
  if (!name || !slugPattern.test(slug)) fail("/admin/clients/new", "Enter a client name and a valid URL slug.");
  const exists = await sql("SELECT id FROM clients WHERE slug=$1", [slug]);
  if (exists.length) fail("/admin/clients/new", "That client URL slug is already in use.");
  await transaction(async (db) => {
    const res = await db.query<{ id: string }>(
      `INSERT INTO clients (name,slug,industry,description,accent) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, slug, industry, description, ["orange", "blue", "green", "violet"].includes(accent) ? accent : "orange"]);
    const id = res.rows[0].id;
    for (const kind of sectionOrder) {
      const t = sectionTemplates[kind];
      await db.query(
        `INSERT INTO sections (client_id,kind,title,summary,body,status) VALUES ($1,$2,$3,$4,$5,'planned')`,
        [id, kind, t.title, t.summary, t.prompt]);
    }
    await db.query("INSERT INTO activities (client_id,label) VALUES ($1,$2)",
      [id, `Client workspace created by ${user.name}`]);
  });
  revalidatePath("/admin");
  redirect(`/admin/clients/${slug}`);
}
export async function updateSectionAction(form: FormData) {
  await requireAdmin();
  const slug = value(form, "slug", 65);
  const kind = value(form, "kind", 30);
  const title = value(form, "title", 120);
  const summary = value(form, "summary", 400);
  const body = value(form, "body", 18000);
  const status = value(form, "status", 20);
  const target = `/admin/clients/${slug}/${kind}`;
  if (!slugPattern.test(slug) || !sectionOrder.includes(kind as typeof sectionOrder[number]) ||
      !title || !statuses.includes(status as typeof statuses[number])) {
    fail(target, "Check the title and status fields.");
  }
  const changed = await sql<{ id: string; client_id: string }>(
    `UPDATE sections SET title=$1,summary=$2,body=$3,status=$4,updated_at=now()
       WHERE client_id=(SELECT id FROM clients WHERE slug=$5) AND kind=$6 RETURNING id,client_id`,
    [title,summary,body,status,slug,kind]);
  if (!changed.length) fail(target, "Section not found.");
  await sql("INSERT INTO activities (client_id,label) VALUES ($1,$2)",
    [changed[0].client_id, `${title} updated`]);
  revalidatePath(`/c/${slug}`);
  revalidatePath(target);
  redirect(`/admin/clients/${slug}?saved=1`);
}
export async function updatePreviewAction(form: FormData) {
  await requireAdmin();
  const slug = value(form, "slug", 65);
  let preview = value(form, "website_preview_url", 1000);
  if (preview) {
    try { const parsed = new URL(preview); if (parsed.protocol !== "https:") throw new Error(); }
    catch { fail(`/admin/clients/${slug}`, "The preview URL must start with https://"); }
  }
  await sql("UPDATE clients SET website_preview_url=$1 WHERE slug=$2", [preview || null, slug]);
  revalidatePath(`/c/${slug}`);
  redirect(`/admin/clients/${slug}?saved=1`);
}
export async function createInvitationAction(form: FormData) {
  await requireAdmin();
  const slug = value(form, "slug", 65);
  const email = emailOf(form);
  const page = `/admin/clients/${slug}`;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(page, "Enter a valid email address.");
  const clients = await sql<{ id: string }>("SELECT id FROM clients WHERE slug=$1", [slug]);
  if (!clients[0]) fail(page, "Client not found.");
  const existing = await sql("SELECT id FROM users WHERE email=$1", [email]);
  if (existing.length) fail(page, "This email already has an account. Multi-workspace invitations are not enabled yet.");
  const token = newToken();
  await sql(
    `INSERT INTO invitations (token_hash,email,client_id,expires_at)
       VALUES ($1,$2,$3,now() + interval '7 days')`,
    [digest(token),email,clients[0].id]);
  const origin = process.env.APP_BASE_URL?.replace(/\/$/, "") ?? "";
  const inviteUrl = `${origin}/invite/${token}`;
  redirect(`${page}?invite=${encodeURIComponent(inviteUrl)}`);
}
export async function acceptInvitationAction(form: FormData) {
  const token = value(form, "token", 256);
  const name = value(form, "name", 150);
  const password = String(form.get("password") ?? "").slice(0, 512);
  const page = `/invite/${encodeURIComponent(token)}`;
  if (!name || password.length < 12) fail(page, "Enter your name and a password of at least 12 characters.");
  const hash = await hashPassword(password);
  let newUserId: string;
  try {
    newUserId = await transaction(async (db) => {
      const r = await db.query<{ token_hash: string; email: string; client_id: string }>(
        `SELECT token_hash,email,client_id FROM invitations
         WHERE token_hash=$1 AND used_at IS NULL AND expires_at > now() FOR UPDATE`, [digest(token)]);
      if (!r.rows[0]) throw new Error("This invitation has expired or has already been used.");
      const invite = r.rows[0];
      const created = await db.query<{ id: string }>(
        `INSERT INTO users (email,name,password_hash,role) VALUES ($1,$2,$3,'client') RETURNING id`,
        [invite.email,name,hash]);
      const userId = created.rows[0].id;
      await db.query("INSERT INTO memberships (user_id,client_id,role) VALUES ($1,$2,'owner')",
        [userId,invite.client_id]);
      await db.query("UPDATE invitations SET used_at=now() WHERE token_hash=$1", [digest(token)]);
      await db.query("INSERT INTO activities (client_id,label) VALUES ($1,$2)",
        [invite.client_id,"Client account activated"]);
      return userId;
    });
  } catch (error) {
    const msg = error instanceof Error && error.message.startsWith("This invitation") ? error.message : "Unable to accept invitation. Please contact Profuzion.";
    fail(page, msg);
  }
  await startSession(newUserId);
  redirect("/portal");
}

export async function approveSectionAction(form: FormData) {
  const user = await requireUser();
  const slug = value(form, "slug", 65);
  const kind = value(form, "kind", 30);
  if (user.role !== "client" || !slugPattern.test(slug) ||
      !sectionOrder.includes(kind as typeof sectionOrder[number])) redirect("/portal");
  // Every mutation verifies membership and current status within the database transaction.
  await transaction(async db => {
    const found = await db.query<{ id: string; client_id: string; title: string }>(
      `SELECT s.id,s.client_id,s.title FROM sections s
       JOIN clients c ON c.id=s.client_id
       JOIN memberships m ON m.client_id=s.client_id
       WHERE c.slug=$1 AND s.kind=$2 AND s.status='review'
         AND m.user_id=$3 AND m.role='owner' FOR UPDATE OF s`, [slug,kind,user.id]);
    if (!found.rows[0]) return;
    const section=found.rows[0];
    await db.query("UPDATE sections SET status='approved',updated_at=now() WHERE id=$1",[section.id]);
    await db.query("INSERT INTO section_approvals (section_id,approved_by) VALUES ($1,$2)",[section.id,user.id]);
    await db.query("INSERT INTO activities (client_id,label) VALUES ($1,$2)",
      [section.client_id,`${section.title} approved by ${user.name}`]);
  });
  revalidatePath(`/c/${slug}`);
  revalidatePath(`/c/${slug}/${kind}`);
  redirect(`/c/${slug}/${kind}?approved=1`);
}
