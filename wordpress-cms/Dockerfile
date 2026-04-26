FROM wordpress:6.5-php8.2-apache

# ── Fix MPM conflict: disable event/worker, keep prefork ─────
# The base image may have multiple MPMs enabled; Apache refuses
# to start if more than one is loaded.
RUN a2dismod mpm_event mpm_worker 2>/dev/null || true \
    && a2enmod mpm_prefork

# ── System deps + WP-CLI ──────────────────────────────────────
RUN apt-get update \
    && apt-get install -y --no-install-recommends less default-mysql-client curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -sO https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# ── Copy BTG headless theme ───────────────────────────────────
COPY theme/ /var/www/html/wp-content/themes/btg-headless/

# ── Copy first-boot setup script ─────────────────────────────
COPY setup.sh /usr/local/bin/btg-setup.sh
RUN chmod +x /usr/local/bin/btg-setup.sh

# ── Copy Railway entrypoint (rewrites Apache port to $PORT) ──
COPY docker-entrypoint-railway.sh /usr/local/bin/docker-entrypoint-railway.sh
RUN chmod +x /usr/local/bin/docker-entrypoint-railway.sh

EXPOSE 80

# Override entrypoint so Apache listens on Railway's $PORT
ENTRYPOINT ["/usr/local/bin/docker-entrypoint-railway.sh"]
CMD ["apache2-foreground"]
