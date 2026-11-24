# Profuzion Client Portal — Next.js / Cloudways Velocity

**Release:** `0.1.0` — an implementation-ready foundation, not a completed production launch. The existing WordPress/Bricks installation at `profuzionstudio.com` is left untouched. The new public `profuzion.com` Next.js website should be its **own application and repository**.

The first release is built as **one multi-tenant web app** on a Cloudways Velocity temporary domain. Every client gets its own dashboard and four independent presentation sections. All customer access is verified server-side.

## Included in this version

- A polished, responsive Profuzion admin dashboard and customer portal.
- Agency administrator login, revocable server-side sessions, scrypt password hashes and password-change session revocation.
- Add client workspaces without additional Next.js deployments.
- Four default client sections: **Proposal**, **Brand Strategy**, **Brand Identity**, **Website**.
- Edit each section title, summary, text and progress status from the admin area.
- Copy-and-send **single-use client invitations**, valid for 7 days. Invited clients set their passwords.
- Client-only review approvals, with approval audit records and activity history.
- Website preview URL on a per-client basis; actual customer sites remain independent of the portal.
- PostgreSQL storage and authorization through membership checks.
- Admin can preview any client workspace; non-admin users can access only assigned client workspaces.
- `noindex, nofollow` metadata, `no-referrer`, HTTP-only session cookies and logout.

### People, support and dark portal release

- Charcoal client and agency workspaces, restrained orange actions, responsive navigation and visible keyboard focus.
- `/admin/users`: create/edit users, generate passwords, assign workspace memberships, remove access and configure account email preferences.
- `/account`: authenticated password changes. Administrator resets and personal password changes revoke all existing sessions.
- `/admin/support`: agency queue; `/c/[slug]/support`: client requests, replies, priority and status tracking.
- `/admin/clients/[slug]/settings`: edit client details and delete a workspace after typing its exact slug.
- Optional SMTP notifications for account creation, password changes and admin password resets. Passwords are never included in emails.

See [deployment and verification notes](docs/portal-release.md) and [brand guidelines and asset downloads](docs/brand-assets.md). Self-service forgotten-password recovery, ticket attachments/email alerts, payments and a Payload CMS migration are not included in this release.

## Quick start with local PostgreSQL

Requirements: Node.js 22+, npm, PostgreSQL 14+.

1. Create an empty PostgreSQL database, and a database user with permission to create tables.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and change `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`, `APP_BASE_URL`, and all `BOOTSTRAP_ADMIN_*` values. Never commit this file.
4. Run `npm run db:setup`. This creates the schema and an agency admin account, if the email does not exist.
5. Run `npm run dev` and open `http://localhost:3000`.
6. Log in with your bootstrap admin credentials and add the first client (e.g. All-West Crane & Rigging).

**Important:** Passwords must be at least 12 characters. The setup script never resets an existing admin password. Once the account is created, remove `BOOTSTRAP_ADMIN_PASSWORD` from the environment, but preserve the database.

## Deploy to Cloudways Velocity using the temporary domain

1. Create a new **private** GitHub repository, suggested name: `profuzion-client-portal`.
2. Push the root contents of this folder to its `main` branch. Do **not** include `.env.local`.
3. Open **Cloudways → Velocity → Add App** and connect the GitHub repository. Select **Node.js 22** and **Next.js SSR**. Choose the Velocity plan that fits your usage (Professional is a reasonable starting point).
4. Keep the **Cloudways-provided temporary domain**. It typically looks like `https://nodejs-<generated>.cloudwaysnodeapps.com`. Cloudways generates the exact hostname; do not type in an invented address.
5. After the initial app deployment, attach a **PostgreSQL** database from **Velocity → My Applications → [app] → Access Details → Database**. Cloudways installs it in its environment, and deployment may be needed for auto-created database variables to take effect. (Cloudways says this installation is not reversible.)
6. In **Velocity → My Applications → [app] → Environment Variables** (a separate sidebar item), provide the values below, marking secrets as **sensitive**:

   | Variable | Value |
   |---|---|
   | `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` | The exact PostgreSQL connection values supplied by Cloudways. The app and schema initializer use these individual variables. |
   | `DATABASE_SSL` | `false` for a trusted internal connection without TLS, or `true` if your database provider requires TLS. Verify with the exact connection details. |
   | `APP_BASE_URL` | The actual `https://...cloudwaysnodeapps.com` address assigned to this app, without a trailing slash. |
   | `BOOTSTRAP_ADMIN_EMAIL` | Your email address (only needed initially). |
   | `BOOTSTRAP_ADMIN_NAME` | The agency admin display name (only needed initially). |
   | `BOOTSTRAP_ADMIN_PASSWORD` | A unique password of at least 12 characters (only needed initially). |

