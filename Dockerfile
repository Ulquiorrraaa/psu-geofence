FROM php:8.4-apache

# Install OS dependencies for Laravel and Vite
RUN apt-get update && apt-get install -y \
    libzip-dev zip unzip curl \
    && docker-php-ext-install pdo_mysql zip

# Install Node.js (required to build Vite frontend assets)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs

# Enable Apache rewrite module for Laravel routing
RUN a2enmod rewrite

# Point Apache DocumentRoot to Laravel's public folder
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Copy your code into the Docker container
WORKDIR /var/www/html
COPY . .

# Install PHP packages
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer
RUN composer install --no-dev --optimize-autoloader

# Install Node packages and compile frontend assets
RUN npm install
RUN npm run build

# Grant permissions to Laravel's read/write directories
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache