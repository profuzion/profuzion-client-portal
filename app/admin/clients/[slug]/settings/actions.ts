"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { deleteClientWorkspace, saveClientSettings } from "@/lib/client-settings-store";
import {
  databaseErrorCode, isClientId, validateClientSettings,
  type ClientSettingsState, type DeleteClientState,
} from "@/lib/client-settings-validation";

function refreshClientViews() {
  revalidatePath("/admin", "layout");
  revalidatePath("/portal", "layout");
  revalidatePath("/c/[slug]", "layout");
}

export async function updateClientAction(
  clientId: string, _previous: ClientSettingsState, formData: FormData,
): Promise<ClientSettingsState> {
  const user = await requireAdmin();
  const state = validateClientSettings(formData);
  if (!isClientId(clientId)) return { ...state, message: "This client link is invalid." };
  if (Object.keys(state.errors).length) return state;
  try {
    const result = await saveClientSettings(clientId, state.values, user.name);
    if (result.status === "missing") return { ...state, message: "This client no longer exists. Return to Clients." };
  } catch (error) {
    if (databaseErrorCode(error) === "23505") {
      return { ...state, errors: { slug: "That workspace URL is already in use. Choose another slug." }, message: "Changes were not saved." };
    }
    // Do not expose database details, connection strings, or submitted content.
    console.error("Client settings save failed", { code: databaseErrorCode(error) ?? "unknown" });
    return { ...state, message: "We couldn't save these changes. Please try again." };
  }
  // Next.js redirects throw a control-flow exception, so keep them outside catch.
  refreshClientViews();
  redirect(`/admin/clients/${state.values.slug}?saved=1`);
}

export async function deleteClientAction(
  clientId: string, _previous: DeleteClientState, formData: FormData,
): Promise<DeleteClientState> {
  await requireAdmin();
  if (!isClientId(clientId)) return { message: "This client link is invalid." };
  const entries = formData.getAll("confirmation");
  if (entries.length !== 1 || typeof entries[0] !== "string" || !entries[0]) {
    return { message: "Type the client's current name exactly to confirm deletion." };
  }
  try {
    const result = await deleteClientWorkspace(clientId, entries[0]);
    if (result.status === "missing") return { message: "This client no longer exists. Return to Clients." };
    if (result.status === "confirmation") {
      return { message: "The name does not match the client's current name. Reload this page and type it exactly." };
    }
  } catch (error) {
    console.error("Client deletion failed", { code: databaseErrorCode(error) ?? "unknown" });
    if (databaseErrorCode(error) === "23503") {
      return { message: "Related records prevented deletion. No changes were made. Ask your administrator to review the database relationships." };
    }
    return { message: "We couldn't delete this client. No changes were made. Please try again." };
  }
  refreshClientViews();
  redirect("/admin");
}
