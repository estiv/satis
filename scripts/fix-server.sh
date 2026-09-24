#!/bin/bash
set +u
cd /home/hundaft1/satis || exit 1
source /home/hundaft1/nodevenv/satis/22/bin/activate
set +u
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS="--max-old-space-size=512"
export CHECKPOINT_DISABLE=1

echo "node=$(node -v)"
echo "cwd=$(pwd)"
ls -la node_modules/next/package.json

echo "==> npm install"
npm install --ignore-scripts --maxsockets=1 --no-audit --no-fund --include=dev

echo "==> check next"
node -e 'console.log(require.resolve("next"))'

echo "==> prisma generate"
npx prisma generate || true

mkdir -p tmp uploads/dresses
touch tmp/restart.txt

echo "==> restart app"
cloudlinux-selector restart --json --interpreter nodejs --app-root /home/hundaft1/satis || true

echo "==> recent stderr"
tail -n 20 stderr.log || true
echo FIX_DONE
