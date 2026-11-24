// Apply repeatable migrations before serving the new application.
if (process.env.PGHOST && process.env.PGDATABASE) {
  await import("./setup.js");
} else {
  console.warn("PostgreSQL is not configured. Set PGHOST and PGDATABASE before running database setup.");
}
