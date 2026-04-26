#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Railway entrypoint for WordPress
#
#  Flow:
#   1. Fix MPM conflict (hard-delete conflicting module symlinks)
#   2. Write $PORT directly into ports.conf
#   3. Run docker-entrypoint.sh true  → creates wp-config.php
#   4. Start apache2-foreground in background (healthcheck passes)
#   5. Run btg-setup.sh in background (installs WP + plugins)
#   6. Wait on Apache PID (keeps container alive)
# ─────────────────────────────────────────────────────────────
set -e

# ── 1. MPM fix ───────────────────────────────────────────────
for f in mpm_event.load mpm_event.conf mpm_worker.load mpm_worker.conf; do
    rm -f "/etc/apache2/mods-enabled/${f}"
done
[ -f /etc/apache2/mods-enabled/mpm_prefork.load ] || \
    ln -sf /etc/apache2/mods-available/mpm_prefork.load \
           /etc/apache2/mods-enabled/mpm_prefork.load
[ -f /etc/apache2/mods-available/mpm_prefork.conf ] && \
[ ! -f /etc/apache2/mods-enabled/mpm_prefork.conf ] && \
    ln -sf /etc/apache2/mods-available/mpm_prefork.conf \
           /etc/apache2/mods-enabled/mpm_prefork.conf || true

# ── 2. PORT fix ──────────────────────────────────────────────
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
for conf in /etc/apache2/sites-enabled/000-default.conf \
            /etc/apache2/sites-available/000-default.conf; do
    [ -f "$conf" ] && \
        sed -i 's/<VirtualHost \*:[0-9]*>/<VirtualHost *>/g' "$conf" || true
done
echo "[railway] Apache will listen on port ${LISTEN_PORT}"

# ── 3. Create wp-config.php (wordpress entrypoint, no Apache) ─
# Calling docker-entrypoint.sh with 'true' runs all WP setup
# (creates wp-config.php from env vars) then exits immediately.
docker-entrypoint.sh true || true

# ── 4. Start Apache in background so healthcheck can pass ────
apache2-foreground &
APACHE_PID=$!
echo "[railway] Apache started (PID ${APACHE_PID})"

# ── 5. Run BTG setup in background (installs WP + plugins) ──
# Runs asynchronously - Apache already serves /readme.html
# so healthcheck passes while plugins install.
(
  echo "[railway] Starting BTG WordPress setup..."
  bash /usr/local/bin/btg-setup.sh 2>&1
  echo "[railway] BTG setup complete."
) &

# ── 6. Wait on Apache (keeps container alive) ────────────────
wait ${APACHE_PID}


