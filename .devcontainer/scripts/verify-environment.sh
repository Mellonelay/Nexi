#!/usr/bin/env bash
set -u
export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
cd "${GITHUB_WORKSPACE:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

printf 'NEXI_CODESPACE_CAPABILITY_RECEIPT\n'
printf 'utc=%s\n' "$(date -u +%FT%TZ)"
printf 'git_head=%s\n' "$(git rev-parse HEAD 2>/dev/null || echo UNKNOWN)"
printf 'arch=%s\n' "$(uname -m)"
printf 'cpus=%s\n' "$(nproc 2>/dev/null || echo UNKNOWN)"
printf 'memory=%s\n' "$(free -h 2>/dev/null | awk '/Mem:/ {print $2}' || echo UNKNOWN)"
printf 'disk=%s\n' "$(df -h . 2>/dev/null | awk 'NR==2 {print $2" total, "$4" free"}' || echo UNKNOWN)"

probe() {
  local name="$1"; shift
  if command -v "$1" >/dev/null 2>&1; then
    printf '%-18s INSTALLED  ' "$name"
    ("$@" 2>&1 | head -n 1) || true
  else
    printf '%-18s MISSING\n' "$name"
  fi
}

probe git git --version
probe gh gh --version
probe node node --version
probe npm npm --version
probe pnpm pnpm --version
probe python python3 --version
probe uv uv --version
probe docker docker --version
probe codex codex --version
probe kilo kilo --version
probe graphify graphify --version
probe fallow fallow --version
probe codescene cs version
probe wrangler wrangler --version
probe sentry sentry --version
probe sentry-cli sentry-cli --version
if command -v avn >/dev/null 2>&1; then probe aiven avn --version; elif command -v aiven >/dev/null 2>&1; then probe aiven aiven --version; else printf '%-18s MISSING\n' aiven; fi
probe redis-cli redis-cli --version
probe psql psql --version

printf '\nAUTH/CALLABILITY (no secrets printed)\n'
if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then echo 'github             AUTHENTICATED'; else echo 'github             UNVERIFIED'; fi
if command -v codex >/dev/null 2>&1 && codex login status >/dev/null 2>&1; then echo 'codex              AUTHENTICATED'; else echo 'codex              UNVERIFIED'; fi
if command -v kilo >/dev/null 2>&1 && kilo auth list >/dev/null 2>&1; then echo 'kilo               AUTH_CONFIG_PRESENT'; else echo 'kilo               UNVERIFIED'; fi
if command -v wrangler >/dev/null 2>&1 && wrangler whoami >/dev/null 2>&1; then echo 'cloudflare         AUTHENTICATED'; else echo 'cloudflare         UNVERIFIED'; fi
[ -n "${OPENROUTER_API_KEY:-}" ] && echo 'openrouter         SECRET_PRESENT' || echo 'openrouter         UNCONFIGURED'
if [ -f "$HOME/.codex/config.toml" ]; then
  if grep -Eq '^model_provider\s*=\s*"openrouter"' "$HOME/.codex/config.toml" && grep -Eq '^model\s*=\s*"openrouter/free"' "$HOME/.codex/config.toml"; then
    echo 'openrouter_policy  FREE_ONLY_CONFIGURED'
  else
    echo 'openrouter_policy  REVIEW_REQUIRED'
  fi
else
  echo 'openrouter_policy  CONFIG_MISSING'
fi
if command -v sentry >/dev/null 2>&1; then echo 'sentry             CLI_PRESENT_AUTH_USER_MANAGED'; else echo 'sentry             CLI_MISSING'; fi
if command -v cs >/dev/null 2>&1; then echo 'codescene          CLI_PRESENT_AUTH_USER_MANAGED'; else echo 'codescene          CLI_MISSING'; fi
[ -n "${SENTRY_AUTH_TOKEN:-}" ] && echo 'sentry-cli         SECRET_PRESENT' || echo 'sentry-cli         UNCONFIGURED'
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] && echo 'cloudflare_token   SECRET_PRESENT' || true
[ -n "${AIVEN_TOKEN:-${AIVEN_AUTH_TOKEN:-}}" ] && echo 'aiven              SECRET_PRESENT' || echo 'aiven              UNCONFIGURED'

printf '\nPARALLEL FABRIC\n'
echo 'lane_capacity      6'
echo 'lane_policy        HETEROGENEOUS_EXECUTORS'
echo 'codex_openrouter   FREE_ONLY'
echo 'scheduler          CHATGPT_WORK_PARENT'
echo 'rdc_worker         MULTI_PROCESS_MULTI_WORKTREE'

printf '\nRDC\n'
if pgrep -af '@wonderwhy-er/desktop-commander.*remote|desktop-commander.*remote|desktopcommander.*remote' >/dev/null 2>&1; then
  echo 'rdc                PROCESS_PRESENT'
else
  echo 'rdc                NOT_RUNNING'
fi
[ -f "$HOME/.local/share/rdc/remote.log" ] && echo "rdc_log            $HOME/.local/share/rdc/remote.log"

printf '\nPROJECT\n'
[ -d node_modules ] && echo 'public_deps        PRESENT' || echo 'public_deps        MISSING'
[ -d backend/node_modules ] && echo 'backend_deps       PRESENT' || echo 'backend_deps       MISSING'
[ -d apps/admin/node_modules ] && echo 'admin_deps         PRESENT' || echo 'admin_deps         MISSING'
