import {
  Download,
  FileArchive,
  FileType2,
  Image as ImageIcon,
} from "lucide-react";
import { assetCategories, fileSize } from "@/lib/asset-files";
import type { BrandAsset } from "@/lib/brand-assets";
export function AssetLibrary({
  assets,
  scope,
  manage = false,
}: {
  assets: BrandAsset[];
  scope: string;
  manage?: boolean;
}) {
  const base = `/api/brand-assets/${encodeURIComponent(scope)}`;
  const published = assets.filter((a) => a.published && !a.archived);
  return (
    <section className="asset-library" id="downloads">
      <div className="section-heading">
        <div>
          <p className="overline">READY TO USE</p>
          <h2>Your brand, at hand.</h2>
        </div>
        {published.length > 0 && (
          <a className="btn btn-primary" href={`${base}/bundle`}>
            <FileArchive size={17} />
            Download brand kit
          </a>
        )}
      </div>
      <p className="page-intro">
        Choose the file you need. Every download includes the original format;
        bundles include usage and licence notes.
      </p>
      {!assets.length && (
        <div className="empty">
          <FileArchive size={30} />
          <h3>Your assets belong here.</h3>
          <p>
            {manage
              ? "Upload your first logo, font or deliverable. Publish it when it is ready to share."
              : "Approved files will appear here once your studio publishes them."}
          </p>
        </div>
      )}
      {Object.entries(assetCategories).map(([category, label]) => {
        const items = assets.filter((a) => a.category === category);
        if (!items.length) return null;
        return (
          <section key={category} className="asset-category">
            <div className="asset-category-head">
              <h3>
                {label} <span className="counter">{items.length}</span>
              </h3>
              {published.some((a) => a.category === category) && (
                <a
                  className="text-link"
                  href={`${base}/bundle?category=${category}`}
                >
                  <Download size={16} />
                  Download all {label.toLowerCase()}
                </a>
              )}
            </div>
            <div className="asset-grid">
              {items.map((asset) => (
                <article
                  className={`asset-card ${asset.archived ? "asset-archived" : ""}`}
                  key={asset.id}
                >
                  <div className="asset-preview">
                    {!asset.archived &&
                    ["image/png", "image/jpeg", "image/webp"].includes(
                      asset.mime,
                    ) ? (
                      <img
                        loading="lazy"
                        src={`${base}/${asset.id}?preview=1`}
                        alt={asset.title}
                      />
                    ) : asset.category === "fonts" ? (
                      <span className="font-specimen">Aa</span>
                    ) : asset.category === "logos" ? (
                      <ImageIcon size={42} />
                    ) : (
                      <FileType2 size={42} />
                    )}
                    <span className="asset-extension">
                      {asset.filename.split(".").pop()?.toUpperCase()}
                    </span>
                  </div>
                  <div className="asset-card-content">
                    <h4>{asset.title}</h4>
                    <p className="asset-meta">
                      {fileSize(asset.size_bytes)} · {asset.filename}
                    </p>
                    {asset.usage_notes && (
                      <p className="asset-notes">{asset.usage_notes}</p>
                    )}
                    {asset.license_notes && (
                      <details className="asset-license">
                        <summary>Licence & usage</summary>
                        <p>{asset.license_notes}</p>
                      </details>
                    )}
                    {asset.category === "fonts" && (
                      <details className="asset-license">
                        <summary>How to install</summary>
                        <p>
                          Extract ZIP files first. On Windows, right-click a TTF
                          or OTF file and choose Install. On macOS, open it in
                          Font Book and choose Install. WOFF and WOFF2 files are
                          for websites. Follow the included licence.
                        </p>
                      </details>
                    )}
                    {!asset.archived && (
                      <a
                        className="btn btn-outline asset-download"
                        href={`${base}/${asset.id}`}
                        aria-label={`Download ${asset.title}`}
                      >
                        <Download size={16} />
                        Download{" "}
                        {asset.filename.split(".").pop()?.toUpperCase()}
                      </a>
                    )}
                    {manage && (
                      <div className="asset-management">
                        <span className="status">
                          {asset.archived
                            ? "Archived"
                            : asset.published
                              ? "Published"
                              : "Draft"}
                        </span>
                        <form action={base} method="post">
                          <input type="hidden" name="id" value={asset.id} />
                          {asset.archived ? (
                            <button
                              className="text-link"
                              name="mode"
                              value="restore"
                            >
                              Restore as draft
                            </button>
                          ) : (
                            <>
                              <button
                                className="text-link"
                                name="mode"
                                value={
                                  asset.published ? "unpublish" : "publish"
                                }
                              >
                                {asset.published ? "Unpublish" : "Publish"}
                              </button>
                              <button
                                className="text-link"
                                name="mode"
                                value="archive"
                              >
                                Archive
                              </button>
                            </>
                          )}
                        </form>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </section>
  );
}
