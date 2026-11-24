# People, support and dark portal

## Deploy

1. Install from the lockfile (`npm ci`) and build (`npm run build`).
2. Keep the existing PGHOST, PGPORT, PGUSER, PGPASSWORD and PGDATABASE values.
3. Use `npm run start:cloudways` as startup command. It now imports the correct setup.js file and applies base, brand and portal migrations before serving. If using another startup command, run `npm run db:setup` first.
4. The additive portal migration preserves existing accounts, memberships, project content and brand kits. Existing email preferences default to off. Back up PostgreSQL before deployment.
5. Configure SMTP_HOST, SMTP_PORT, SMTP_FROM and, when required by the provider, SMTP_USER and SMTP_PASSWORD. Port 587 requires STARTTLS. For port 465 set SMTP_SECURE=true. The sender must be verified with your email provider.

The GitHub push does not itself verify Cloudways deployment or email delivery. With no SMTP configuration, accounts still save and an explicit delivery warning appears. No customer emails are sent during implementation/testing.

## Behaviour

- Administrators can create client and administrator accounts. Client accounts require a workspace and owner/viewer access level. Owners may approve project sections; viewers can view work and use support.
- Saving a user adds or updates the selected workspace membership; other memberships are retained. Individual memberships can be removed. Removing access revokes all sessions.
- Passwords use the existing scrypt hashing. Generated passwords use browser cryptographic randomness. Password reset and change revoke all sessions. Passwords are never sent in email.
- Three independent notification preferences: account creation, personal password change, and administrator password reset. Reset notices report a completed reset, not a recovery link.
- Workspace members can see the workspace’s support tickets. Every mutation checks membership server-side. Agency replies mark a request waiting; client replies reopen it. Clients can resolve/reopen; administrators can use all statuses.
- Deletion requires the exact workspace slug. It removes workspace-owned content through database cascades; user accounts remain. No real client was deleted in testing.
- Client brand guidelines retain their published colours. Portal surfaces use charcoal/black and orange actions; brand assets remain separate deliverables.

## Not included

Self-service forgotten-password emails, ticket attachments and email notifications, moving client websites into Payload CMS, and a production hosting migration.

## Verification

Run `npm run test:portal` for isolated HTTP integration tests (it builds first, starts an in-memory PGlite database and test Next.js process, and shuts both down afterward). No production connection settings or real client data are used.

TypeScript and production build checks; repeatable schema migration and HTTP server-action integration checks against an isolated, disposable PostgreSQL-compatible test database. The checks cover route isolation, forged ticket mutations, account creation/preferences, session revocation, ticket reply/status transitions, client edits, deletion confirmation and cascade cleanup. Browser rendering inspection was blocked by the local-file preview policy; a visual pass on the deployed app remains necessary. Production SMTP and Cloudways require configured services to verify end-to-end delivery and deployment.
