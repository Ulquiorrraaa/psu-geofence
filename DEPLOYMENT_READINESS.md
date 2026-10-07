# Deployment readiness review — 2026-10-07

Verdict: automated local checks pass; public launch remains conditional on production configuration and live verification. No deployment was performed. The local .env was preserved.

## Checks completed
- Backend: 127 tests passed, 1,257 assertions. Includes role isolation, instructor ownership, registration, GPS/manual attendance protection, notifications, profiles, guard details and advisory assignment/reassignment.
- GPS frontend: 8 tests passed.
- ESLint, Prettier, TypeScript and PHP Pint passed.
- Composer metadata and installed PHP 8.4 platform requirements passed.
- Production client and SSR builds passed. SSR emits a source-map warning from the Inertia plugin; this affects debugging maps and did not fail the build. SSR is disabled by default.
- Full npm audit and Composer audit reported no known vulnerabilities at review time.
- Database reachable; all 30 migrations applied locally; upload storage link and writable directories passed.
- Scheduler definition includes attendance:process every minute. This does not prove an operating-system scheduler is running.
- Local /up, /login and / returned HTTP 200.

## Required before public launch
The local deployment check intentionally fails seven production conditions:
1. APP_ENV must be production.
2. APP_DEBUG must be false.
3. APP_URL must be the real HTTPS domain.
4. Session cookies must be secure.
5. Real email transport must replace log/array.
6. Exclude public/hot from the release.
7. Configure a valid production sender address.

Use .env.production.example on the server and follow DEPLOYMENT.md. Preserve an existing APP_KEY; use PHP 8.4+ compatible with the lockfile. Point the web root to public/. Set up scheduler, queue worker when needed, persistent uploads, backups and tested restore. Re-run deployment:check after server configuration.

## Limits of verification
Signed-in browser workflows across all four portals, responsive layouts on real devices, real phone GPS inside/outside the allowed area over HTTPS, delivered password-reset emails, production database behavior, TLS and web-root isolation, scheduler/queue operation, and backup restoration still need live verification. Automated tests use an isolated test database and cannot certify every real workflow or the hosting environment.

There are substantial modified and untracked files in this workspace. A release made from Git must include all intended application files, migrations and lockfiles; untracked files are omitted by a normal checkout. Do not include local secrets or development files.

The complete release process is in DEPLOYMENT.md.