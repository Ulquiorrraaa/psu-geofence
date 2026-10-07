FROM node:22-bookworm-slim AS node
FROM composer:2 AS composer
FROM php:8.4-apache-bookworm AS build
RUN apt-get update && apt-get install -y --no-install-recommends git unzip libzip-dev libpng-dev libjpeg62-turbo-dev libfreetype6-dev libonig-dev libxml2-dev libpq-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j2 pdo_mysql pdo_pgsql mbstring zip gd bcmath opcache dom xml xmlreader xmlwriter simplexml \
    && rm -rf /var/lib/apt/lists/*
COPY --from=composer /usr/bin/composer /usr/local/bin/composer
COPY --from=node /usr/local/bin/node /usr/local/bin/node
COPY --from=node /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
WORKDIR /var/www/html
COPY . .
RUN mkdir -p bootstrap/cache storage/app/public storage/app/private storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && composer install --no-dev --prefer-dist --optimize-autoloader --no-interaction \
    && npm ci && npm run build
FROM php:8.4-apache-bookworm AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends libzip4 libpng16-16 libjpeg62-turbo libfreetype6 libonig5 libxml2 libpq5 supervisor \
    && rm -rf /var/lib/apt/lists/* && a2enmod rewrite headers
COPY --from=build /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=build /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/
WORKDIR /var/www/html
COPY --from=build --chown=www-data:www-data /var/www/html /var/www/html
RUN rm -rf node_modules tests .github && mkdir -p /var/log/supervisor \
    && printf 'expose_php=Off\nlog_errors=On\nerror_log=/proc/self/fd/2\nupload_max_filesize=3M\npost_max_size=4M\n' > /usr/local/etc/php/conf.d/production.ini
COPY deploy/render/apache.conf /etc/apache2/sites-available/000-default.conf
COPY deploy/render/supervisord.conf /etc/supervisor/conf.d/attendance.conf
COPY deploy/render/start.sh /usr/local/bin/start-app
RUN sed -i 's/\r$//' /usr/local/bin/start-app && chmod +x /usr/local/bin/start-app
EXPOSE 10000
CMD ["/usr/local/bin/start-app"]
