FROM wordpress:6.5-php8.2-apache

# ── System deps + WP-CLI ──────────────────────────────────────
RUN apt-get update \
    && apt-get install -y --no-install-recommends less default-mysql-client curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# ── Copy BTG headless theme ───────────────────────────────────
COPY theme/ /var/www/html/wp-content/themes/btg-headless/

# ── Copy setup + Railway entrypoint scripts ───────────────────
COPY setup.sh /usr/local/bin/btg-setup.sh
COPY docker-entrypoint-railway.sh /usr/local/bin/docker-entrypoint-railway.sh
RUN chmod +x /usr/local/bin/btg-setup.sh \
    && chmod +x /usr/local/bin/docker-entrypoint-railway.sh

EXPOSE 80

# Our entrypoint fixes MPM + PORT at runtime, then hands off
# to the original WordPress docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-railway.sh"]
CMD ["apache2-foreground"]
