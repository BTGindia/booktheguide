$log = "C:\Users\arudh\BTG\wsl2-setup-log.txt"
"Starting WSL2 setup at $(Get-Date)" | Out-File $log

try {
    $r1 = Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux -NoRestart -All
    "WSL Feature: $($r1.RestartNeeded)" | Add-Content $log
} catch {
    "WSL Feature Error: $_" | Add-Content $log
}

try {
    $r2 = Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart -All
    "VMP Feature: $($r2.RestartNeeded)" | Add-Content $log
} catch {
    "VMP Feature Error: $_" | Add-Content $log
}

try {
    wsl --set-default-version 2 2>&1 | Add-Content $log
} catch {
    "WSL default version error: $_" | Add-Content $log
}

"Setup completed at $(Get-Date). RESTART REQUIRED." | Add-Content $log
Write-Host "Done! Check wsl2-setup-log.txt"
