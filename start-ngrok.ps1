# BookTheGuide - ngrok Tunnel Starter
# This script exposes your local dev server to the internet via ngrok

$ngrokPath = "$env:USERPROFILE\ngrok\ngrok.exe"
$port = 3000
$domain = "www.booktheguide.com"

Write-Host "`n=== BookTheGuide ngrok Tunnel ===" -ForegroundColor Cyan
Write-Host "Local dev server: http://localhost:$port`n" -ForegroundColor Yellow

# Check if authtoken is configured
$configPath = "$env:USERPROFILE\AppData\Local\ngrok\ngrok.yml"
if (-not (Test-Path $configPath)) {
    Write-Host "ERROR: ngrok not authenticated!" -ForegroundColor Red
    Write-Host "`n1. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken" -ForegroundColor Yellow
    Write-Host "2. Run: $ngrokPath config add-authtoken YOUR_TOKEN`n" -ForegroundColor Yellow
    exit 1
}

# Ask which mode to use
Write-Host "Choose mode:" -ForegroundColor Cyan
Write-Host "  [1] Custom domain (www.booktheguide.com) - Requires paid plan" -ForegroundColor White
Write-Host "  [2] Free temporary URL (https://xxxxx.ngrok-free.app)" -ForegroundColor White
$choice = Read-Host "`nEnter choice (1 or 2)"

if ($choice -eq "1") {
    Write-Host "`nStarting ngrok with custom domain: $domain" -ForegroundColor Green
    Write-Host "Note: Make sure you've added the domain in ngrok dashboard and configured CNAME in GoDaddy`n" -ForegroundColor Yellow
    & $ngrokPath http --domain=$domain $port
} else {
    Write-Host "`nStarting ngrok with free temporary URL..." -ForegroundColor Green
    Write-Host "Your URL will be shown below (changes each session)`n" -ForegroundColor Yellow
    & $ngrokPath http $port
}
