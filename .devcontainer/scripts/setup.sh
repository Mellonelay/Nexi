#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/nexi" "$HOME/.codex" "$HOME/.npm-global"
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
export NPM_CONFIG_PREFIX="$HOME/.npm-global"

sudo apt-get update
sudo apt-get install -y --no-install-recommends curl ca-certificates jq ripgrep fd-find git git-lfs unzip zip zstd build-essential pkg-config libssl-dev redis-tools postgresql-client
sudo ln -sf "$(command -v fdfind)" /usr/local/bin/fd 2>/dev/null || true

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

corepack enable || true
corepack prepare pnpm@latest --activate || true

install_npm_cli() {
  local pkg="$1"
  echo "==> npm global: $pkg"
  npm install -g "$pkg" || echo "WARN: optional npm CLI failed: $pkg" >&2
}

install_npm_cli '@openai/codex@latest'
install_npm_cli 'wrangler@latest'
install_npm_cli '@sentry/cli@latest'
install_npm_cli 'fallow@latest'

if ! command -v graphify >/dev/null 2>&1; then
  uv tool install graphify || echo 'WARN: Graphify installation needs follow-up; capability receipt will report it.' >&2
fi

if ! command -v aiven >/dev/null 2>&1 && ! command -v avn >/dev/null 2>&1; then
  uv tool install aiven-client || echo 'WARN: Aiven CLI installation needs follow-up.' >&2
fi

if ! command -v sentry >/dev/null 2>&1; then
  curl https://cli.sentry.dev/install -fsS | bash || echo 'WARN: Sentry developer CLI installation needs follow-up.' >&2
fi

if ! command -v cs >/dev/null 2>&1; then
  echo 'INFO: CodeScene CLI (cs) not installed. Install from official CodeScene CLI instructions, then run `cs auth login` yourself.' >&2
fi

if [ ! -f "$HOME/.codex/config.toml" ]; then
  cat > "$HOME/.codex/config.toml" <<'EOF'
model = "openrouter/free"
model_provider = "openrouter"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
env_key = "OPENROUTER_API_KEY"
wire_api = "responses"
request_max_retries = 4
stream_max_retries = 10
stream_idle_timeout_ms = 300000

[sandbox_workspace_write]
network_access = true
EOF
else
  echo 'INFO: ~/.codex/config.toml already exists; not overwriting user configuration.'
fi

git lfs install --skip-repo || true

echo 'NEXI base engineering toolchain setup complete.'
