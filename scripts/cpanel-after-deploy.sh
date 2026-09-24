#!/bin/bash
set -eo pipefail

cd "$HOME/satis"
echo "Deploy as $(whoami) in $PWD"

activate=$(ls -d "$HOME"/nodevenv/satis/*/bin/activate 2>/dev/null | head -1 || true)
if [[ -z "$activate" ]]; then
  echo "Node.js app environment not found under $HOME/nodevenv/satis"
  ls -la "$HOME/nodevenv" || true
  exit 1
fi
# CloudLinux activate references CL_VIRTUAL_ENV; allow unset during source
set +u
# shellcheck disable=SC1090
source "$activate"
set +u
echo "node $(node -v)  npm $(npm -v)"

export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="--max-old-space-size=512"
# Stop Prisma from spawning a telemetry child (often hits nproc / EAGAIN)
export CHECKPOINT_DISABLE=1
export PRISMA_DISABLE_WARNINGS=1

echo "==> npm install (ignore-scripts)..."
npm install --ignore-scripts --maxsockets=1 --no-audit --no-fund --include=dev || {
  echo "npm install failed (continuing if node_modules already present)"
}

echo "==> prisma generate (optional on tight hosts)..."
npx prisma generate || echo "prisma generate failed - using existing client if present"

# Skip db push by default - it often hangs/EAGAIN on shared hosting.
# Schema changes: run manually when the account has free process slots:
#   npx prisma db push
echo "==> skipping prisma db push (run manually if schema changed)"

echo "==> upgrade (optional)..."
npx tsx src/core/upgrade.ts || echo "upgrade skipped/failed"

mkdir -p tmp uploads/dresses
chmod -R u+rwX uploads 2>/dev/null || true
touch tmp/restart.txt

if command -v cloudlinux-selector >/dev/null 2>&1; then
  cloudlinux-selector restart --json --interpreter nodejs --app-root "$HOME/satis" || true
fi

echo "Deploy finished."
exit 0
