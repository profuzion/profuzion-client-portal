export const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ticketStatuses = {
  open: "Open",
  in_progress: "In progress",
  waiting: "Waiting for client",
  resolved: "Resolved",
} as const;
export const ticketCategories = {
  change: "Change request",
  question: "Question",
  issue: "Troubleshooting",
} as const;
export function field(form: FormData, key: string, max = 10000) {
  const result = String(form.get(key) ?? "").trim();
  if (result.length > max)
    throw new Error("A field exceeds its maximum length.");
  return result;
}
export function accountInput(form: FormData) {
  const name = field(form, "name", 150),
    email = field(form, "email", 254).toLowerCase(),
    password = String(form.get("password") ?? "");
  const role = field(form, "role", 20),
    clientId = field(form, "client_id", 36),
    membership = field(form, "membership", 20);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a name and valid email address.");
  if (password && (password.length < 12 || password.length > 512))
    throw new Error("Use a password between 12 and 512 characters.");
  if (!["admin", "client"].includes(role))
    throw new Error("Choose an account role.");
  if (
    role === "client" &&
    (!uuid.test(clientId) || !["owner", "viewer"].includes(membership))
  )
    throw new Error("Choose a client workspace and access level.");
  return { name, email, password, role, clientId, membership };
}
