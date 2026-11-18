
import { redirect } from "next/navigation";
import { randomBytes, scryptSync } from "node:crypto";
import { sql } from "@/lib/db";

async function createAdmin(formData: FormData) {
  "use server";

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");

  if (!name || !email || !password) {
    throw new Error("Name, email and password are required.");
  }

  if (password.length < 12) {
    throw new Error("Password must be at least 12 characters.");
  }

  // Safety: don't allow this page to create multiple admins.
  const existingAdmins = await sql<{ id: string }>(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );

  if (existingAdmins.length > 0) {
    redirect("/login");
  }

  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  const passwordHash = `scrypt:${salt}:${hash}`;

  await sql(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    [email, name, passwordHash]
  );

  redirect("/login");
}

export default async function SetupAdminPage() {
  const existingAdmins = await sql<{ id: string }>(
    `SELECT id FROM users WHERE role = 'admin' LIMIT 1`
  );

  if (existingAdmins.length > 0) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f5f5f2",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          padding: "40px",
          borderRadius: "20px",
          boxShadow: "0 20px 60px rgba(0,0,0,.08)",
        }}
      >
        <div
          style={{
            fontSize: "13px",
            letterSpacing: "0.14em",
            fontWeight: 700,
            marginBottom: "28px",
          }}
        >
          PROFUZION
        </div>

        <h1
          style={{
            fontSize: "32px",
            lineHeight: 1.1,
            margin: "0 0 10px",
          }}
        >
          Create admin account
        </h1>

        <p
          style={{
            color: "#666",
            lineHeight: 1.6,
            marginBottom: "30px",
          }}
        >
          Create the first administrator for your Profuzion client portal.
        </p>

        <form action={createAdmin}>
          <label style={{ display: "block", marginBottom: "20px" }}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Name
            </span>
            <input
              name="name"
              required
              autoComplete="name"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: "20px" }}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Email
            </span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              style={inputStyle}
            />
          </label>

          <label style={{ display: "block", marginBottom: "26px" }}>
            <span
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 600,
                marginBottom: "8px",
              }}
            >
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            style={{
              width: "100%",
              border: 0,
              borderRadius: "10px",
              padding: "15px 20px",
              background: "#ff641d",
              color: "#fff",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Create Admin Account
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  border: "1px solid #d7d7d2",
  borderRadius: "9px",
  padding: "13px 14px",
  fontSize: "16px",
  background: "#fff",
};
