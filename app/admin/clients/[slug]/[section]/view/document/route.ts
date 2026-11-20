import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { readPresentation, presentationScripts } from "@/lib/winkler-proposal";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; section: string }> }) {
  await requireAdmin();
  const { slug, section } = await params;
  if (section !== "proposal") return new Response(null, { status: 404 });
  const client = await getClient(slug);
  const html = await readPresentation(client.id);
  return new Response(html, { status: html ? 200 : 404, headers: {
    "Cache-Control": "private, no-store",
    "Vary": "Cookie",
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": `sandbox allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src ${presentationScripts(html)}; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'; frame-ancestors 'self'`,
  }});
}
