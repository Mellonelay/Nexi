#!/usr/bin/env bash
set -Eeuo pipefail
cd "${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel)}"

failures=0

install_js_tree() {
  local dir="$1"
  [ -f "$dir/package.json" ] || return 0
  echo "==> dependencies: $dir"

  set +e
  if [ -f "$dir/pnpm-lock.yaml" ]; then
    (cd "$dir" && corepack enable && pnpm install --frozen-lockfile)
  elif [ -f "$dir/yarn.lock" ]; then
    (cd "$dir" && corepack enable && yarn install --immutable)
  elif [ -f "$dir/package-lock.json" ]; then
    (cd "$dir" && npm ci)
  else
    (cd "$dir" && npm install --no-package-lock)
  fi
  rc=$?
  set -e

  if [ "$rc" -ne 0 ]; then
    echo "WARN: dependency installation failed in $dir (exit $rc); Codespace creation will continue so the failure can be repaired interactively." >&2
    failures=$((failures + 1))
  fi
}

install_js_tree .
install_js_tree backend
install_js_tree apps/admin

if [ -x backend/node_modules/.bin/prisma ]; then
  (cd backend && npx --no-install prisma generate) || {
    echo 'WARN: Prisma generate failed; verify backend environment after Codespace creation.' >&2
    failures=$((failures + 1))
  }
fi

if [ "$failures" -gt 0 ]; then
  echo "NEXI project dependency bootstrap completed with $failures recoverable failure(s)." >&2
else
  echo 'NEXI project dependency bootstrap complete.'
fi

exit 0
