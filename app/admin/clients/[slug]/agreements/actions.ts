"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { getClient } from "@/lib/data";
import { importZohoAgreement } from "@/lib/zoho-sign";
import { agreementsReady, saveAgreement } from "@/lib/agreements";
import { transaction } from "@/lib/db";

export async function importAgreement(slug: string, form: FormData) {
  const user = await requireAdmin();
  const client = await getClient(slug);
  let error = "";
  try {
    const document = await importZohoAgreement(String(form.get("request_id") || "").trim());
    if (!await saveAgreement(client.id, user.id, document)) error = "This agreement is already imported. It cannot be assigned to another client.";
  } catch (cause) {
    // Do not forward upstream responses, credentials, or database details to the browser.
    const message = cause instanceof Error ? cause.message : "";
    error = /^(Connect Zoho|Enter the numeric|Zoho |Only completed|This agreement exceeds)/.test(message) ? message : "Import failed. Check the Zoho connection and try again.";
  }
  revalidatePath(`/admin/clients/${slug}/agreements`);
  redirect(`/admin/clients/${slug}/agreements?${error ? `error=${encodeURIComponent(error)}` : "imported=1"}`);
}

export async function setAgreementVisibility(slug: string, form: FormData) {
  await requireAdmin();
  const client = await getClient(slug);
  const id = String(form.get("id") || "");
  const published = form.get("published") === "true";
  if (!/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(id) || (published && form.get("confirmed") !== "on") || !await agreementsReady()) return;
  await transaction(async db => {
    const result = await db.query("UPDATE signed_agreements SET published=$3 WHERE id=$1 AND client_id=$2 AND published<>$3 RETURNING id", [id, client.id, published]);
    if (result.rowCount) await db.query("INSERT INTO activities(client_id,label) VALUES($1,$2)", [client.id, published ? "Signed agreement available in Agreements" : "Signed agreement visibility updated"]);
  });
  revalidatePath(`/admin/clients/${slug}/agreements`);
  revalidatePath(`/c/${slug}/agreements`);
}
