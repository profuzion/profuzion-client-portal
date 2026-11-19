import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, beforeEach, test } from "node:test";
import { build } from "esbuild";
import { PGlite } from "@electric-sql/pglite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const adminId = "00000000-0000-4000-8000-000000000001";
const userId = "00000000-0000-4000-8000-000000000002";
const clientId = "00000000-0000-4000-8000-000000000003";
const otherId = "00000000-0000-4000-8000-000000000004";
const missingId = "00000000-0000-4000-8000-000000000099";
const name = "Winkler Overhead Doors";
const emptyState = { values: {}, errors: {}, message: "" };
let db, actions, validation;

function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    name, industry: "Doors", description: "Project summary", slug: "winkler",
    accent: "orange", website_preview_url: "https://preview.example.com", ...overrides,
  })) data.set(key, value);
  return data;
}
function confirm(value = name) {
  const data = new FormData(); data.set("confirmation", value); return data;
}
function redirected(target) {
  return (error) => error.message === `REDIRECT:${target}`;
}
async function row(id = clientId) {
  return (await db.query("SELECT * FROM clients WHERE id=$1", [id])).rows[0];
}
async function counts() {
  const result = {};
  for (const table of ["clients", "sections", "memberships", "activities", "invitations", "section_approvals", "users", "sessions", "failed_logins"]) {
    result[table] = Number((await db.query(`SELECT count(*) FROM ${table}`)).rows[0].count);
  }
  return result;
}

