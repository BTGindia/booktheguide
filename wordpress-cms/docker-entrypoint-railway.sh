#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  Railway entrypoint for WordPress
#
#  Flow:
#   1. Fix MPM conflict (hard-delete conflicting module symlinks)
#   2. Write $PORT directly into ports.conf + fix VirtualHost
#   3. Start docker-entrypoint.sh apache2-foreground in background
#      → copies /usr/src/wordpress → /var/www/html (readme.html)
#      → creates wp-config.php from WORDPRESS_* env vars
#      → starts Apache on the corrected port
#   4. Run btg-setup.sh in background (installs WP + plugins)
#   5. Wait on the entrypoint PID (keeps container alive)
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

# ── 3. Start WP entrypoint (copies files + wp-config + Apache) ─
# IMPORTANT: docker-entrypoint.sh only copies /usr/src/wordpress
# to /var/www/html when the command argument is apache2-foreground.
# Using 'true' skips the copy entirely, leaving /var/www/html empty.
docker-entrypoint.sh apache2-foreground &
ENTRYPOINT_PID=$!
echo "[railway] WordPress entrypoint started (PID ${ENTRYPOINT_PID})"

# ── 4. Run BTG setup in background (installs WP + plugins) ──
# Runs asynchronously - setup.sh waits for DB and for WP files
# before running wp-cli commands.
(
  echo "[railway] Starting BTG WordPress setup..."
  bash /usr/local/bin/btg-setup.sh 2>&1
  echo "[railway] BTG setup complete."
) &

# ── 5. Wait on entrypoint (keeps container alive) ────────────
wait ${ENTRYPOINT_PID}


