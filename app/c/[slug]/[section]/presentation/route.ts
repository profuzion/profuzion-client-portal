import { requireClientAccess } from "@/lib/auth";
import { readPresentation, scriptDigest } from "@/lib/winkler-proposal";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string; section: string }> }) {
  const { slug, section } = await params;
  if (section !== "proposal") return new Response(null, { status: 404 });
  const { clientId } = await requireClientAccess(slug);
  const html = await readPresentation(clientId);
  const headers = {
    "Cache-Control": "private, no-store",
    "Vary": "Cookie",
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": "noindex, nofollow",
    "Content-Security-Policy": `sandbox allow-scripts allow-modals allow-popups allow-popups-to-escape-sandbox; default-src 'none'; script-src 'sha256-${scriptDigest}'; style-src 'unsafe-inline'; img-src data:; font-src data:; form-action 'none'; base-uri 'none'; frame-ancestors 'none'`,
  };
  return new Response(html, { status: html ? 200 : 404, headers });
}
