import Link from "next/link";
import { notFound } from "next/navigation";
import { Shell } from "@/components/shell";
import { requireAdmin } from "@/lib/auth";
import { assetAccess, listAssets } from "@/lib/brand-assets";
import { assetCategories } from "@/lib/asset-files";
import { AssetLibrary } from "@/components/asset-library";
export const dynamic = "force-dynamic";
export default async function Assets({
  params,
  searchParams,
}: {
  params: Promise<{ scope: string }>;
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const user = await requireAdmin();
  const { scope } = await params;
  const access = await assetAccess(scope, true);
  if (!access) notFound();
  const assets = await listAssets(access.scope, true);
  const q = await searchParams;
  const back =
    scope === "agency" ? "/admin/brand" : `/admin/clients/${scope}/brand`;
  return (
    <Shell
      user={user}
      title={`${access.name} assets`}
      overline="BRAND LIBRARY / ADMINISTRATION"
      actions={
        <Link className="btn btn-outline" href={back}>
          Back to guidelines
        </Link>
      }
    >
      {q.error && (
        <div className="notice notice-error" role="alert">
          {q.error}
        </div>
      )}
      {q.saved && (
        <div className="notice notice-success" role="status">
          Asset library updated.
        </div>
      )}
      <details className="panel asset-upload">
        <summary>Add a brand asset</summary>
        <p className="muted">
          Uploads start as drafts. Publish each asset when it is approved.
          Maximum 20 MB per file.
        </p>
        <form
          action={`/api/brand-assets/${encodeURIComponent(scope)}`}
          method="post"
          encType="multipart/form-data"
          className="form-stack"
        >
          <input type="hidden" name="mode" value="upload" />
          <div className="form-grid">
            <label>
              Asset name
              <input
                name="title"
                required
                maxLength={150}
                placeholder="Primary logo — white"
              />
            </label>
            <label>
              Category
              <select name="category">
                {Object.entries(assetCategories).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            File
            <input
              type="file"
              name="file"
              required
              accept=".svg,.png,.jpg,.jpeg,.webp,.pdf,.eps,.ai,.psd,.otf,.ttf,.woff,.woff2,.zip,.docx,.pptx,.xlsx,.txt,.mp4,.mov"
            />
          </label>
          <label>
            Intended use, dimensions or installation notes
            <textarea
              name="usage_notes"
              maxLength={2000}
              placeholder="For dark backgrounds. Transparent PNG, 2400 × 1200 px."
            />
          </label>
          <label>
            Licence notes
            <textarea
              name="license_notes"
              maxLength={2000}
              placeholder="Who can use this file, and where? Include font licensing restrictions."
            />
          </label>
          <label className="check-row">
            <input name="rights_confirmed" type="checkbox" required />
            <span>
              I have permission to distribute this file to this brand’s
              authorized users.
            </span>
          </label>
          <button className="btn btn-primary">Upload draft</button>
        </form>
      </details>
      <AssetLibrary assets={assets} scope={scope} manage />
    </Shell>
  );
}
