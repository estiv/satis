# Deploy Satis to cPanel from this PC.
# GitHub Actions SSH is blocked by the host firewall; deploy from your network instead.
#
# Usage (PowerShell):
#   cd D:\satis
#   powershell -ExecutionPolicy Bypass -File .\scripts\deploy-from-pc.ps1

$ErrorActionPreference = "Stop"

$HostName = "satisrental.com"
$User = "hundaft1"
$Key = Join-Path $env:USERPROFILE ".ssh\satis_deploy"

if (-not (Test-Path $Key)) {
  throw "Missing SSH key: $Key"
}

Write-Host "==> Building locally..."
npm run build
if ($LASTEXITCODE -ne 0) { throw "npm run build failed" }

$staging = Join-Path $env:TEMP "satis-deploy.tgz"
if (Test-Path $staging) { Remove-Item $staging -Force }

Write-Host "==> Packing files (excluding db, uploads, node_modules, .env)..."
tar -czf $staging `
  --exclude=.git `
  --exclude=.github `
  --exclude=node_modules `
  --exclude=.env `
  --exclude=.env.local `
  --exclude=prisma/satis.db `
  --exclude=prisma/satis.db-journal `
  --exclude=prisma/satis.db-wal `
  --exclude=uploads `
  --exclude=.next/cache `
  --exclude=.next/dev `
  --exclude=*.zip `
  --exclude=scripts/deploy-from-pc.ps1 `
  -C D:\satis `
  .

Write-Host "==> Uploading archive..."
scp -i $Key -o IdentitiesOnly=yes $staging "${User}@${HostName}:~/satis-deploy.tgz"
if ($LASTEXITCODE -ne 0) { throw "scp failed" }

Write-Host "==> Extracting on server + restart..."
$remote = @'
set -e
cd ~/satis
tar -xzf ~/satis-deploy.tgz
rm -f ~/satis-deploy.tgz
# never fail the whole deploy if prisma hits process limits; restart still runs
bash ~/satis/scripts/cpanel-after-deploy.sh || true
ls -la .next/BUILD_ID server.js
echo DEPLOY_OK
'@

ssh -i $Key -o IdentitiesOnly=yes "${User}@${HostName}" $remote
if ($LASTEXITCODE -ne 0) { throw "remote deploy failed" }

Remove-Item $staging -Force -ErrorAction SilentlyContinue
Write-Host "==> Done. Open https://satisrental.com"