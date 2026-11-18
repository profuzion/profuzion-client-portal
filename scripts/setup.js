
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
} finally { await pool.end(); }
