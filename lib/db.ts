import { Pool, type PoolClient, type QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __profuzionPg: Pool | undefined;
}
function getPool() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is missing");
  if (!globalThis.__profuzionPg) {
    globalThis.__profuzionPg = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
      max: 8,
    });
  }
  return globalThis.__profuzionPg;
}
export async function sql<T extends QueryResultRow>(statement: string, params: unknown[] = []): Promise<T[]> {
  const result = await getPool().query<T>(statement, params);
  return result.rows;
}
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally { client.release(); }
}