7. Set **build command** to `npm run build`. Set **startup command** to `npm run start:cloudways`. The Cloudways start script runs an idempotent schema setup **when `PGHOST` and `PGDATABASE` are available** (and creates the initial administrator if requested) before the Next.js server starts on `127.0.0.1` using the injected `PORT` variable or port 3000. On the **first deployment without a database**, it serves a safe activation-pending page instead of crashing; connect PostgreSQL, set the variables, and redeploy to activate the portal.
8. **Save & Redeploy.** After the app and database are connected, visit the *actual* temporary URL and sign in. Check the logs if startup fails.
9. Verify admin dashboard, client creation, editing, invitation, login as the client, cross-client access denial and approval workflow. **Remove `BOOTSTRAP_ADMIN_PASSWORD` from Velocity environment variables and redeploy.** Keep the `PG*` connection variables and `APP_BASE_URL`.
10. When you're ready, add a permanent portal subdomain (for example `app.profuzion.com`) in **Velocity → Domain Management**, configure exactly the DNS records Cloudways generates, update `APP_BASE_URL` and redeploy. The future public `profuzion.com` website remains a separate app.

Cloudways docs:
- [How to launch a Velocity application](https://support.cloudways.com/en/articles/15550368-how-to-launch-an-application-on-cloudways-velocity)
- [Database connection guide](https://support.cloudways.com/en/articles/16188001-how-to-connect-and-manage-a-database-for-your-application-on-cloudways-velocity)
- [Deployment/startup configuration](https://support.cloudways.com/en/articles/16187473-how-to-manage-deployments-for-your-application-on-cloudways-velocity)
- [Domain management](https://support.cloudways.com/en/articles/16160839-how-to-add-a-domain-to-your-application-on-cloudways-velocity)

> **Cloudways Velocity is not Cloudways Flexible.** Velocity does not offer traditional SSH command access; use the configured build/startup commands for this app. The `start:cloudways` script is the bootstrap route. In a mature production system, migrate to versioned database migrations executed in a controlled deploy step rather than re-running the initializer at each startup.

## Routes

| Route | Function |
|---|---|
| `/setup` | Temporary activation-pending page before database attachment |
| `/login` | Authentication |
| `/admin` | Agency-wide dashboard (admin only) |
| `/admin/clients/new` | Create workspace (admin only) |
| `/admin/clients/[slug]` | Manage client, invitations, preview link |
| `/admin/clients/[slug]/[section]` | Edit section (admin only) |
| `/portal` | Client's list of authorized workspaces |
| `/c/[slug]` | Client project overview (role-protected) |
| `/c/[slug]/proposal` | Proposal presentation |
| `/c/[slug]/strategy` | Brand strategy presentation |
| `/c/[slug]/identity` | Brand identity presentation |
| `/c/[slug]/website` | Website presentation and preview |
| `/invite/[token]` | One-time invite acceptance |

## Security and launch checklist

- Use HTTPS and verify Cloudways proxy settings, cookies, and session persistence.
- Confirm **cross-client isolation** manually with two different invited client accounts before inviting real customers.
- Verify Cloudways backups cover PostgreSQL, not just the application files. Test restoration separately.
- Run `npm run check` and `npm run build` with the committed dependency lockfile.
- Run `npm audit`, typechecking, a dependency security scan, and an independent authorization review before real client files are uploaded.
- Add a secure password-reset flow, account recovery, stronger abuse protection, and optionally MFA before production rollout.
- Store confidential binary assets in private object storage with authorized signed downloads; don't put them under `public/`.
- Rotate bootstrap credentials, set invite expiration (already included), and routinely remove old sessions and failed-login records.
- Use a **private** GitHub repo: the code is not a secret, but the app is not a public-facing content project.
- Do not share actual client proposal/strategy data until you have tested the permission boundaries.

## Notes for development in Cursor

Use this repository as the source of truth. Prioritize secure authorization when adding new data routes: always scope queries by both client membership and resource owner. For richer proposals, extend the `sections` model with structured JSONB content blocks and render a polished component library, rather than creating a separate Next.js codebase for every client. Keep client websites as separate deployments and link them via `website_preview_url`. Use reusable templates and allow per-client design overrides. Avoid moving the existing Bricks/WordPress site until the separate `profuzion.com` project is complete.
