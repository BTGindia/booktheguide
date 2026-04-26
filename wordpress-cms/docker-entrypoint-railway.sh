#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Railway entrypoint
#  1. Fix MPM conflict at runtime (base image re-enables modules
#     during startup, overriding any build-time a2dismod calls)
#  2. Rewrite Apache to listen on Railway's dynamic $PORT
# ─────────────────────────────────────────────────────────────
set -e

# ── 1. Fix MPM conflict ───────────────────────────────────────
# Forcibly remove mpm_event and mpm_worker symlinks so Apache
# can't load them, then ensure mpm_prefork is the only one.
for mod in mpm_event mpm_worker; do
  rm -f "/etc/apache2/mods-enabled/${mod}.load" \
        "/etc/apache2/mods-enabled/${mod}.conf" 2>/dev/null || true
done

# Ensure prefork is enabled
if [ ! -f /etc/apache2/mods-enabled/mpm_prefork.load ]; then
  ln -sf /etc/apache2/mods-available/mpm_prefork.load \
         /etc/apache2/mods-enabled/mpm_prefork.load
fi
if [ -f /etc/apache2/mods-available/mpm_prefork.conf ] && \
   [ ! -f /etc/apache2/mods-enabled/mpm_prefork.conf ]; then
  ln -sf /etc/apache2/mods-available/mpm_prefork.conf \
         /etc/apache2/mods-enabled/mpm_prefork.conf
fi

# ── 2. Bind Apache to Railway's $PORT ────────────────────────
LISTEN_PORT="${PORT:-80}"
if [ "$LISTEN_PORT" != "80" ]; then
  sed -i "s/Listen 80/Listen ${LISTEN_PORT}/g" /etc/apache2/ports.conf
  sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${LISTEN_PORT}>/g" \
    /etc/apache2/sites-enabled/000-default.conf 2>/dev/null || true
fi

# ── 3. Hand off to the original WordPress entrypoint ─────────
exec docker-entrypoint.sh "$@"