before(async () => {
  // Uses an isolated in-memory PostgreSQL engine. No deployed database is used.
  db = new PGlite();
  await db.exec(await readFile(path.join(root, "db/schema.sql"), "utf8"));
  globalThis.__profuzionTest = { token: "admin-token", invalidations: [] };
  let connectionQueue = Promise.resolve();
  globalThis.__profuzionPg = {
    query: (...args) => db.query(...args),
    async connect() {
      const prior = connectionQueue;
      let release;
      connectionQueue = new Promise((resolve) => { release = resolve; });
      await prior;
      return { query: (...args) => db.query(...args), release };
    },
  };
  // Only Next.js request-bound APIs are replaced. Auth, database transactions,
  // validation and Server Actions are the actual application implementations.
  const bundle = await build({
    entryPoints: [path.join(root, "app/admin/clients/[slug]/settings/actions.ts")],
    bundle: true, platform: "node", format: "esm", write: false,
    plugins: [{ name: "request-context", setup(builder) {
      builder.onResolve({ filter: /^next\/(headers|navigation|cache)$/ }, ({ path }) => ({ path, namespace: "request-context" }));
      builder.onLoad({ filter: /.*/, namespace: "request-context" }, ({ path }) => ({ contents:
        path === "next/headers" ? `export async function cookies() { return { get: () => globalThis.__profuzionTest.token ? { value: globalThis.__profuzionTest.token } : undefined }; }` :
        path === "next/navigation" ? `export function redirect(target) { throw new Error("REDIRECT:" + target); }` :
        `export function revalidatePath(...args) { globalThis.__profuzionTest.invalidations.push(args); }`, loader: "js" }));
      // The existing db.ts uses the injected pool above, never creates this Pool.
      builder.onResolve({ filter: /^pg$/ }, () => ({ path: "pg", namespace: "no-network" }));
      builder.onLoad({ filter: /.*/, namespace: "no-network" }, () => ({ contents: `export class Pool { constructor() { throw new Error("Unexpected external database access"); } }`, loader: "js" }));
    } }],
  });
  const validationBundle = await build({ entryPoints: [path.join(root, "lib/client-settings-validation.ts")], bundle: true, platform: "node", format: "esm", write: false });
  actions = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString("base64")}`);
  validation = await import(`data:text/javascript;base64,${Buffer.from(validationBundle.outputFiles[0].text).toString("base64")}`);
});

beforeEach(async () => {
  globalThis.__profuzionTest.token = "admin-token";
  globalThis.__profuzionTest.invalidations = [];
  await db.exec("TRUNCATE users, clients, failed_logins RESTART IDENTITY CASCADE");
  await db.query("INSERT INTO users (id,email,name,password_hash,role) VALUES ($1,'admin@example.test','Test Admin','unused','admin'), ($2,'client@example.test','Shared User','unused','client')", [adminId, userId]);
  for (const [token, id] of [["admin-token", adminId], ["client-token", userId]]) {
    await db.query("INSERT INTO sessions (token_hash,user_id,expires_at) VALUES ($1,$2,now()+interval '1 day')", [createHash("sha256").update(token).digest("hex"), id]);
  }
  await db.query("INSERT INTO clients (id,slug,name,industry,description) VALUES ($1,'winkler',$2,'Doors','Original summary'),($3,'other','Other Client','','')", [clientId, name, otherId]);
  for (const id of [clientId, otherId]) {
    await db.query("INSERT INTO memberships (user_id,client_id) VALUES ($1,$2)", [userId, id]);
    const section = await db.query("INSERT INTO sections (client_id,kind,title) VALUES ($1,'proposal','Proposal') RETURNING id", [id]);
    await db.query("INSERT INTO section_approvals (section_id,approved_by) VALUES ($1,$2)", [section.rows[0].id, userId]);
    await db.query("INSERT INTO activities (client_id,label) VALUES ($1,'Created')", [id]);
    await db.query("INSERT INTO invitations (token_hash,email,client_id,expires_at) VALUES ($1,'invite@example.test',$2,now()+interval '1 day')", [id.replaceAll("-", "").padEnd(64,"0"), id]);
  }
  await db.query("INSERT INTO failed_logins (email) VALUES ('client@example.test')");
});

after(async () => {
  await db?.close();
  delete globalThis.__profuzionPg;
  delete globalThis.__profuzionTest;
});

test("validates required name, supported palette, slug syntax and reserved route", () => {
  for (const fields of [{ name: " " }, { slug: "../admin" }, { slug: "new" }, { slug: "Uppercase" }, { accent: "red" }, { accent: "__proto__" }]) {
    assert.ok(Object.keys(validation.validateClientSettings(form(fields)).errors).length);
  }
  for (const accent of ["orange", "blue", "green", "violet"]) assert.deepEqual(validation.validateClientSettings(form({ accent })).errors, {});
});

test("rejects non-HTTPS URLs, credentials, malformed URLs, duplicate fields, files and controls", () => {
  for (const url of ["http://example.com", "javascript:alert(1)", "//example.com", "https://me:secret@example.com", "https:example.com", "https://example.com/a b"]) {
    assert.ok(validation.validateClientSettings(form({ website_preview_url: url })).errors.website_preview_url);
  }
  const duplicate = form(); duplicate.append("name", "Different");
  assert.ok(validation.validateClientSettings(duplicate).errors.name);
  const file = form(); file.set("description", new Blob(["text"]), "file.txt");
  assert.ok(validation.validateClientSettings(file).errors.description);
  assert.ok(validation.validateClientSettings(form({ description: "bad\0value" })).errors.description);
});

test("enforces all existing field length limits without silently truncating", () => {
  for (const [key, limit] of Object.entries(validation.CLIENT_SETTINGS_LIMITS)) {
    const result = validation.validateClientSettings(form({ [key]: "x".repeat(limit + 1) }));
    assert.ok(result.errors[key]);
    assert.equal(result.values[key].length, limit + 1);
  }
});

for (const [token, target] of [[undefined, "/login"], ["client-token", "/portal"]]) {
  test(`save and delete reject ${token ?? "anonymous"} through actual requireAdmin`, async () => {
    globalThis.__profuzionTest.token = token;
    const beforeCounts = await counts();
    await assert.rejects(actions.updateClientAction(clientId, emptyState, form()), redirected(target));
    await assert.rejects(actions.deleteClientAction(clientId, { message: "" }, confirm()), redirected(target));
    assert.deepEqual(await counts(), beforeCounts);
    assert.equal((await row()).description, "Original summary");
  });
}

test("expired admin session cannot mutate", async () => {
  await db.query("UPDATE sessions SET expires_at = now() - interval '1 day' WHERE user_id=$1", [adminId]);
  await assert.rejects(actions.deleteClientAction(clientId, { message: "" }, confirm()), redirected("/login"));
  assert.ok(await row());
});

test("invalid IDs and missing clients produce safe errors", async () => {
  for (const id of ["invalid", missingId]) {
    assert.ok((await actions.updateClientAction(id, emptyState, form())).message);
    assert.ok((await actions.deleteClientAction(id, { message: "" }, confirm())).message);
  }
  assert.ok(await row());
});

test("save updates every setting, preserves ID, adds activity, redirects to new slug and invalidates views", async () => {
  await assert.rejects(actions.updateClientAction(clientId, emptyState, form({
    name: "Updated Client", industry: "Construction", description: "Updated summary", slug: "new-winkler",
    accent: "violet", website_preview_url: "https://new.example.com/preview",
  })), redirected("/admin/clients/new-winkler?saved=1"));
  const client = await row();
  assert.equal(client.name, "Updated Client"); assert.equal(client.industry, "Construction");
  assert.equal(client.description, "Updated summary"); assert.equal(client.slug, "new-winkler");
  assert.equal(client.accent, "violet"); assert.equal(client.website_preview_url, "https://new.example.com/preview");
  assert.equal((await counts()).activities, 3);
  assert.deepEqual(globalThis.__profuzionTest.invalidations, [["/admin", "layout"], ["/portal", "layout"], ["/c/[slug]", "layout"]]);
  assert.equal((await db.query("SELECT * FROM clients WHERE slug='winkler'")).rows.length, 0);
});

test("same slug is accepted and empty optional fields clear correctly", async () => {
  await assert.rejects(actions.updateClientAction(clientId, emptyState, form({ industry: "", description: "", website_preview_url: "" })), redirected("/admin/clients/winkler?saved=1"));
  const client = await row();
  assert.equal(client.website_preview_url, null); assert.equal(client.industry, ""); assert.equal(client.description, "");
});

test("duplicate slug returns a field error and rolls back every change", async () => {
  const beforeRow = await row();
  const beforeCounts = await counts();
  const result = await actions.updateClientAction(clientId, emptyState, form({ name: "Should roll back", slug: "other" }));
  assert.ok(result.errors.slug); assert.equal(result.values.name, "Should roll back");
  assert.deepEqual(await row(), beforeRow); assert.deepEqual(await counts(), beforeCounts);
});

test("two competing slug claims cannot create duplicate clients", async () => {
  const result = await Promise.allSettled([
    actions.updateClientAction(clientId, emptyState, form({ slug: "shared-slug" })),
    actions.updateClientAction(otherId, emptyState, form({ slug: "shared-slug" })),
  ]);
  assert.equal(result.filter((item) => item.status === "fulfilled" && item.value.errors.slug).length, 1);
  assert.equal((await db.query("SELECT id FROM clients WHERE slug='shared-slug'")).rows.length, 1);
});

test("parameterized values cannot inject SQL", async () => {
  const maliciousName = "A'; DELETE FROM users; --";
  await assert.rejects(actions.updateClientAction(clientId, emptyState, form({ name: maliciousName })), redirected("/admin/clients/winkler?saved=1"));
  assert.equal((await row()).name, maliciousName); assert.equal((await counts()).users, 2);
});

test("wrong, empty, case-changed and padded confirmations leave all rows intact", async () => {
  const original = await counts();
  for (const value of ["", "Other Client", name.toLowerCase(), ` ${name}`, `${name} `]) {
    assert.ok((await actions.deleteClientAction(clientId, { message: "" }, confirm(value))).message);
    assert.deepEqual(await counts(), original);
  }
});

test("delete rejects duplicate confirmations and checks the current name after rename", async () => {
  const duplicate = confirm(); duplicate.append("confirmation", name);
  assert.ok((await actions.deleteClientAction(clientId, { message: "" }, duplicate)).message);
  await db.query("UPDATE clients SET name='Renamed Client' WHERE id=$1", [clientId]);
  const result = await actions.deleteClientAction(clientId, { message: "" }, confirm());
  assert.match(result.message, /current name/); assert.ok(await row());
});

test("delete cascades only the target workspace and keeps shared users, sessions and other client data", async () => {
  await assert.rejects(actions.deleteClientAction(clientId, { message: "" }, confirm()), redirected("/admin"));
  assert.equal(await row(), undefined); assert.equal((await row(otherId)).name, "Other Client");
  assert.deepEqual(await counts(), {
    clients: 1, sections: 1, memberships: 1, activities: 1, invitations: 1, section_approvals: 1,
    users: 2, sessions: 2, failed_logins: 1,
  });
});

test("a restrictive dependent FK rolls back the client deletion and all cascades", async () => {
  await db.exec("CREATE TABLE test_delete_blocker (client_id uuid REFERENCES clients(id) ON DELETE RESTRICT)");
  try {
    await db.query("INSERT INTO test_delete_blocker VALUES ($1)", [clientId]);
    const original = await counts();
    const result = await actions.deleteClientAction(clientId, { message: "" }, confirm());
    assert.match(result.message, /Related records prevented deletion/);
    assert.deepEqual(await counts(), original);
  } finally { await db.exec("DROP TABLE test_delete_blocker"); }
});

test("failure to record activity rolls back the settings update", async () => {
  await db.exec("CREATE FUNCTION test_block_activity() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$; CREATE TRIGGER test_block_activity BEFORE INSERT ON activities FOR EACH ROW EXECUTE FUNCTION test_block_activity();");
  try {
    const original = await row();
    const result = await actions.updateClientAction(clientId, emptyState, form({ name: "Not saved" }));
    assert.match(result.message, /couldn't save/); assert.deepEqual(await row(), original);
  } finally { await db.exec("DROP TRIGGER test_block_activity ON activities; DROP FUNCTION test_block_activity();"); }
});
