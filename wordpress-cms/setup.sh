#!/bin/bash
# ─────────────────────────────────────────────────────────────
#  BTG WordPress First-Boot Setup
#  Run once after Railway deploy via: railway run btg-setup.sh
#
#  Required env vars (set in Railway dashboard):
#    WORDPRESS_DB_HOST, WORDPRESS_DB_USER, WORDPRESS_DB_PASSWORD
#    WORDPRESS_DB_NAME, WORDPRESS_SITE_URL
#    BTG_ADMIN_USER, BTG_ADMIN_PASSWORD, BTG_ADMIN_EMAIL
#    BTG_REVALIDATION_SECRET, BTG_PREVIEW_SECRET
#    BTG_NEXT_URL (e.g. https://www.booktheguide.com)
# ─────────────────────────────────────────────────────────────
set -e

WP="wp --allow-root --path=/var/www/html"
SITE_URL="${WORDPRESS_SITE_URL:-https://cms.booktheguide.com}"
NEXT_URL="${BTG_NEXT_URL:-https://www.booktheguide.com}"
ADMIN_USER="${BTG_ADMIN_USER:-btg_admin}"
ADMIN_PASS="${BTG_ADMIN_PASSWORD:-BTG@Admin2026!}"
ADMIN_EMAIL="${BTG_ADMIN_EMAIL:-admin@booktheguide.com}"

echo "═══════════════════════════════════════════"
echo "  BTG WordPress Setup — $(date)"
echo "═══════════════════════════════════════════"

# ── Wait for DB ───────────────────────────────
echo "⏳ Waiting for database..."
until mysqladmin ping -h"$WORDPRESS_DB_HOST" -u"$WORDPRESS_DB_USER" -p"$WORDPRESS_DB_PASSWORD" --silent 2>/dev/null; do
  sleep 2
done
echo "✅ Database ready"

# ── Install WordPress core ────────────────────
if ! $WP core is-installed 2>/dev/null; then
  echo "📦 Installing WordPress core..."
  $WP core install \
    --url="$SITE_URL" \
    --title="Book The Guide CMS" \
    --admin_user="$ADMIN_USER" \
    --admin_password="$ADMIN_PASS" \
    --admin_email="$ADMIN_EMAIL" \
    --skip-email
  echo "✅ WordPress installed"
else
  echo "ℹ️  WordPress already installed"
fi

# ── Install plugins ───────────────────────────
echo "📦 Installing plugins..."

# WPGraphQL
if ! $WP plugin is-installed wp-graphql 2>/dev/null; then
  $WP plugin install wp-graphql --activate
else
  $WP plugin activate wp-graphql
fi

# Yoast SEO (compatible with WP 6.5)
if ! $WP plugin is-installed wordpress-seo 2>/dev/null; then
  $WP plugin install 'https://downloads.wordpress.org/plugin/wordpress-seo.23.9.zip' --activate || \
  $WP plugin install wordpress-seo --activate || true
else
  $WP plugin activate wordpress-seo
fi

# WPGraphQL Yoast SEO
if ! $WP plugin is-installed add-wpgraphql-seo 2>/dev/null; then
  $WP plugin install add-wpgraphql-seo --activate
else
  $WP plugin activate add-wpgraphql-seo
fi

# Advanced Custom Fields (free)
if ! $WP plugin is-installed advanced-custom-fields 2>/dev/null; then
  $WP plugin install advanced-custom-fields --activate
else
  $WP plugin activate advanced-custom-fields
fi

# WPGraphQL for ACF
if ! $WP plugin is-installed wpgraphql-acf 2>/dev/null; then
  $WP plugin install wpgraphql-acf --activate
else
  $WP plugin activate wpgraphql-acf
fi

echo "✅ Plugins installed and activated"

# ── Activate BTG theme ────────────────────────
echo "🎨 Activating btg-headless theme..."
$WP theme activate btg-headless
echo "✅ Theme active"

# ── Configure settings ────────────────────────
echo "⚙️  Configuring settings..."
$WP rewrite structure '/%postname%/' --hard
$WP option update blogdescription 'Book The Guide - Your Travel Partner'
$WP option update default_comment_status closed
$WP option update default_ping_status closed

# Disable XML-RPC (security)
$WP option update enable_xmlrpc 0 || true

# ── Inject BTG constants into wp-config ───────
echo "🔑 Writing BTG constants to wp-config.php..."
$WP config set BTG_NEXT_URL "$NEXT_URL" --type=constant
$WP config set BTG_REVALIDATION_SECRET "${BTG_REVALIDATION_SECRET:-btg-revalidation-secret-2026}" --type=constant
$WP config set BTG_PREVIEW_SECRET "${BTG_PREVIEW_SECRET:-btg-preview-secret-2026}" --type=constant
$WP config set GRAPHQL_JWT_AUTH_SECRET_KEY "${GRAPHQL_JWT_SECRET:-btg-jwt-secret-2026}" --type=constant
$WP config set DISABLE_WP_CRON true --type=constant --raw
$WP config set WP_MEMORY_LIMIT '256M' --type=constant

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ BTG WordPress setup complete!"
echo "  Admin URL: $SITE_URL/wp-admin"
echo "  GraphQL:   $SITE_URL/graphql"
echo "  Username:  $ADMIN_USER"
echo "═══════════════════════════════════════════"
