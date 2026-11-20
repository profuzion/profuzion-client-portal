import { getUser } from "@/lib/auth";
import { attachPresentation, clientSlug, packageBytes } from "@/lib/winkler-proposal";

export async function POST(request: Request, { params }: { params: Promise<{ slug: string; section: string }> }) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host || ![`http://${host}`, `https://${host}`, process.env.APP_BASE_URL?.replace(/\/$/, "")].includes(origin)) {
    return new Response("Open the proposal editor and try again.", { status: 403 });
  }
  const actor = await getUser();
  if (actor?.role !== "admin") return new Response(null, { status: 403 });
  const { slug, section } = await params;
  if (slug !== clientSlug || section !== "proposal") return new Response(null, { status: 404 });
  const sectionId = request.headers.get("x-proposal-section") || "";
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(sectionId)) return new Response(null, { status: 400 });
  const reader = request.body?.getReader();
  if (!reader) return new Response("Select the prepared proposal file.", { status: 400 });
  const parts: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > packageBytes) {
      await reader.cancel();
      return new Response("This file exceeds the prepared proposal size.", { status: 413 });
    }
    parts.push(value);
  }
  const result = await attachPresentation(Buffer.concat(parts, length), sectionId);
  if (result === "attached") return new Response(null, { status: 204 });
  if (result === "wrong-file") return new Response("Choose the original prepared Winkler proposal HTML file.", { status: 422 });
  if (result === "wrong-workspace") return new Response("The client or section has changed. Reopen the Winkler workspace.", { status: 409 });
  if (result === "already-approved") return new Response("This section has an existing approval. Review the approval history before attaching a new presentation.", { status: 409 });
  return new Response("A different attachment is already bound. Review the existing proposal.", { status: 409 });
}
