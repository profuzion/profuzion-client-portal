# Brand workspace deployment

This change adds an agency brand kit at `/admin/brand`, client kits at `/admin/clients/[slug]/brand`, and read-only published guidelines at `/c/[slug]/brand`. The agency kit uses the existing Profuzion logo assets; it does not create a duplicate client. Drafts are isolated from published settings. Admin pages use the agency kit; client workspace pages, including admin previews of those pages, use that client's published kit.

## Deploy to the existing Next.js / PostgreSQL host

1. Back up the database using the existing hosting procedure.
2. Run `npm run db:setup` with the existing PGHOST, PGPORT, PGUSER, PGPASSWORD and PGDATABASE configuration. This now also runs the additive, idempotent `db/brand-schema.sql` migration. Alternatively execute only that SQL file against the existing database. Existing clients, users and content are not modified.
3. Run `npm run build` and deploy/restart using the existing Cloudways procedure.
4. Open Admin → Profuzion brand. Review the supplied logos and colours, save a draft, then publish. For clients, open their administration page → Brand guidelines & portal theme.

The startup script now imports `setup.js` and uses the same PG variables as the application. `npm run start:cloudways` applies the base, brand, portal and asset migrations. See [brand assets](brand-assets.md) for download management and storage limits.

## Acceptance checks

- A client cannot open either admin editor or call its save action successfully.
- A client cannot read another client's published guidelines by changing the URL.
- Saving a draft leaves the published portal unchanged.
- Publishing updates the guidelines and theme together; admin pages retain the agency theme.
- A stale editor tab receives a reload error rather than overwriting newer edits.
- Reset restores defaults and clears the published guidelines, with a confirmation first.
- Dark and light sidebar/button colours receive contrasting black or white text.
- Mobile navigation exposes guidelines, agency settings (admin only), and sign out.

## Scope and follow-up

This is the first implementation slice: persistent brand guidelines and scoped portal themes. Logo display fields accept existing local assets or HTTPS asset URLs. A private upload library with licensed font files and individual/ZIP downloads is now included. PDF guideline export and automatic mockup generation remain follow-up work. The source already includes the Profuzion logos. Fonts are limited to bundled Manrope and system fonts; no unlicensed font files are fetched.

Tickets are implemented in the portal release. Task objectives, milestone dependencies, visual proofing and AI workflows remain follow-up work. Automatic image creation will require a server-side provider configuration, a job queue and a usage budget.
