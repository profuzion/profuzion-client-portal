
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import pg from 'pg';

const env = process.env;
const pool = new pg.Pool({
  host: env.PGHOST,
  port: Number(env.PGPORT || 5432),
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
  ssl: env.DATABASE_SSL === 'true'
    ? { rejectUnauthorized: true }
    : undefined,
});
const sqlFile = path.join(path.dirname(fileURLToPath(import.meta.url)), '../db/schema.sql');
const sql = await readFile(sqlFile, 'utf8');
try {
  await pool.query(sql);
  await pool.query(await readFile(path.join(path.dirname(sqlFile), 'brand-schema.sql'), 'utf8'));
  await pool.query(await readFile(path.join(path.dirname(sqlFile), 'portal-schema.sql'), 'utf8'));
  await pool.query(await readFile(path.join(path.dirname(sqlFile), 'assets-schema.sql'), 'utf8'));
  console.log('Database schema ready.');
  const { BOOTSTRAP_ADMIN_EMAIL: email, BOOTSTRAP_ADMIN_PASSWORD: password, BOOTSTRAP_ADMIN_NAME: name } = env;
  if (email && password) {
    if (password.length < 12) throw new Error('Admin password must be at least 12 characters.');
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    const result = await pool.query(
      `INSERT INTO users (email,name,password_hash,role)
       VALUES ($1,$2,$3,'admin') ON CONFLICT (email) DO NOTHING RETURNING id`,
      [email.trim().toLowerCase(), name?.trim() || 'Profuzion Admin', `scrypt:${salt}:${hash}`]);
    console.log(result.rowCount ? 'Admin account created.' : 'Admin already exists; password not changed.');
  } else console.log('No admin created. Add BOOTSTRAP_ADMIN_* variables and re-run this script.');
  // Make the existing agency logos available as private drafts; never overwrite uploads.
  const owner = await pool.query("SELECT id FROM users WHERE role='admin' ORDER BY created_at LIMIT 1");
  if (owner.rows[0]) {
    for (const [id, filename, title, usage] of [
      ['e74776e5-1af4-4c21-bc76-3f2ff2610101', 'PFS_logomark_dark.svg', 'Profuzion logomark — for light backgrounds', 'SVG vector artwork for light backgrounds.'],
      ['e74776e5-1af4-4c21-bc76-3f2ff2610102', 'PFS_logomark_light.svg', 'Profuzion logomark — for dark backgrounds', 'SVG vector artwork for dark backgrounds.'],
    ]) {
      const data = await readFile(path.join(path.dirname(sqlFile), '../public/branding', filename));
      await pool.query("INSERT INTO brand_assets(id,scope,title,category,filename,mime,size_bytes,data,usage_notes,uploaded_by) VALUES($1,'agency',$2,'logos',$3,'image/svg+xml',$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING", [id,title,filename,data.length,data,usage,owner.rows[0].id]);
    }
  }
} finally { await pool.end(); }
