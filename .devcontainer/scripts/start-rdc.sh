#!/usr/bin/env bash
set -Eeuo pipefail

export PATH="$HOME/.local/bin:$HOME/.npm-global/bin:$HOME/.cargo/bin:$PATH"
mkdir -p "$HOME/.local/share/rdc"

PID_FILE="$HOME/.local/share/rdc/remote.pid"
LOG_FILE="$HOME/.local/share/rdc/remote.log"

if [ -f "$PID_FILE" ]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [ -n "$old_pid" ] && kill -0 "$old_pid" 2>/dev/null; then
    echo "RDC remote device already running (pid=$old_pid)."
    exit 0
  fi
fi

NPX="$(command -v npx || true)"
if [ -z "$NPX" ]; then
  echo 'ERROR: npx is not on PATH; Node/npm bootstrap is incomplete.' >&2
  exit 127
fi

# Use the shell-resolved npx path. Do not hard-code NVM or devcontainer feature paths.
nohup "$NPX" -y @wonderwhy-er/desktop-commander@latest remote \
  > "$LOG_FILE" 2>&1 < /dev/null &
pid=$!
printf '%s\n' "$pid" > "$PID_FILE"

sleep 3
if kill -0 "$pid" 2>/dev/null; then
  echo "RDC remote device started persistently (pid=$pid)."
  echo "Log: $LOG_FILE"
  tail -n 20 "$LOG_FILE" || true
  exit 0
fi

echo 'ERROR: RDC remote device exited during startup.' >&2
cat "$LOG_FILE" >&2 || true
exit 1
