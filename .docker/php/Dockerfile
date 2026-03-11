FROM php:8.2.30-fpm-trixie

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN apt update -y

RUN apt install -y git 7zip gzip

WORKDIR /var/www/html/sf