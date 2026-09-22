#!/bin/bash
set -euo pipefail

cd "$HOME/satis"
echo "Deploy as $(whoami) in $PWD"

activate=$(ls -d "$HOME"/nodevenv/satis/*/bin/activate 2>/dev/null | head -1 || true)
if [[ -z "$activate" ]]; then
  echo "Node.js app environment not found under $HOME/nodevenv/satis"
  ls -la "$HOME/nodevenv" || true
  exit 1
fi
# shellcheck disable=SC1090
source "$activate"
echo "node $(node -v)  npm $(npm -v)"

export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=512}"

# Host often SIGABRTs on package postinstall scripts (esbuild/prisma)
npm install --ignore-scripts --maxsockets=1 --no-audit --no-fund --include=dev

npx prisma generate
npx prisma db push || echo "prisma db push skipped/failed (DB may already be current)"
npx tsx src/core/upgrade.ts || echo "upgrade skipped/failed"

mkdir -p tmp uploads/dresses
chmod -R u+rwX uploads || true
touch tmp/restart.txt

if command -v cloudlinux-selector >/dev/null 2>&1; then
  cloudlinux-selector restart --json --interpreter nodejs --app-root "$HOME/satis" || true
fi

echo "Deploy finished."
