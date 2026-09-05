#!/usr/bin/env bash
set -u
cd "${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# postStart must remain cheap and idempotent. It does not install dependencies,
# mutate application source, run migrations, deploy, or start public ports.
git status --short --branch || true
bash .devcontainer/scripts/verify-environment.sh || true

cat <<'EOF'
NEXI Codespace started.
ChatGPT Work is the sole parent scheduler and may use up to six dependency-safe heterogeneous lanes.
ChatGPT-RDC is Worker 0 and may drive multiple concurrent processes/worktrees.
Codex CLI is one subordinate worker type; when routed through OpenRouter it must use FREE models only.
Graphify + Fallow + CodeScene determine dependency/coupling safety before parallel mutation.
Sentry is runtime evidence only; it does not replace source, D1, ledger, or acceptance authority.
Authenticate OpenRouter, CodeScene, Sentry, Aiven, Cloudflare, and other user-owned services yourself.
EOF
