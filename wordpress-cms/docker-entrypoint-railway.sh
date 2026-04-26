#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Railway entrypoint for WordPress
#  Runs BEFORE docker-entrypoint.sh (and thus before Apache).
#  1. Remove conflicting MPM modules (runtime — can't be done
#     reliably at build time because a2enmod dependency
#     resolution can re-add them)
#  2. Write Railway's dynamic $PORT directly into ports.conf
#     (no sed/regex — write the whole file fresh)
#  3. Change VirtualHost to wildcard port
# ─────────────────────────────────────────────────────────────
set -e

# ── 1. MPM: hard-remove event + worker, ensure only prefork ──
# Remove symlinks directly — avoids a2dismod triggering dep resolution
for f in mpm_event.load mpm_event.conf mpm_worker.load mpm_worker.conf; do
    rm -f "/etc/apache2/mods-enabled/${f}"
done

# Symlink prefork if not already present
[ -f /etc/apache2/mods-enabled/mpm_prefork.load ] || \
    ln -sf /etc/apache2/mods-available/mpm_prefork.load \
           /etc/apache2/mods-enabled/mpm_prefork.load
[ -f /etc/apache2/mods-available/mpm_prefork.conf ] && \
[ ! -f /etc/apache2/mods-enabled/mpm_prefork.conf ] && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf \
           /etc/apache2/mods-enabled/mpm_prefork.conf || true

# ── 2. PORT: overwrite ports.conf with the actual port number ─
LISTEN_PORT="${PORT:-80}"
cat > /etc/apache2/ports.conf <<PORTS
Listen ${LISTEN_PORT}
<IfModule ssl_module>
    Listen 443
</IfModule>
<IfModule mod_gnutls.c>
    Listen 443
</IfModule>
PORTS

# ── 3. VirtualHost: change <VirtualHost *:80> → <VirtualHost *>
# Wildcard matches any port — no port number to maintain.
for conf in /etc/apache2/sites-enabled/000-default.conf \
            /etc/apache2/sites-available/000-default.conf; do
    [ -f "$conf" ] && \
        sed -i 's/<VirtualHost \*:[0-9]*>/<VirtualHost *>/g' "$conf" || true
done

echo "[railway-entrypoint] Apache will listen on port ${LISTEN_PORT}"

# ── 4. Hand off to the original WordPress entrypoint ─────────
exec docker-entrypoint.sh "$@"

