import nodemailer from "nodemailer";
import { sql } from "@/lib/db";
export const emailConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
export async function notifyAccount(
  userId: string,
  kind: "welcome" | "password_change" | "password_reset",
) {
  const [user] = await sql<{
    email: string;
    name: string;
    notify_welcome: boolean;
    notify_password_change: boolean;
    notify_password_reset: boolean;
  }>(
    "SELECT email,name,notify_welcome,notify_password_change,notify_password_reset FROM users WHERE id=$1",
    [userId],
  );
  if (!user || !user[`notify_${kind}`]) return "disabled";
  if (!emailConfigured()) return "unconfigured";
  const subjects = {
    welcome: "Your Profuzion workspace is ready",
    password_change: "Your Profuzion password was changed",
    password_reset: "Your Profuzion password was reset",
  };
  const text =
    kind === "welcome"
      ? "Your account is ready. Your agency contact will share your login details separately."
      : "An administrator updated your password. Contact Profuzion if you were not expecting this change. Your login details will be shared separately.";
  try {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      requireTLS: process.env.SMTP_SECURE !== "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: subjects[kind],
      text: `Hello ${user.name},\n\n${text}\n\nProfuzion Studio`,
    });
    return "sent";
  } catch {
    return "failed";
  }
}
