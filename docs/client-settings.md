# Client settings

Administrators can open a client from `/admin`, then choose **Client Settings**.
The settings page is `/admin/clients/[slug]/settings`.

The form edits the existing client's name, industry, project summary, URL slug,
workspace accent and website preview URL. It uses the same field limits, four
accent choices, form styles and Manrope headings as the existing portal. Preview
URLs must use HTTPS and cannot contain embedded credentials. Empty preview URLs
are stored as SQL NULL.

Saving returns to `/admin/clients/[updated-slug]?saved=1`. The client's UUID and
related records are retained. Changing the slug changes both admin and client
addresses; the old addresses are not aliases. The form warns about this before
saving. The `new` slug is reserved by the existing create-client route.

## Access and validation

The page and both Server Actions independently call `requireAdmin`. Mutations
are addressed by client UUID, so renaming a slug cannot accidentally target a
different client. Input is validated on the server. SQL uses bound parameters.
The existing UNIQUE constraint on `clients.slug` resolves competing slug writes,
and a collision returns a field error while retaining the entered form values.
Database exceptions are translated to safe messages; redirects occur after the
mutation error handler. Saves record an activity in the same transaction.

## Deletion

The Danger Zone requires the current client name exactly, including case and
spaces. The server locks the client row and compares the confirmation against
the database name before deleting it. A stale name after another administrator's
rename does not authorize deletion.

The repository's `db/schema.sql` defines these cascading relationships:

| Deleted parent | Dependent records |
| --- | --- |
| clients | memberships, sections, activities, invitations |
| sections | section_approvals |

One parameterized DELETE runs inside the existing `transaction` helper. Foreign
key cascades perform the cleanup. If a restrictive relationship or other query
failure prevents deletion, the transaction rolls back. Users, sessions, failed
login records and unrelated clients are retained. Success returns to `/admin`.
No schema migration or explicit dependent-table deletion is required for the
inspected schema.

Admin, portal and client-page caches are invalidated after successful writes.
The settings route is a static child of `[slug]`, so the existing `[section]`
routes remain available.

## Verification

Run `npm ci`, `npm run check`, `npm test`, and `npm run build`.

The 17 automated tests use the repository's schema with an isolated in-memory
PostgreSQL engine (PGlite). They exercise the actual authentication, validation,
database transaction helper and Server Actions. Only Next.js request-bound
cookies, redirects and cache invalidation are substituted. Tests include
anonymous/client/expired-session rejection, invalid inputs and IDs, duplicate
slugs, competing slug claims, SQL parameterization, exact confirmation, stale
confirmation after rename, dependent cleanup, shared-account preservation and
transaction rollback. PGlite serializes connections in this harness, so it does
not reproduce multi-connection PostgreSQL lock timing.

The production app was also exercised in Chromium with an isolated sample
database at desktop and mobile widths. That check covered page access controls,
the admin settings link, prefilled fields, retained input after a duplicate slug,
saving all six settings, navigation after a slug change, exact-name confirmation,
deletion and preservation of another client. There was no horizontal overflow
or browser runtime error.

The production build also requires the existing homepage's database query to
run at request time. `app/page.tsx` now declares `force-dynamic`, consistent with
the other database-backed routes, so compilation does not need a live database.
The existing homepage bootstrap behavior is otherwise unchanged.

Testing uses sample records only. Deployment and any edits or deletions of
production client data are separate actions.
