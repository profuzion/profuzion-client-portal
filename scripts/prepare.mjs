// Cloudways creates an app before its PostgreSQL database can be attached.
// Start with a safe setup screen; on redeploy with DATABASE_URL, initialize the schema.
if (process.env.DATABASE_URL) {
  await import("./setup.mjs");
} else {
  console.warn("DATABASE_URL not configured; app will display setup status until database is connected.");
}
