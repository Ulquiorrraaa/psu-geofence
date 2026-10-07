#!/bin/sh
set -eu
if [ -z "$APP_KEY" ] || [ -z "$APP_URL" ]; then
    echo "Set a permanent APP_KEY and the HTTPS APP_URL in Render." >&2
    exit 1
fi
if [ "$APP_ENV" != "production" ] || [ "$APP_DEBUG" != "false" ]; then
    echo "Production requires APP_ENV=production and APP_DEBUG=false" >&2
    exit 1
fi
case "$DB_CONNECTION" in
    mysql|pgsql|mariadb) ;;
    *) echo "Use an external persistent database; local SQLite is not safe on Render." >&2; exit 1 ;;
esac
mkdir -p storage/app/public storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
sed -i 's/^Listen 80$/Listen 10000/' /etc/apache2/ports.conf
php artisan config:clear
php artisan migrate --force
php artisan storage:link
php artisan optimize
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/attendance.conf
