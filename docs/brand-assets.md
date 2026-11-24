# Brand guidelines and downloads

## What is available

Both agency and client brands share the same guideline editor and presentation components. The editor covers story, purpose/positioning, mission/vision/values, audience, personality, voice, messaging, logo usage, colour, typography, imagery, graphics, layout, applications and motion. Blank written sections are hidden. Existing saved brand kits remain compatible. Written content is authored by the agency; the application does not invent approved brand strategy or print colour values.

- Profuzion: `/admin/brand`, published guide `/admin/brand/view`, assets `/admin/brand/assets/agency`.
- Client: `/admin/clients/[slug]/brand`, published guide `/c/[slug]/brand`, assets `/admin/brand/assets/[slug]`.
- Categories: logos, fonts, social media, templates, imagery, other deliverables.
- Every uploaded asset has a direct download, usage and licence notes, format and file size. Raster assets have private previews; vectors and documents use format cards. The guide displays the configured light/dark logo previews.
- Each category and the full published brand kit can be downloaded as a ZIP with a READ-ME file containing usage/licence notes. File paths include asset IDs to avoid duplicate-name collisions.
- Font cards include Windows/macOS installation help and distinguish web fonts. Distribution permission must be confirmed for every upload. Font files are supplied by the agency, never downloaded automatically from a third party.

## Workflow

Upload an original file → review the draft download → publish. Files are immutable: upload a revised file and archive the old version. Unpublish hides an asset from clients; archive disables downloads for everyone; restore returns it to draft. No permanent asset-delete operation is exposed. Guidelines and assets publish independently so an approved file can be delivered before the full written guide.

Existing Profuzion SVG logo files are added as agency-only drafts during setup when an admin exists. They are never overwritten by migrations. Review them in Manage downloads and publish when ready. If no administrator exists during setup, run setup again after creating one.

## Deployment and limits

`npm run db:setup` now applies `db/assets-schema.sql`; `npm run start:cloudways` applies all migrations before startup. The additive schema stores files privately in PostgreSQL, so the database backup must include assets. This first release supports files up to 20 MB. ZIPs are limited to 200 files/100 MB; larger libraries should use category/individual downloads. Larger video libraries need a later private object-storage integration.

Configure the hosting proxy to permit multipart requests slightly larger than 20 MB. The application also enforces a bounded request read before multipart parsing. Uploaded files are served only after authorization, with no-store cache headers, attachment disposition and nosniff. Inline previews are limited to raster image formats; uploaded SVGs cannot execute in an inline preview. Downloads do not expose filesystem or public storage URLs.

Supported extensions: SVG, PNG, JPEG, WebP, PDF, EPS, AI, PSD, TTF, OTF, WOFF, WOFF2, ZIP, DOCX, PPTX, XLSX, TXT, MP4, MOV. The server checks extensions and recognizable signatures. It does not convert file formats or perform malware scanning; uploads are administrator-only.

## Verification

`npm run test:portal` builds and runs integration tests against an isolated in-memory PostgreSQL-compatible database. Coverage includes uploads, private drafts, publication, byte-identical downloads, ZIP content, unauthorized cross-client access, agency isolation, CSRF rejection, font validation, archive/restore and cascade cleanup, alongside earlier account/ticket tests. A production SMTP or hosting connection is not used.

A complete browser visual audit remains outstanding because the available browser rejected the local-file preview. No screenshots or approved client brand content are fabricated.
