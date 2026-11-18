import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "@/lib/db";
import type { User } from "@/lib/models";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "profuzion_session";
const DAY = 24 * 60 * 60 * 1000;
export const digest = (value: string) => createHash("sha256").update(value).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");

export async function hashPassword(plaintext: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = (await scrypt(plaintext, salt, 64)) as Buffer;
  return `scrypt:${salt}:${hash.toString("hex")}`;
}
export async function checkPassword(plaintext: string, stored: string) {
  const [algo, salt, expected] = stored.split(":");
  if (algo !== "scrypt" || !salt || !expected || !/^[0-9a-f]{128}$/i.test(expected)) return false;
  const actual = (await scrypt(plaintext, salt, 64)) as Buffer;
  return timingSafeEqual(actual, Buffer.from(expected, "hex"));
}
export async function startSession(userId: string) {
  const token = newToken();
  const expires = new Date(Date.now() + 7 * DAY);
  await sql("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,$3)",
    [digest(token), userId, expires]);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", expires,
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await sql("DELETE FROM sessions WHERE token_hash = $1", [digest(token)]);
  jar.delete(SESSION_COOKIE);
}
export async function getUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const result = await sql<User>(
    `SELECT u.id,u.name,u.email,u.role FROM sessions s
     JOIN users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.expires_at > now() LIMIT 1`, [digest(token)]);
  return result[0] ?? null;
}
export async function requireUser() {
  const user = await getUser();
  if (!user) redirect("/login");
  return user;
}
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") redirect("/portal");
  return user;
}
export async function requireClientAccess(slug: string) {
  const user = await requireUser();
  const rows = await sql<{ id: string }>(
    `SELECT c.id FROM clients c WHERE c.slug=$1 AND
      ($2='admin' OR EXISTS
       (SELECT 1 FROM memberships m WHERE m.client_id=c.id AND m.user_id=$3))`,
    [slug, user.role, user.id]);
  if (!rows.length) redirect("/portal");
  return { user, clientId: rows[0].id };
}
