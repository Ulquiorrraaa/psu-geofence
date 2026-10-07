# Render setup (not deployed yet)

The Dockerfile uses PHP 8.4, Apache on port 10000, compiled production assets and the Laravel scheduler. It excludes local secrets, database files, uploads and development dependencies. Docker is not installed on the local workstation, so the container build must be verified on Render before launch.

## Connect the project
1. Create/sign in to Render and connect GitHub.
2. Include all intended changed and untracked application files in the GitHub repository; do not commit .env, credentials or school data. The current local changes have not been pushed.
3. New > Web Service > connect geofence-attendance > Docker runtime > Dockerfile at repository root.
4. Choose Free only for a preview while permanent services are being arranged. No paid services are automatically provisioned by these files.
5. Set health check to /up. Render provides the HTTPS onrender.com address; use it as APP_URL.

## Environment
Set APP_ENV=production, APP_DEBUG=false, APP_KEY to a permanent Laravel key, APP_URL to the actual HTTPS address, SESSION_SECURE_COOKIE=true, SESSION_ENCRYPT=true, SESSION_DRIVER=database, CACHE_STORE=database, QUEUE_CONNECTION=sync, LOG_CHANNEL=stderr.

For a brand-new installation generate APP_KEY locally without changing .env using php artisan key:generate --show, and enter it directly in Render's secret environment field. Never put it in Git or chat. Preserve the existing APP_KEY if transferring an existing database.

Use external persistent MySQL (DB_CONNECTION=mysql and DB_HOST/PORT/DATABASE/USERNAME/PASSWORD) or PostgreSQL (DB_CONNECTION=pgsql and DB_URL with DB_SSLMODE=require). Migrations are applied at container startup; back up an existing database before deploying. Do not use SQLite.

Provide a valid email sender and an HTTPS email API transport supported by Laravel (with its required Composer SDK installed) or a verified provider-supported SMTP port that Render permits. Standard SMTP ports 25, 465 and 587 are blocked on Free, so the generic SMTP example is not ready to use unchanged. Email delivery remains unconfigured.

## Daily-use blockers
- Free web services sleep after 15 idle minutes. The scheduler stops while asleep; automatic attendance may be delayed until the service wakes.
- Free Render Postgres expires after 30 days and has no managed backups. Do not place daily school records on it.
- Profile images currently use local storage. Free Render has no persistent disk: uploads disappear on restart, redeploy or sleep. Permanent object storage integration is required for Free. On a paid service, mount a persistent disk at /var/www/html/storage/app/public instead.
- External database, object storage and email provider accounts, backups and actual delivery tests still need configuration.
- Existing data and uploads are not in the container and are not transferred automatically.
- Production HTTPS form/link behavior must be checked behind Render's proxy, plus all signed-in roles and real-phone GPS.

Official limits: https://render.com/docs/free
Container deployment: https://render.com/docs/docker

No account, service, charge, repository push or public deployment has been created by this preparation.