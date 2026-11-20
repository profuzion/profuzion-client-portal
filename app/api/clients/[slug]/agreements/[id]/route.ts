import { requireClientAccess } from "@/lib/auth";
import { agreementsReady } from "@/lib/agreements";
import { sql } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(request: Request, { params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { user, clientId } = await requireClientAccess(slug);
  const headers = { "Cache-Control": "private, no-store", "Vary": "Cookie", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow", "Referrer-Policy": "no-referrer" };
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || !await agreementsReady()) return new Response(null, { status: 404, headers });
  const [document] = await sql<{ pdf: Buffer }>("SELECT pdf FROM signed_agreements WHERE id=$1 AND client_id=$2 AND ($3 OR published)", [id, clientId, user.role === "admin"]);
  if (!document) return new Response(null, { status: 404, headers });
  const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(new Uint8Array(document.pdf), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `${disposition}; filename="signed-agreement.pdf"` } });
}
