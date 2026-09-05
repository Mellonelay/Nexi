#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/nexi" "$HOME/.local/share/rdc" "$HOME/.codex" "$HOME/.npm-global"
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
export NPM_CONFIG_PREFIX="$HOME/.npm-global"

# Persist user-local CLI paths for future terminals and lifecycle scripts.
npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
PROFILE_LINE='export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"'
grep -Fqx "$PROFILE_LINE" "$HOME/.profile" 2>/dev/null || printf '%s\n' "$PROFILE_LINE" >> "$HOME/.profile"

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  curl ca-certificates jq ripgrep fd-find git git-lfs unzip zip zstd \
  build-essential pkg-config libssl-dev redis-tools postgresql-client
sudo ln -sf "$(command -v fdfind)" /usr/local/bin/fd 2>/dev/null || true

if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi

corepack enable || true
corepack prepare pnpm@latest --activate || true

# npm 11 blocks unapproved lifecycle scripts in global/one-off contexts.
# Approve only the packages required by these trusted CLI installers.
install_npm_cli() {
  local pkg="$1"
  local allow_scripts="${2:-}"
  echo "==> npm global: $pkg"
  if [ -n "$allow_scripts" ]; then
    npm install -g --allow-scripts="$allow_scripts" "$pkg" || echo "WARN: optional npm CLI failed: $pkg" >&2
  else
    npm install -g "$pkg" || echo "WARN: optional npm CLI failed: $pkg" >&2
  fi
}

install_npm_cli '@openai/codex@latest'
install_npm_cli 'wrangler@latest' 'esbuild,workerd'
install_npm_cli '@sentry/cli@latest' '@sentry/cli'
install_npm_cli 'fallow@latest'
install_npm_cli '@kilocode/cli@latest' '@kilocode/cli'
install_npm_cli '@wonderwhy-er/desktop-commander@latest' '@wonderwhy-er/desktop-commander,sharp,puppeteer'
hash -r

# Graphify official PyPI package is graphifyy (double-y); the executable is graphify.
uv tool uninstall graphify-cli >/dev/null 2>&1 || true
uv tool install --force graphifyy || echo 'WARN: Graphify installation needs follow-up; capability receipt will report it.' >&2

# Aiven CLI is provided by the aiven-client package; the official executable is avn.
uv tool install --force aiven-client || echo 'WARN: Aiven CLI installation needs follow-up.' >&2

# New interactive Sentry developer CLI (distinct from legacy sentry-cli above).
if ! command -v sentry >/dev/null 2>&1; then
  curl https://cli.sentry.dev/install -fsS | bash || echo 'WARN: Sentry developer CLI installation needs follow-up.' >&2
fi

# CodeScene CLI official Linux installer. Feed the PATH-confirmation newline so
# Codespace lifecycle execution remains non-interactive.
if ! command -v cs >/dev/null 2>&1; then
  curl -fsSL https://downloads.codescene.io/enterprise/cli/install-cs-tool.sh | { printf '\n'; cat; } | sh || echo 'WARN: CodeScene CLI installation needs follow-up.' >&2
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
echo 'User auth remains intentionally separate: gh, wrangler, kilo, Sentry, CodeScene, Aiven, OpenRouter.'
