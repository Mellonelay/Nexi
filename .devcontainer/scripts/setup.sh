#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/nexi"
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$PATH"

sudo apt-get update
sudo apt-get install -y --no-install-recommends curl ca-certificates jq ripgrep fd-find git git-lfs unzip zip zstd build-essential pkg-config libssl-dev redis-tools postgresql-client
sudo ln -sf "$(command -v fdfind)" /usr/local/bin/fd 2>/dev/null || true

# uv: Python tool/runtime manager.
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

# pnpm through the Node-bundled Corepack.
corepack enable || true
corepack prepare pnpm@latest --activate || true

# Engineering CLIs. Install independently so one optional package cannot block the Codespace.
install_npm_cli() {
  local pkg="$1"
  echo "==> npm global: $pkg"
  npm install -g "$pkg" || echo "WARN: optional npm CLI failed: $pkg" >&2
}
install_npm_cli '@openai/codex@latest'
install_npm_cli 'wrangler@latest'
install_npm_cli '@sentry/cli@latest'
install_npm_cli 'fallow@latest'

# Graphify is installed through uv when the package is available for this platform.
if ! command -v graphify >/dev/null 2>&1; then
  uv tool install graphify || echo 'WARN: Graphify installation needs follow-up; capability receipt will report it.' >&2
fi

# Aiven CLI. Prefer the isolated Python tool installation.
if ! command -v aiven >/dev/null 2>&1 && ! command -v avn >/dev/null 2>&1; then
  uv tool install aiven-client || echo 'WARN: Aiven CLI installation needs follow-up.' >&2
fi

# GitHub CLI is supplied by the devcontainer Feature. Authenticate via the Codespace/GitHub environment.
git lfs install --skip-repo || true

# Never install credentials here. Codex/OpenRouter/Sentry/Aiven/Cloudflare secrets are user/Codespaces secrets.
echo 'NEXI base engineering toolchain setup complete.'
