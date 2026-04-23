# ───────────────────────────────────────────────────────────
#  WordPress Headless CMS — Automated Setup Script (Windows)
#  Run AFTER `docker-compose up -d` and WordPress is reachable
#  Usage: powershell -ExecutionPolicy Bypass -File scripts\setup-wordpress.ps1
# ───────────────────────────────────────────────────────────

param(
    [string]$SiteTitle   = "Book The Guide",
    [string]$AdminUser   = "btg_admin",
    [string]$AdminPass   = "BTG@Admin2026!",
    [string]$AdminEmail  = "admin@booktheguide.com",
    [string]$SiteUrl     = "http://localhost:8000"
)

$ErrorActionPreference = "Stop"

function Write-Step { param($msg) Write-Host "`n== $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "   OK  $msg" -ForegroundColor Green }
function Write-Warn { param($msg) Write-Host "   !!  $msg" -ForegroundColor Yellow }

# Helper: run a wp-cli command inside the wpcli container
function WP {
    param([string[]]$Args)
    $joined = $Args -join " "
    $result = docker-compose exec -T wpcli wp --allow-root $Args 2>&1
    return $result
}

Write-Host "`n==========================================" -ForegroundColor Magenta
Write-Host "  Book The Guide — WordPress Setup" -ForegroundColor Magenta
Write-Host "==========================================`n" -ForegroundColor Magenta

# ── 0. Check Docker is running ──────────────────────────────
Write-Step "Checking Docker services"
$status = docker-compose ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker not running. Starting services..." -ForegroundColor Yellow
    docker-compose up -d
    Write-Host "Waiting 30 seconds for services to start..."
    Start-Sleep -Seconds 30
}
Write-OK "Docker services running"

# ── 1. Wait for WordPress ───────────────────────────────────
Write-Step "Waiting for WordPress to be ready"
$ready = $false
for ($i = 1; $i -le 30; $i++) {
    try {
        $resp = Invoke-WebRequest -Uri "http://localhost:8000/wp-admin/install.php" -TimeoutSec 3 -ErrorAction SilentlyContinue
        if ($resp.StatusCode -eq 200) { $ready = $true; break }
    } catch { }
    Write-Host "   Attempt $i/30 ..." -ForegroundColor Gray
    Start-Sleep -Seconds 2
}
if (-not $ready) {
    Write-Warn "WordPress may not be fully ready. Continuing anyway..."
}
Write-OK "WordPress is reachable"

# ── 2. Install WordPress (if not already installed) ─────────
Write-Step "Installing WordPress core"
$installed = docker-compose exec -T wpcli wp --allow-root core is-installed 2>&1
if ($LASTEXITCODE -ne 0) {
    docker-compose exec -T wpcli wp --allow-root core install `
        "--url=$SiteUrl" `
        "--title=$SiteTitle" `
        "--admin_user=$AdminUser" `
        "--admin_password=$AdminPass" `
        "--admin_email=$AdminEmail" `
        --skip-email
    Write-OK "WordPress installed"
    Write-Host "   Admin URL : $SiteUrl/wp-admin" -ForegroundColor White
    Write-Host "   Username  : $AdminUser" -ForegroundColor White
    Write-Host "   Password  : $AdminPass" -ForegroundColor White
} else {
    Write-OK "WordPress already installed"
}

# ── 3. Activate our custom theme ────────────────────────────
Write-Step "Activating BTG Headless theme"
docker-compose exec -T wpcli wp --allow-root theme activate btg-headless 2>&1 | Out-Null
Write-OK "Theme activated"

# ── 4. Install required plugins ─────────────────────────────
Write-Step "Installing required plugins"

$plugins = @(
    @{ slug = "wp-graphql";             name = "WPGraphQL" },
    @{ slug = "wpgraphql-acf";          name = "WPGraphQL for ACF" },
    @{ slug = "add-wpgraphql-seo";      name = "WPGraphQL Yoast SEO" },
    @{ slug = "wordpress-seo";          name = "Yoast SEO" },
    @{ slug = "classic-editor";         name = "Classic Editor (optional)" }
)

