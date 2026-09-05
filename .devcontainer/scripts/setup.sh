#!/usr/bin/env bash
set -Eeuo pipefail

export DEBIAN_FRONTEND=noninteractive
mkdir -p "$HOME/.local/bin" "$HOME/.local/share/nexi" "$HOME/.local/share/rdc" "$HOME/.codex" "$HOME/.npm-global"
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
export NPM_CONFIG_PREFIX="$HOME/.npm-global"

# Persist user-local CLI paths for both login and interactive VS Code shells.
npm config set prefix "$HOME/.npm-global" >/dev/null 2>&1 || true
PROFILE_LINE='export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"'
for shell_rc in "$HOME/.profile" "$HOME/.bashrc"; do
  touch "$shell_rc"
  grep -Fqx "$PROFILE_LINE" "$shell_rc" 2>/dev/null || printf '%s\n' "$PROFILE_LINE" >> "$shell_rc"
done

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

uv tool uninstall graphify-cli >/dev/null 2>&1 || true
uv tool install --force graphifyy || echo 'WARN: Graphify installation needs follow-up.' >&2
uv tool install --force aiven-client || echo 'WARN: Aiven CLI installation needs follow-up.' >&2

if ! command -v sentry >/dev/null 2>&1; then
  curl https://cli.sentry.dev/install -fsS | bash || echo 'WARN: Sentry developer CLI installation needs follow-up.' >&2
fi

# IMPORTANT: CodeScene's official installer can prompt for shell/PATH confirmation.
# Never run that interactive installer from a devcontainer lifecycle hook because it can
# deadlock Codespace create/rebuild. Install/repair CodeScene after startup through RDC.
if ! command -v cs >/dev/null 2>&1; then
  echo 'INFO: CodeScene CLI deferred until post-start RDC bootstrap (prevents rebuild deadlock).'
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
