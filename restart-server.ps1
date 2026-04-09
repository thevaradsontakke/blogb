# Restart Server Script
Write-Host "`n🔄 Restarting VaradBuilds Server...`n" -ForegroundColor Cyan

# Stop all Node processes
Write-Host "Stopping all Node.js processes..." -ForegroundColor Yellow
Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# Check if any Node processes are still running
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Some Node processes are still running. Trying again..." -ForegroundColor Yellow
    Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep -Seconds 2
}

Write-Host "✅ All Node processes stopped`n" -ForegroundColor Green

# Start the server
Write-Host "Starting server...`n" -ForegroundColor Cyan
npm start
