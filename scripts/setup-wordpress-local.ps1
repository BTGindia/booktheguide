# WordPress + Next.js Quick Setup for Windows
# Run: .\scripts\setup-wordpress-local.ps1

Write-Host "🚀 Starting Book The Guide WordPress setup..." -ForegroundColor Cyan

# Check Docker
try {
    $dockerVersion = docker --version
    Write-Host "✅ Docker found: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker not found. Please install Docker Desktop: https://docker.com/products/docker-desktop" -ForegroundColor Red
    exit 1
}

# Start Docker services
Write-Host "`n📦 Starting Docker containers..." -ForegroundColor Cyan
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
Write-Host "`n⏳ Waiting for WordPress to start (30 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Check if WordPress is ready
$ready = $false
$attempts = 0
while (-not $ready -and $attempts -lt 10) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000" -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
        }
    } catch {
        $attempts++
        Write-Host "  Attempting connection... ($attempts/10)" -ForegroundColor DarkYellow
        Start-Sleep -Seconds 5
    }
}

if (-not $ready) {
    Write-Host "⚠️  WordPress may still be starting. Please wait and check http://localhost:8000" -ForegroundColor Yellow
}

# Install WordPress
Write-Host "`n🔧 Installing WordPress..." -ForegroundColor Cyan
try {
    docker-compose exec -T wordpress wp core install `
        --url="http://localhost:8000" `
        --title="Book The Guide" `
        --admin_user="admin" `
        --admin_password="TempPassword123!" `
        --admin_email="admin@booktheguide.local" `
        --skip-email 2>&1 | Out-Null
    Write-Host "✅ WordPress installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️  WordPress may already be installed" -ForegroundColor Yellow
}

# Install WPGraphQL
Write-Host "`n📡 Installing WPGraphQL plugin..." -ForegroundColor Cyan
try {
    docker-compose exec -T wordpress wp plugin install wp-graphql --activate 2>&1 | Out-Null
    Write-Host "✅ WPGraphQL installed and activated" -ForegroundColor Green
} catch {
    Write-Host "⚠️  WPGraphQL may already be installed" -ForegroundColor Yellow
}

# Summary
Write-Host "`n" -ForegroundColor White
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "`n📖 Next Steps:" -ForegroundColor Cyan

Write-Host "`n1️⃣  WordPress Admin:"
Write-Host "   URL:      http://localhost:8000/wp-admin" -ForegroundColor White
Write-Host "   Username: admin" -ForegroundColor White
Write-Host "   Password: TempPassword123!" -ForegroundColor White

Write-Host "`n2️⃣  Configure .env.local:"
Write-Host "   WORDPRESS_GRAPHQL_URL=http://localhost:8000/graphql" -ForegroundColor White

Write-Host "`n3️⃣  Start Next.js:"
Write-Host "   npm run dev" -ForegroundColor White

Write-Host "`n4️⃣  Visit:"
Write-Host "   http://localhost:3000" -ForegroundColor White

Write-Host "`n" -ForegroundColor White
Write-Host "Docker Setup: docker-compose ps" -ForegroundColor DarkGray
Write-Host "Check WordPress: http://localhost:8000" -ForegroundColor DarkGray
