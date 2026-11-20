import "server-only";

const domains: Record<string, string> = { US: "zoho.com", CA: "zohocloud.ca", EU: "zoho.eu", IN: "zoho.in", AU: "zoho.com.au", JP: "zoho.jp", SA: "zoho.sa", UK: "zoho.uk", SG: "zoho.sg" };
export function zohoConfigured() {
  return Boolean(domains[process.env.ZOHO_SIGN_REGION || ""] && process.env.ZOHO_SIGN_CLIENT_ID && process.env.ZOHO_SIGN_CLIENT_SECRET && process.env.ZOHO_SIGN_REFRESH_TOKEN);
}

export async function importZohoAgreement(requestId: string) {
  if (!zohoConfigured()) throw new Error("Connect Zoho Sign in the server settings before importing.");
  if (!/^\d{5,40}$/.test(requestId)) throw new Error("Enter the numeric Zoho Sign request ID.");
  const region = process.env.ZOHO_SIGN_REGION!;
  const domain = domains[region];
  const tokenResponse = await fetch(`https://accounts.${domain}/oauth/v2/token`, {
    method: "POST", cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
    body: new URLSearchParams({ grant_type: "refresh_token", client_id: process.env.ZOHO_SIGN_CLIENT_ID!, client_secret: process.env.ZOHO_SIGN_CLIENT_SECRET!, refresh_token: process.env.ZOHO_SIGN_REFRESH_TOKEN! }),
  });
  if (!tokenResponse.ok) throw new Error("Zoho authorization failed. Check the server connection settings.");
  const token = await tokenResponse.json();
  if (typeof token.access_token !== "string") throw new Error("Zoho authorization failed. Check the server connection settings.");
  const headers = { Authorization: `Zoho-oauthtoken ${token.access_token}` };
  const base = `https://sign.${domain}/api/v1/requests/${requestId}`;
  const detailsResponse = await fetch(base, { headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
  if (!detailsResponse.ok) throw new Error("Zoho could not retrieve this agreement. Check its request ID and document access.");
  const details = await detailsResponse.json();
  const request = details.requests;
  if (details.code !== 0 || !request || request.request_status !== "completed" || request.is_deleted) throw new Error("Only completed, signed Zoho agreements can be imported.");
  const response = await fetch(`${base}/pdf?merge=true&with_coc=true`, { headers, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(45000) });
  if (!response.ok || !response.headers.get("content-type")?.toLowerCase().includes("application/pdf")) throw new Error("Zoho did not return a merged PDF. Check the document in Zoho Sign.");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Zoho returned an empty document.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 20 * 1024 * 1024) throw new Error("This agreement exceeds the portal's 20 MB limit.");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  const pdf = Buffer.concat(chunks);
  if (pdf.subarray(0, 5).toString() !== "%PDF-") throw new Error("Zoho returned an invalid PDF.");
  const recipients = Array.isArray(request.actions) ? request.actions.map((action: { recipient_email?: string }) => action.recipient_email).filter((email: unknown): email is string => typeof email === "string").join(", ").slice(0, 4000) : "";
  return { region, requestId, title: String(request.request_name || "Signed agreement").slice(0, 200), recipients, pdf };
}
