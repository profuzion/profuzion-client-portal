import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { scryptSync, createHash } from "node:crypto";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(root + "/package.json");
const pg = require("pg");
const db = await PGlite.create();
for (let i = 0; i < 2; i++)
  for (const file of [
    "schema.sql",
    "brand-schema.sql",
    "portal-schema.sql",
    "assets-schema.sql",
  ])
    await db.exec(await readFile(root + "/db/" + file, "utf8"));
console.log("PASS repeatable schema migration");
const password = "Portal-Test-Only-7392!";
const hash = `scrypt:test:${scryptSync(password, "test", 64).toString("hex")}`;
const ids = {};
for (const [name, role] of [
  ["admin", "admin"],
  ["client", "client"],
  ["outsider", "client"],
]) {
  const r = await db.query(
    "INSERT INTO users(email,name,password_hash,role) VALUES($1,$2,$3,$4) RETURNING id",
    [
      `${name}@example.test`,
      name === "admin"
        ? "Profuzion Studio"
        : name === "client"
          ? "Jordan Davis"
          : "Other Client",
      hash,
      role,
    ],
  );
  ids[name] = r.rows[0].id;
}
const c = await db.query(
  "INSERT INTO clients(name,slug,industry,description) VALUES('Northline Studio','northline','Architecture','A considered identity and digital experience for a studio building with purpose.') RETURNING id",
);
ids.workspace = c.rows[0].id;
await db.query(
  "INSERT INTO memberships(user_id,client_id,role) VALUES($1,$2,'viewer')",
  [ids.client, ids.workspace],
);
for (const [kind, title, status] of [
  ["proposal", "Project Proposal", "approved"],
  ["strategy", "Brand Strategy", "review"],
  ["identity", "Brand Identity", "in_progress"],
  ["website", "Website", "planned"],
])
  await db.query(
    "INSERT INTO sections(client_id,kind,title,summary,body,status) VALUES($1,$2,$3,$4,$5,$6)",
    [
      ids.workspace,
      kind,
      title,
      "Thoughtful work, from first ideas to the final details.",
      "Your project presentation lives here.",
      status,
    ],
  );
await db.query(
  "INSERT INTO activities(client_id,label) VALUES($1,'Brand strategy ready for review')",
  [ids.workspace],
);
for (const name of ["admin", "client", "outsider"])
  await db.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
    [createHash("sha256").update(`test-${name}`).digest("hex"), ids[name]],
  );
