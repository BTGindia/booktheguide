Param()
$ErrorActionPreference = 'Stop'
$token = '3AF33WyU9qYjlu7dFJnzRMVj8C0_4oP427yHLKnjVMbX2gt2H'
$ngrokDir = Join-Path $env:USERPROFILE 'ngrok'
$urls = @(
    'https://github.com/ngrok/ngrok/releases/latest/download/ngrok-v3-stable-windows-amd64.zip',
    'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip',
    'https://github.com/ngrok/ngrok/releases/download/v3.20.0/ngrok-v3-stable-windows-amd64.zip'
)
if (-not (Test-Path $ngrokDir)) { New-Item -ItemType Directory -Path $ngrokDir | Out-Null }
$out = Join-Path $env:TEMP 'ngrok_v3.zip'
$exe = Join-Path $ngrokDir 'ngrok.exe'
$installed = $false
foreach ($u in $urls) {
    Write-Host "Trying download: $u"
    try {
        Invoke-WebRequest -Uri $u -OutFile $out -UseBasicParsing -ErrorAction Stop
        Expand-Archive -Path $out -DestinationPath $ngrokDir -Force
        if (Test-Path $exe) {
            $verOut = (& $exe version) -join "`n"
            Write-Host "ngrok version output:`n$verOut"
            if ($verOut -match '(\d+\.\d+\.\d+)') {
                $v = [version]$matches[1]
                if ($v -ge [version]'3.20.0') { $installed = $true; break }
            }
        }
    } catch {
        Write-Host ("Download/install failed for {0}: {1}" -f $u, $_.ToString())
    }
}
if (-not $installed) { Write-Error "Failed to install a compatible ngrok v3 (>=3.20.0)."; exit 2 }
Write-Host "Using ngrok: $exe"
# Try adding authtoken using v3 command; try fallbacks
try { & $exe config add-authtoken $token } catch { try { & $exe authtoken $token } catch { Write-Warning "Failed to save authtoken via both commands." } }
Start-Sleep -Seconds 1
# Start ngrok http 3000 in background
$proc = Start-Process -FilePath $exe -ArgumentList 'http','3000' -WindowStyle Hidden -PassThru
Write-Host "Started ngrok (pid $($proc.Id)). Waiting for tunnel..."
$ready = $false
for ($i=0; $i -lt 30; $i++) {
    try {
        $resp = Invoke-RestMethod -Uri http://127.0.0.1:4040/api/tunnels -UseBasicParsing -ErrorAction Stop
        if ($resp.tunnels.Count -gt 0) { $ready = $true; break }
    } catch { Start-Sleep -Seconds 1 }
}
if (-not $ready) { Write-Error "Ngrok API did not respond or no tunnels found."; exit 3 }
# Print URLs
foreach ($t in $resp.tunnels) { Write-Host "Public URL: $($t.public_url) -> $($t.config.addr)" }
# Also output JSON to make it easy to parse
$resp | ConvertTo-Json -Depth 5
