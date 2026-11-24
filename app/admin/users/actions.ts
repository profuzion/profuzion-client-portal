"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { notifyAccount } from "@/lib/notifications";
import { accountInput, field, uuid } from "@/lib/portal-validation";
export async function saveUser(form: FormData) {
  const admin = await requireAdmin();
  const id = field(form, "id", 36);
  const path = id ? `/admin/users/${id}` : "/admin/users/new";
  let input;
  try {
    input = accountInput(form);
    if (id && !uuid.test(id)) throw new Error("Invalid user.");
    if (!id && !input.password)
      throw new Error("Set a password for the new account.");
    if (id === admin.id && input.role !== "admin")
      throw new Error("You cannot remove your own administrator access.");
  } catch (e) {
    redirect(`${path}?error=${encodeURIComponent((e as Error).message)}`);
  }
  const flags = [
    "notify_welcome",
    "notify_password_change",
    "notify_password_reset",
  ].map((k) => form.get(k) === "on");
  const hash = input.password ? await hashPassword(input.password) : null;
  let userId: string;
  try {
    userId = await transaction(async (db) => {
      if (input.role === "client") {
        const c = await db.query(
          "SELECT id FROM clients WHERE id=$1 FOR SHARE",
          [input.clientId],
        );
        if (!c.rowCount) throw new Error("Client no longer exists.");
      }
      let target = id;
      if (id) {
        const old = await db.query(
          "SELECT role FROM users WHERE id=$1 FOR UPDATE",
          [id],
        );
        if (!old.rowCount) throw new Error("User not found.");
        // Role changes to existing administrators are deliberately handled separately.
        if (old.rows[0].role === "admin" && input.role !== "admin")
          throw new Error(
            "Existing administrators must retain administrator access.",
          );
        await db.query(
          "UPDATE users SET name=$2,email=$3,role=$4,password_hash=COALESCE($5,password_hash),notify_welcome=$6,notify_password_change=$7,notify_password_reset=$8 WHERE id=$1",
          [id, input.name, input.email, input.role, hash, ...flags],
        );
        if (hash) await db.query("DELETE FROM sessions WHERE user_id=$1", [id]);
      } else {
        const r = await db.query(
          "INSERT INTO users(name,email,role,password_hash,notify_welcome,notify_password_change,notify_password_reset) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
          [input.name, input.email, input.role, hash, ...flags],
        );
        target = r.rows[0].id;
      }
      if (input.role === "client")
        await db.query(
          "INSERT INTO memberships(user_id,client_id,role) VALUES($1,$2,$3) ON CONFLICT(user_id,client_id) DO UPDATE SET role=excluded.role",
          [target, input.clientId, input.membership],
        );
      return target;
    });
  } catch (e) {
    const message =
      (e as { code?: string }).code === "23505"
        ? "That email already has an account."
        : "Could not save this user. Check the account and workspace, then try again.";
    redirect(`${path}?error=${encodeURIComponent(message)}`);
  }
  const mail =
    !id || hash
      ? await notifyAccount(userId, !id ? "welcome" : "password_reset")
      : "disabled";
  revalidatePath("/admin/users");
  redirect(`/admin/users?saved=1&mail=${mail}`);
}
export async function removeMembership(form: FormData) {
  await requireAdmin();
  const id = field(form, "id", 36),
    clientId = field(form, "client_id", 36);
  if (!uuid.test(id) || !uuid.test(clientId))
    throw new Error("Invalid membership");
  await transaction(async (db) => {
    await db.query(
      "DELETE FROM memberships WHERE user_id=$1 AND client_id=$2",
      [id, clientId],
    );
    await db.query("DELETE FROM sessions WHERE user_id=$1", [id]);
  });
  revalidatePath(`/admin/users/${id}`);
  redirect(`/admin/users/${id}?saved=1`);
}
