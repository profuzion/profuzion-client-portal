"use server";
import { requireAdmin } from "@/lib/auth";
import { sql, transaction } from "@/lib/db";
import { field } from "@/lib/portal-validation";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
export async function saveClientSettings(form: FormData) {
  await requireAdmin();
  const slug = field(form, "slug", 65),
    name = field(form, "name", 150),
    industry = field(form, "industry", 100),
    description = field(form, "description", 600),
    accent = field(form, "accent", 20);
  if (!name || !["orange", "blue", "green", "violet"].includes(accent))
    redirect(
      `/admin/clients/${slug}/settings?error=Check+the+name+and+accent.`,
    );
  await sql(
    "UPDATE clients SET name=$2,industry=$3,description=$4,accent=$5 WHERE slug=$1",
    [slug, name, industry, description, accent],
  );
  revalidatePath("/admin");
  revalidatePath(`/c/${slug}`);
  redirect(`/admin/clients/${slug}/settings?saved=1`);
}
export async function deleteClient(form: FormData) {
  await requireAdmin();
  const slug = field(form, "slug", 65),
    confirmation = field(form, "confirmation", 65);
  if (confirmation !== slug)
    redirect(
      `/admin/clients/${slug}/settings?error=Type+the+exact+workspace+slug+to+confirm+deletion.`,
    );
  await transaction(async (db) => {
    await db.query("DELETE FROM clients WHERE slug=$1", [slug]);
  });
  revalidatePath("/admin");
  redirect("/admin");
}
