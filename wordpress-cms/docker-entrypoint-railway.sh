#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Railway entrypoint: rewrite Apache to listen on $PORT
#  Railway injects a dynamic PORT env var. Apache defaults to
#  port 80 which won't match, causing healthcheck failures.
# ─────────────────────────────────────────────────────────────
set -e

# Use Railway's PORT if set, fall back to 80
LISTEN_PORT="${PORT:-80}"

# Rewrite Apache ports.conf
if [ "$LISTEN_PORT" != "80" ]; then
  sed -i "s/Listen 80/Listen ${LISTEN_PORT}/g" /etc/apache2/ports.conf
  sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${LISTEN_PORT}>/g" \
    /etc/apache2/sites-enabled/000-default.conf 2>/dev/null || true
fi

# Pass through to the original WordPress entrypoint
exec docker-entrypoint.sh "$@"
