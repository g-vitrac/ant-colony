FROM php:8.4-fpm-trixie

COPY --from=composer:latest /usr/bin/composer /usr/local/bin/composer

RUN apt update -y

RUN apt install -y git 7zip gzip

RUN apt install -y nginx

COPY --from=nginx:1.28.2-trixie /etc/nginx /etc/nginx
COPY .docker/nginx/app.conf /etc/nginx/conf.d/app.conf
COPY .docker/nginx/ssl /etc/nginx/ssl.conf.d
COPY .docker/nginx/nginx.conf /etc/nginx/nginx.conf
RUN ln -sf /proc/self/fd/2 /var/log/nginx/error.log && \
    ln -sf /proc/self/fd/2 /var/log/nginx/access.log

COPY sf /var/www/html/sf
COPY --chmod=744 .docker/entrypoint.sh /opt/entrypoint.sh

WORKDIR /var/www/html/sf

CMD ["/opt/entrypoint.sh"]

EXPOSE 80 443