const server = new PGLiteSocketServer({
  db,
  host: "127.0.0.1",
  port: 5545,
  maxConnections: 12,
});
await server.start();
for (let run = 0; run < 2; run++) {
  await new Promise((resolve, reject) => {
    const setup = spawn(process.execPath, [root + "/scripts/setup.js"], {
      cwd: root,
      env: {
        ...process.env,
        PGHOST: "127.0.0.1",
        PGPORT: "5545",
        PGUSER: "postgres",
        PGPASSWORD: "postgres",
        PGDATABASE: "postgres",
        DATABASE_SSL: "false",
        BOOTSTRAP_ADMIN_EMAIL: "",
        BOOTSTRAP_ADMIN_PASSWORD: "",
      },
      stdio: "inherit",
    });
    setup.once("error", reject);
    setup.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Setup script failed")),
    );
  });
}
console.log("PASS setup script and repeatable Profuzion logo seeding");
const app = spawn(
  process.execPath,
  [
    root + "/node_modules/next/dist/bin/next",
    "start",
    "-p",
    "3100",
    "-H",
    "0.0.0.0",
  ],
  {
    cwd: root,
    env: {
      ...process.env,
      PGHOST: "127.0.0.1",
      PGPORT: "5545",
      PGUSER: "postgres",
      PGPASSWORD: "postgres",
      PGDATABASE: "postgres",
      DATABASE_SSL: "false",
      SMTP_HOST: "",
      SMTP_FROM: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
app.stdout.on("data", (d) => process.stdout.write(d));
app.stderr.on("data", (d) => process.stderr.write(d));
const origin = "http://localhost:3100";
async function get(path, who = "admin") {
  const r = await fetch(origin + path, {
    headers: who ? { cookie: `profuzion_session=test-${who}` } : {},
    redirect: "manual",
  });
  return {
    status: r.status,
    location: r.headers.get("location"),
    html: await r.text(),
  };
}
async function post(path, who, html, values, formMatch = () => true) {
  const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/g)].map(
    (m) => m[0],
  );
  const form = forms.find((f) => formMatch(f) && /\$ACTION_/.test(f));
  assert(form, "server action form exists");
  const data = new FormData();
  for (const m of form.matchAll(/<input\b[^>]*>/g)) {
    const n = m[0].match(/name="([^"]*)"/),
      v = m[0].match(/value="([^"]*)"/);
    if (n && (n[1].startsWith("$ACTION_") || m[0].includes('type="hidden"')))
      data.append(n[1], v?.[1] || "");
  }
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  const r = await fetch(origin + path, {
    method: "POST",
    body: data,
    headers: { cookie: `profuzion_session=test-${who}`, origin },
    redirect: "manual",
  });
  return {
    status: r.status,
    location: r.headers.get("location"),
    html: await r.text(),
  };
}
try {
  for (let i = 0; i < 100; i++) {
    try {
      await fetch(origin + "/login");
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  assert.equal((await get("/admin", null)).status, 307);
  assert.equal((await get("/admin/users", "client")).location, "/portal");
  assert.equal(
    (await get("/c/northline/support", "outsider")).location,
    "/portal",
  );
  console.log("PASS unauthenticated and cross-client route isolation");
  const overview = await get("/c/northline", "client");
  assert.equal(overview.status, 200);
  assert(overview.html.includes("portal-dark"));
  const viewerSection = await get("/c/northline/strategy", "client");
  assert(!viewerSection.html.includes("Approve this section"));
  console.log("PASS viewer cannot see owner approval control");
  const create = await get("/admin/users/new");
  let r = await post(
    "/admin/users/new",
    "admin",
    create.html,
    {
      name: "Taylor Test",
      email: "taylor@example.test",
      password,
      role: "client",
      client_id: ids.workspace,
      membership: "owner",
      notify_password_reset: "on",
    },
    (f) => f.includes("Full name"),
  );
  assert.equal(r.status, 303);
  assert(r.location.includes("saved=1"));
  console.log("PASS create client account with workspace and preferences");
  let support = await get("/c/northline/support", "client");
  r = await post(
    "/c/northline/support",
    "client",
    support.html,
    {
      slug: "northline",
      subject: "Update the contact page",
      body: "Could we adjust the opening hours on our contact page?",
      category: "change",
      priority: "high",
    },
    (f) => f.includes('name="subject"'),
  );
  assert.equal(r.status, 303);
  const ticketPath = r.location;
  assert(ticketPath.includes("/support/"));
  console.log("PASS client creates support ticket");
  let thread = await get(ticketPath);
  r = await post(
    ticketPath,
    "admin",
    thread.html,
    { body: "Absolutely. Please send over your updated hours." },
    (f) => f.includes('name="body"'),
  );
  assert.equal(r.status, 303);
  thread = await get(ticketPath, "client");
  assert(thread.html.includes("Waiting for client"));
  assert(thread.html.includes("Absolutely."));
  console.log("PASS agency reply and waiting status");
  r = await post(
    ticketPath,
    "outsider",
    thread.html,
    { body: "forged-cross-tenant-content-829551" },
    (f) => f.includes('name="body"'),
  );
  assert.equal(r.status, 500);
  assert(
    !(await get(ticketPath, "client")).html.includes(
      "forged-cross-tenant-content-829551",
    ),
  );
  console.log("PASS forged cross-client ticket mutation denied");
  r = await post(
    ticketPath,
    "client",
    thread.html,
    { status: "resolved" },
    (f) => f.includes('name="status"'),
  );
  assert.equal(r.status, 303);
  thread = await get(ticketPath, "client");
  assert(thread.html.includes("ticket-resolved"));
  r = await post(
    ticketPath,
    "client",
    thread.html,
    { body: "One more detail to add." },
    (f) => f.includes('name="body"'),
  );
  assert.equal(r.status, 303);
  assert((await get(ticketPath, "client")).html.includes("ticket-open"));
  console.log("PASS resolve and reopen by reply");
  const pool = new pg.Pool({
    host: "127.0.0.1",
    port: 5545,
    user: "postgres",
    password: "postgres",
    database: "postgres",
    max: 1,
  });
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM brand_assets WHERE scope='agency'",
      )
    ).rows[0].n,
    2,
  );
  const target = (
    await pool.query("SELECT * FROM users WHERE email='taylor@example.test'")
  ).rows[0];
  assert.equal(target.notify_password_reset, true);
  await pool.query(
    "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",
    ["a".repeat(64), target.id],
  );
  const edit = await get("/admin/users/" + target.id);
  r = await post(
    "/admin/users/" + target.id,
    "admin",
    edit.html,
    {
      name: target.name,
      email: target.email,
      role: "client",
      client_id: ids.workspace,
      membership: "owner",
      password: "A-New-Test-Password-7392!",
      notify_password_reset: "on",
    },
    (f) => f.includes("Full name"),
  );
  assert.equal(r.status, 303);
  assert(r.location.includes("mail=unconfigured"));
  assert.equal(
    (await pool.query("SELECT * FROM sessions WHERE user_id=$1", [target.id]))
      .rowCount,
    0,
  );
  console.log(
    "PASS password reset revokes sessions and reports unavailable email",
  );
  const settings = await get("/admin/clients/northline/settings");
  r = await post(
    "/admin/clients/northline/settings",
    "admin",
    settings.html,
    {
      name: "Northline Studio",
      industry: "Architecture & interiors",
      description:
        "A considered identity and digital experience for a studio building with purpose.",
      accent: "orange",
    },
    (f) => f.includes('name="industry"'),
  );
  assert.equal(r.status, 303);
  r = await post(
    "/admin/clients/northline/settings",
    "admin",
    settings.html,
    { confirmation: "wrong" },
    (f) => f.includes('name="confirmation"'),
  );
  assert(r.location.includes("error="));
  assert.equal((await get("/c/northline", "client")).status, 200);
  console.log("PASS client settings and deletion confirmation");
  async function assetPost(scope, who, fields, file, includeOrigin = true) {
    const form = new FormData();
    for (const [key, value] of Object.entries(fields)) form.set(key, value);
    if (file) form.set("file", new File([file.data], file.name));
    return fetch(origin + "/api/brand-assets/" + scope, {
      method: "POST",
      body: form,
      headers: {
        cookie: `profuzion_session=test-${who}`,
        ...(includeOrigin ? { origin } : {}),
      },
      redirect: "manual",
    });
  }
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS1sAAAAASUVORK5CYII=",
    "base64",
  );
  let upload = await assetPost(
    "northline",
    "admin",
    {
      title: "Social profile image",
      category: "social",
      rights_confirmed: "on",
      usage_notes: "Approved avatar",
    },
    { name: "avatar.png", data: png },
  );
  assert.equal(upload.status, 303);
  assert(upload.headers.get("location").includes("saved=1"));
  const asset = (
    await pool.query("SELECT id FROM brand_assets WHERE scope=$1", [
      ids.workspace,
    ])
  ).rows[0];
  const assetUrl = "/api/brand-assets/northline/" + asset.id;
  assert.equal((await get(assetUrl, "client")).status, 404);
  assert.equal((await get(assetUrl, "admin")).status, 200);
  assert.equal(
    (await get("/c/northline/brand", "client")).html.includes(
      "Social profile image",
    ),
    false,
  );
  assert.equal(
    (await assetPost("northline", "client", { mode: "publish", id: asset.id }))
      .status,
    403,
  );
  assert.equal(
    (
      await assetPost(
        "northline",
        "admin",
        { mode: "publish", id: asset.id },
        null,
        false,
      )
    ).status,
    403,
  );
  await assetPost("northline", "admin", { mode: "publish", id: asset.id });
  const download = await fetch(origin + assetUrl, {
    headers: { cookie: "profuzion_session=test-client" },
  });
  assert.equal(download.status, 200);
  assert(download.headers.get("content-disposition").startsWith("attachment;"));
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), png);
  assert.equal((await get(assetUrl + "?preview=1", "client")).status, 200);
  assert.equal((await get(assetUrl, "outsider")).status, 404);
  assert.equal(
    (await get("/api/brand-assets/agency/" + asset.id, "client")).status,
    404,
  );
  assert.equal(
    (await get("/api/brand-assets/agency/" + asset.id, "admin")).status,
    404,
  );
  const bundle = await fetch(
    origin + "/api/brand-assets/northline/bundle?category=social",
    { headers: { cookie: "profuzion_session=test-client" } },
  );
  assert.equal(bundle.status, 200);
  const zip = unzipSync(new Uint8Array(await bundle.arrayBuffer()));
  assert.deepEqual(
    Buffer.from(
      Object.entries(zip).find(([name]) => name.endsWith("avatar.png"))[1],
    ),
    png,
  );
  assert(zip["READ-ME.txt"]);
  assert.equal(
    (await get("/api/brand-assets/northline/bundle", "outsider")).status,
    404,
  );
  await assetPost("northline", "admin", { mode: "archive", id: asset.id });
  assert.equal((await get(assetUrl, "admin")).status, 404);
  assert.equal(
    (await get("/api/brand-assets/northline/bundle", "client")).status,
    404,
  );
  await assetPost("northline", "admin", { mode: "restore", id: asset.id });
  assert.equal((await get(assetUrl, "client")).status, 404);
  upload = await assetPost(
    "northline",
    "admin",
    { title: "Invalid font", category: "fonts", rights_confirmed: "on" },
    { name: "font.ttf", data: Buffer.from("not a font") },
  );
  assert(upload.headers.get("location").includes("error="));
  upload = await assetPost(
    "northline",
    "admin",
    { title: "Unlicensed", category: "fonts" },
    { name: "font.ttf", data: Buffer.from([0, 1, 0, 0]) },
  );
  assert(upload.headers.get("location").includes("error="));
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM brand_assets WHERE client_id IS NOT NULL",
      )
    ).rows[0].n,
    1,
  );
  assert.equal((await get("/admin/brand/view", "client")).location, "/portal");
  assert.equal((await get("/admin/brand/view", "admin")).status, 200);
  const kit = {
    name: "Northline Studio",
    tagline: "Build with purpose",
    logo: "",
    logoOnDark: "",
    primary: "#ff641d",
    secondary: "#191a1a",
    sidebar: "#171a1b",
    headingFont: "manrope",
    bodyFont: "system",
    purpose: "Purpose statement",
    audience: "Our audience",
    voice: "Warm and clear",
    logoRules: "Keep clear space",
    imagery: "Natural light",
    messaging: "A message with meaning",
    applications: "Social templates and stationery",
  };
  await pool.query(
    "INSERT INTO brand_kits(scope,client_id,draft,published) VALUES($1,$3::uuid,$2,$2)",
    [ids.workspace, JSON.stringify(kit), ids.workspace],
  );
  const guide = await get("/c/northline/brand", "client");
  assert(guide.html.includes("A message with meaning"));
  assert(guide.html.includes("Social templates and stationery"));
  assert(guide.html.includes("Copy Primary HEX"));
  console.log(
    "PASS asset uploads, draft isolation, publication, download bytes, ZIP content, CSRF, archive/restore, font validation and expanded guides",
  );

  const ticketId = ticketPath.split("/").pop();
  r = await post(
    "/admin/clients/northline/settings",
    "admin",
    settings.html,
    { confirmation: "northline" },
    (f) => f.includes('name="confirmation"'),
  );
  assert.equal(r.status, 303);
  assert.equal(
    (await pool.query("SELECT * FROM support_tickets WHERE id=$1", [ticketId]))
      .rowCount,
    0,
  );
  assert.equal(
    (
      await pool.query("SELECT * FROM ticket_messages WHERE ticket_id=$1", [
        ticketId,
      ])
    ).rowCount,
    0,
  );
  assert.equal(
    (
      await pool.query("SELECT * FROM memberships WHERE client_id=$1", [
        ids.workspace,
      ])
    ).rowCount,
    0,
  );
  assert.equal(
    (await pool.query("SELECT * FROM users WHERE id=$1", [ids.client]))
      .rowCount,
    1,
  );
  assert.equal(
    (
      await pool.query(
        "SELECT count(*)::int AS n FROM brand_assets WHERE client_id IS NOT NULL",
      )
    ).rows[0].n,
    0,
  );
  console.log("PASS workspace deletion cascades and preserves user accounts");
  await pool.end();
  console.log("PASS all portal integration checks");
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  const exited = new Promise((resolve) => app.once("exit", resolve));
  app.kill();
  await exited;
  await server.stop();
  await db.close();
}
