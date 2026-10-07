# Deployment checklist

Keep the local .env unchanged. Use .env.production.example as the SERVER .env template, replace all placeholders, and configure real database and SMTP credentials. Never commit secrets.

## Verify before release

Run npm ci, npm run lint:check, npm run format:check, npm run types:check, npm run test:gps, composer lint:check, and php artisan test. Use PHP 8.4+ compatible with composer.lock and a Node version compatible with locked Vite (CI uses Node 22).

Back up the database and storage/app/public. Test restoring both into a separate environment. Keep the previous application release available for rollback; assess schema compatibility before reverting migrations.

## Install on the server

1. Configure HTTPS. Point the web root to public/, never the project root. Verify .env and storage/logs cannot be downloaded.
2. Deploy complete application source and lockfiles. Exclude local .env, public/hot, local logs/caches, node_modules, and the Windows public/storage junction. Build with npm ci and npm run build in a trusted environment and deploy public/build.
3. Run composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction and composer check-platform-reqs --no-dev.
4. Fill in the server .env. Generate APP_KEY with php artisan key:generate ONLY for a new installation. Preserve an existing installation's key during upgrades and restores.
5. Grant the web process write access to storage and bootstrap/cache. Keep storage/app/public persistent across releases.
6. After a verified backup, run php artisan migrate --force and php artisan storage:link on the server. Never use migrate:fresh, migrate:refresh, or development seeders on school data.
7. Run php artisan optimize and php artisan deployment:check. The check is read-only and returns a failure code for missing configuration. Passing does not prove email delivery or operational readiness.
8. Set up the server scheduler to run php artisan schedule:run every minute from the application directory. This runs attendance:process; the local Windows task does not transfer to hosting.
9. Supervise php artisan queue:work when using the database queue and run php artisan queue:restart after releases. Monitor failed jobs and server logs.

## Test the deployed installation

Test approved accounts for all four roles and confirm access isolation. Test login/logout, password-reset email delivery, uploads, registration, schedules, notifications, reports, and screen layouts on desktop and phone.

Test GPS attendance on a real phone over HTTPS inside and outside the allowed radius. Manual changes and deletion must not erase GPS evidence. Use controlled test classes to verify automatic absences without affecting school records.

Schedule encrypted database and upload backups outside the web root with appropriate access and retention, and verify restore procedures. Actual hosting access, domain/TLS setup, SMTP credentials, backup storage, scheduler and queue supervision must be supplied and verified before public launch.