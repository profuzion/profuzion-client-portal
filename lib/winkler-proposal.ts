import { createHash } from "node:crypto";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { sql, transaction } from "./db";

const compress = promisify(gzip);
const decompress = promisify(gunzip);
export const clientSlug = "winkler-overhead-doors";
export const clientName = "Winkler Overhead Doors";
export const packageBytes = 7483552;
export const packageDigest = "4c7e9d75487bd34baa67b4afe2956f045163cdffe9af080d87f2d14d6804a4e0";
export const scriptDigest = "FUwqzLcaYgOs/FmdsNeBcrDKz2sqfDsFDfiWtJk5li0=";

async function attachmentTableExists() {
  const [result] = await sql<{ present: boolean }>(
    "SELECT to_regclass('public.proposal_presentations') IS NOT NULL AS present"
  );
  return result.present;
}

export async function hasPresentation(sectionId: string) {
  if (!(await attachmentTableExists())) return false;
  const rows = await sql(
    "SELECT 1 FROM public.proposal_presentations WHERE section_id=$1 AND digest=$2",
    [sectionId, packageDigest]
  );
  return rows.length > 0;
}

export async function readPresentation(clientId: string) {
  if (!(await attachmentTableExists())) return null;
  const [record] = await sql<{ document_gzip: Buffer }>(
    `SELECT p.document_gzip FROM public.proposal_presentations p
     JOIN sections s ON s.id=p.section_id
     WHERE s.client_id=$1 AND s.kind='proposal' AND p.digest=$2`,
    [clientId, packageDigest]
  );
  return record ? (await decompress(record.document_gzip)).toString("utf8") : null;
}

export async function attachPresentation(bytes: Buffer, expectedSectionId: string) {
  if (bytes.length !== packageBytes || createHash("sha256").update(bytes).digest("hex") !== packageDigest) {
    return "wrong-file";
  }
  const document = await compress(bytes);
  return transaction(async (db) => {
    const target = await db.query<{ id: string; client_id: string; status: string }>(
      `SELECT s.id,s.client_id,s.status FROM sections s JOIN clients c ON c.id=s.client_id
       WHERE c.slug=$1 AND c.name=$2 AND s.kind='proposal' AND s.id=$3
       FOR UPDATE OF c,s`, [clientSlug, clientName, expectedSectionId]
    );
    const section = target.rows[0];
    if (!section) return "wrong-workspace";
    // This optional table first becomes necessary when an administrator attaches the file.
    // Its foreign key keeps the attachment bound to the original section through slug changes.
    await db.query(`CREATE TABLE IF NOT EXISTS public.proposal_presentations (
      section_id uuid PRIMARY KEY REFERENCES sections(id) ON DELETE CASCADE,
      digest text NOT NULL UNIQUE,
      document_gzip bytea NOT NULL
    )`);
    const prior = await db.query<{ section_id: string; digest: string }>("SELECT section_id,digest FROM public.proposal_presentations WHERE section_id=$1 OR digest=$2", [section.id, packageDigest]);
    if (prior.rowCount) {
      return prior.rows.length === 1 && prior.rows[0].section_id === section.id && prior.rows[0].digest === packageDigest ? "attached" : "conflict";
    }
    const approvals = await db.query("SELECT 1 FROM section_approvals WHERE section_id=$1 LIMIT 1", [section.id]);
    if (section.status === "approved" || approvals.rowCount) return "already-approved";
    await db.query("INSERT INTO public.proposal_presentations(section_id,digest,document_gzip) VALUES ($1,$2,$3)", [section.id, packageDigest, document]);
    await db.query("INSERT INTO activities(client_id,label) VALUES ($1,$2)", [section.client_id, "Interactive proposal attached"]);
    return "attached";
  });
}
