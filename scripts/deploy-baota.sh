#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REMOTE="${DEPLOY_HOST:-root@118.25.13.91}"
REMOTE_DIR="${DEPLOY_DIR:-/www/wwwroot/huobao-drama}"
SSH_KEY="${DEPLOY_SSH_KEY:-$HOME/.ssh/id_rsa}"

echo "==> Sync project to ${REMOTE}:${REMOTE_DIR}"
rsync -avz --delete \
  -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=accept-new" \
  --exclude node_modules \
  --exclude frontend/node_modules \
  --exclude backend/node_modules \
  --exclude data \
  --exclude .env \
  --exclude .git \
  --exclude frontend/.nuxt \
  --exclude frontend/.output \
  "${ROOT}/" "${REMOTE}:${REMOTE_DIR}/"

echo "==> Install & build on remote"
ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=accept-new "${REMOTE}" bash -s <<EOF
set -euo pipefail
cd "${REMOTE_DIR}"
if [ ! -f .env ]; then
  cp .env.example .env
  echo "WARN: created .env from example — edit API keys on server"
fi
cd backend && npm ci && npm run typecheck
cd ../frontend && npm ci && NUXT_APP_BASE_URL=/huobao-drama/ npm run generate
mkdir -p dist
rm -rf dist/*
cp -r .output/public/* dist/
cp -f public/favicon.png dist/favicon.png 2>/dev/null || cp -f app/public/favicon.png dist/favicon.png 2>/dev/null || true
cd ..
if command -v pm2 >/dev/null 2>&1; then
  pm2 delete huobao-drama 2>/dev/null || true
  pm2 start backend/src/index.ts --name huobao-drama --interpreter ./backend/node_modules/.bin/tsx --cwd "${REMOTE_DIR}"
  pm2 save
else
  echo "pm2 not found — start manually: cd backend && npm start"
fi
EOF

echo "==> Done. Configure Baota reverse proxy to port \${PORT:-5679}"
