"use server";
import { requireUser, checkPassword, hashPassword } from "@/lib/auth";
import { sql, transaction } from "@/lib/db";
import { notifyAccount } from "@/lib/notifications";
import { redirect } from "next/navigation";
export async function changePassword(form: FormData) {
  const user = await requireUser();
  const current = String(form.get("current_password") || ""),
    password = String(form.get("password") || "");
  if (password.length < 12 || password.length > 512 || current.length > 512)
    redirect("/account?error=Use+a+password+between+12+and+512+characters.");
  const [record] = await sql<{ password_hash: string }>(
    "SELECT password_hash FROM users WHERE id=$1",
    [user.id],
  );
  if (!record || !(await checkPassword(current, record.password_hash)))
    redirect("/account?error=Your+current+password+did+not+match.");
  const hash = await hashPassword(password);
  const changed = await transaction(async (db) => {
    const r = await db.query(
      "UPDATE users SET password_hash=$2 WHERE id=$1 AND password_hash=$3 RETURNING id",
      [user.id, hash, record.password_hash],
    );
    if (!r.rowCount) return false;
    await db.query("DELETE FROM sessions WHERE user_id=$1", [user.id]);
    return true;
  });
  if (!changed)
    redirect("/account?error=Your+password+changed.+Please+sign+in+again.");
  await notifyAccount(user.id, "password_change");
  redirect("/login?password_changed=1");
}
