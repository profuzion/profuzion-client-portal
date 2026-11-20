"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function ProposalUpload({ slug, sectionId }: { slug: string; sectionId: string }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  async function attach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const file = new FormData(event.currentTarget).get("presentation");
    if (!(file instanceof File) || !file.size || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/admin/clients/${encodeURIComponent(slug)}/proposal/attach`, {
        method: "POST", body: file, headers: { "X-Proposal-Section": sectionId },
      });
      if (response.ok) {
        setMessage("Proposal attached.");
        router.refresh();
      } else {
        setMessage(response.status >= 500 ? "Attachment failed. Check the server configuration and try again." : (await response.text()) || "Attachment failed. Reopen the editor and try again.");
      }
    } catch {
      setMessage("Unable to reach the portal. Reopen the editor to check the attachment.");
    } finally { setBusy(false); }
  }
  return <form onSubmit={attach} className="form-stack panel">
    <label>Interactive Winkler proposal<input required type="file" name="presentation" accept=".html,text/html" /></label>
    <p className="helper">Uploading a newer file updates the attached presentation for members of this workspace.</p>
    <button disabled={busy} className="btn btn-primary" type="submit">{busy ? "Updating..." : "Update proposal"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
