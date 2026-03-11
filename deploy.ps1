# ORBsignal Deploy Script
# Usage: .\deploy.ps1 "your commit message"

param([string]$msg = "update build")

Write-Host ""
Write-Host "Building..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed - aborting push" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git add .
git commit -m $msg
git push

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