foreach ($plugin in $plugins) {
    Write-Host "   Installing $($plugin.name) ..." -ForegroundColor Gray
    $out = docker-compose exec -T wpcli wp --allow-root plugin install $($plugin.slug) --activate 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-OK "$($plugin.name) installed & activated"
    } else {
        Write-Warn "$($plugin.name) — $out"
    }
}

# ── 5. Configure WordPress settings ─────────────────────────
Write-Step "Configuring WordPress settings"

# Set permalink structure
docker-compose exec -T wpcli wp --allow-root rewrite structure "/%postname%/" --hard 2>&1 | Out-Null
Write-OK "Permalink structure: /%postname%/"

# Disable comments globally
docker-compose exec -T wpcli wp --allow-root option update default_comment_status closed 2>&1 | Out-Null
Write-OK "Comments disabled"

# Discourage search engines on local dev
docker-compose exec -T wpcli wp --allow-root option update blog_public 0 2>&1 | Out-Null
Write-OK "Search engine indexing discouraged (local dev)"

# Set blog description
docker-compose exec -T wpcli wp --allow-root option update blogdescription "India's Premier Local Guide Booking Platform" 2>&1 | Out-Null

# ── 6. Remove default content ───────────────────────────────
Write-Step "Removing default WordPress content"

# Delete default posts
docker-compose exec -T wpcli wp --allow-root post delete 1 2 --force 2>&1 | Out-Null
Write-OK "Default posts removed"

# ── 7. Create sample page structure ─────────────────────────
Write-Step "Creating page structure"

$pages = @("about", "contact", "privacy", "terms", "blog", "explore", "experiences")
foreach ($pageSlug in $pages) {
    $pageTitle = (Get-Culture).TextInfo.ToTitleCase($pageSlug)
    $existing = docker-compose exec -T wpcli wp --allow-root post list --post_type=page --name=$pageSlug --format=count 2>&1
    if ([int]$existing -eq 0) {
        docker-compose exec -T wpcli wp --allow-root post create `
            "--post_type=page" `
            "--post_title=$pageTitle" `
            "--post_name=$pageSlug" `
            "--post_status=publish" `
            "--post_content=<!-- WordPress content for $pageTitle -->" 2>&1 | Out-Null
        Write-OK "Page created: /$pageSlug"
    } else {
        Write-OK "Page exists: /$pageSlug"
    }
}

# ── 8. Final status ─────────────────────────────────────────
Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "==========================================`n" -ForegroundColor Green

Write-Host "Access Points:" -ForegroundColor White
Write-Host "  WordPress Admin  : http://localhost:8000/wp-admin" -ForegroundColor Cyan
Write-Host "  GraphQL Endpoint : http://localhost:8000/graphql" -ForegroundColor Cyan
Write-Host "  REST API         : http://localhost:8000/wp-json/wp/v2" -ForegroundColor Cyan
Write-Host "  Next.js Frontend : http://localhost:3000`n" -ForegroundColor Cyan

Write-Host "Admin Credentials:" -ForegroundColor White
Write-Host "  Username : $AdminUser" -ForegroundColor Yellow
Write-Host "  Password : $AdminPass`n" -ForegroundColor Yellow

Write-Host "Next Steps:" -ForegroundColor White
Write-Host "  1. Install Advanced Custom Fields PRO (requires license key)" -ForegroundColor Gray
Write-Host "     → https://www.advancedcustomfields.com" -ForegroundColor Gray
Write-Host "  2. Start Next.js: npm run dev" -ForegroundColor Gray
Write-Host "  3. Visit http://localhost:3000 to see the site" -ForegroundColor Gray
Write-Host "  4. Create content in WordPress, it will appear on Next.js`n" -ForegroundColor Gray
