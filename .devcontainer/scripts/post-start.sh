#!/usr/bin/env bash
set -u
cd "${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# postStart must remain cheap and idempotent. It does not install dependencies,
# mutate application source, run migrations, deploy, or start public ports.
git status --short --branch || true
bash .devcontainer/scripts/verify-environment.sh || true

cat <<'EOF'
NEXI Codespace started.
RDC/Desktop Commander is intentionally treated as the ChatGPT direct execution plane.
If RDC is not yet connected, establish that authenticated connection before engineering execution.
Codex CLI is optional parallel acceleration; it is not the parent controller.
EOF
