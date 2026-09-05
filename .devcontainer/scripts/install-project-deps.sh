#!/usr/bin/env bash
set -Eeuo pipefail
cd "${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel)}"

install_js_tree() {
  local dir="$1"
  [ -f "$dir/package.json" ] || return 0
  echo "==> dependencies: $dir"
  if [ -f "$dir/pnpm-lock.yaml" ]; then
    (cd "$dir" && corepack enable && pnpm install --frozen-lockfile)
  elif [ -f "$dir/yarn.lock" ]; then
    (cd "$dir" && corepack enable && yarn install --immutable)
  elif [ -f "$dir/package-lock.json" ]; then
    (cd "$dir" && npm ci)
  else
    # Current NEXI trees may not carry a lockfile; do not manufacture one during Codespace bootstrap.
    (cd "$dir" && npm install --no-package-lock)
  fi
}

install_js_tree .
install_js_tree backend
install_js_tree apps/admin

# Generate Prisma client if backend dependencies are present; this is source generation, not a DB migration.
if [ -x backend/node_modules/.bin/prisma ]; then
  (cd backend && npx --no-install prisma generate) || echo 'WARN: Prisma generate failed; verify backend environment.' >&2
fi

echo 'NEXI project dependency bootstrap complete.'
