"use client";

import Link from "next/link";
import { useActionState, useState, type ChangeEvent } from "react";
import {
  CLIENT_ACCENTS, CLIENT_SETTINGS_LIMITS as limits, type ClientSettingsValues,
} from "@/lib/client-settings-validation";
import { deleteClientAction, updateClientAction } from "./actions";
import styles from "./settings.module.css";

export function ClientSettingsForm({ clientId, initialValues }: {
  clientId: string; initialValues: ClientSettingsValues;
}) {
  const [state, saveAction, saving] = useActionState(updateClientAction.bind(null, clientId), {
    values: initialValues, errors: {}, message: "",
  });
  const [deletion, deleteAction, deleting] = useActionState(deleteClientAction.bind(null, clientId), { message: "" });
  const [values, setValues] = useState(initialValues);
  const [confirmation, setConfirmation] = useState("");
  const busy = saving || deleting;
  const change = (field: keyof ClientSettingsValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };
  const fieldProps = (field: keyof ClientSettingsValues, helpId?: string) => ({
    id: `client-${field}`, name: field, value: values[field], maxLength: limits[field],
    "aria-invalid": !!state.errors[field],
    "aria-describedby": [helpId, state.errors[field] ? `${field}-error` : undefined].filter(Boolean).join(" ") || undefined,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => change(field, event.target.value),
  });
  const error = (field: keyof ClientSettingsValues) => state.errors[field]
    ? <span id={`${field}-error`} className={styles.error}>{state.errors[field]}</span> : null;

  return <>
    <section className={`panel ${styles.panel}`} aria-labelledby="settings-heading">
      <h2 id="settings-heading" className="panel-title">Workspace details</h2>
      <form action={saveAction} className="form-stack" aria-busy={saving}>
        {state.message && <p className="notice notice-error" role="alert">{state.message}</p>}
        <fieldset className={styles.fields} disabled={busy}>
          <label htmlFor="client-name">Company name
            <input {...fieldProps("name")} autoComplete="organization" required />{error("name")}
          </label>
          <label htmlFor="client-industry">Industry
            <input {...fieldProps("industry")} />{error("industry")}
          </label>
          <label htmlFor="client-description">Project Summary
            <textarea {...fieldProps("description")} rows={6} />{error("description")}
          </label>
          <label htmlFor="client-slug">Workspace URL slug
            <input {...fieldProps("slug", "slug-help")} autoCapitalize="none" autoCorrect="off" spellCheck={false}
              pattern="[a-z0-9]+(-[a-z0-9]+)*" required />{error("slug")}
            <span id="slug-help" className={styles.help}>Changing this updates the workspace address. Existing links to /c/{initialValues.slug} will stop working.</span>
          </label>
          <label htmlFor="client-accent">Brand accent colour
            <select id="client-accent" name="accent" value={values.accent} required
              aria-invalid={!!state.errors.accent} aria-describedby={state.errors.accent ? "accent-error" : undefined}
              onChange={(event) => change("accent", event.target.value)}>
              {!Object.hasOwn(CLIENT_ACCENTS, values.accent) && <option value={values.accent} disabled>Choose a workspace colour</option>}
              {Object.entries(CLIENT_ACCENTS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>{error("accent")}
          </label>
          <label htmlFor="client-website_preview_url">Website preview URL
            <input {...fieldProps("website_preview_url", "preview-help")} type="url" placeholder="https://example.com"
              autoCapitalize="none" spellCheck={false} />{error("website_preview_url")}
            <span id="preview-help" className={styles.help}>Use a secure https:// address, or leave this blank to remove the preview link.</span>
          </label>
          <div className={styles.actions}>
            <button type="submit" className="btn btn-primary" disabled={busy}>{saving ? "Saving changes..." : "Save Changes"}</button>
            <Link href={`/admin/clients/${initialValues.slug}`} className="btn btn-outline">Cancel</Link>
          </div>
        </fieldset>
      </form>
    </section>

    <section className={`panel ${styles.panel} ${styles.danger}`} aria-labelledby="danger-heading">
      <h2 id="danger-heading">Danger Zone</h2>
      <p>Permanently delete this client workspace, its sections, approvals, activity history, invitations, and memberships. This cannot be undone.</p>
      <p>People&apos;s user accounts and their access to other workspaces will remain.</p>
      <form action={deleteAction} className="form-stack" aria-busy={deleting}>
        {deletion.message && <p className="notice notice-error" role="alert">{deletion.message}</p>}
        <fieldset className={styles.fields} disabled={busy}>
          <label htmlFor="delete-confirmation"><span>Type <strong>{initialValues.name}</strong> to confirm</span>
            <input id="delete-confirmation" name="confirmation" value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)} required autoComplete="off"
              autoCapitalize="none" spellCheck={false} aria-describedby="delete-help" />
          </label>
          <span id="delete-help" className={styles.help}>The name must match exactly, including capital letters and spaces. Save any name change before confirming deletion.</span>
          <div className={styles.actions}>
            <button type="submit" className={`btn ${styles.deleteButton}`} disabled={busy || confirmation !== initialValues.name}>
              {deleting ? "Deleting client..." : "Delete Client"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  </>;
}
