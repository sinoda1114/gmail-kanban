#!/usr/bin/env bash
# Cloud Agent / 手元で Codex CLI を冪等インストールし、ChatGPT 資格情報を載せる。
set -euo pipefail

PREFIX="${CODEX_PREFIX:-$HOME/.local}"
export PATH="${PREFIX}/bin:${PATH}"

if ! command -v npm >/dev/null 2>&1; then
  echo "bootstrap-codex-cli: npm が無い" >&2
  exit 1
fi

if ! command -v codex >/dev/null 2>&1; then
  npm install -g --prefix "$PREFIX" @openai/codex
fi

MARKER="# gmail-kanban-codex-cli"
BASHRC="${HOME}/.bashrc"
if [[ -f "$BASHRC" ]] && ! grep -q "$MARKER" "$BASHRC"; then
  cat >>"$BASHRC" <<EOF

${MARKER}
export PATH="${PREFIX}/bin:\$PATH"
SECRETS_LOAD="\$HOME/.config/gmail-kanban-secrets/load.sh"
if [[ -f "\$SECRETS_LOAD" ]]; then
  # shellcheck disable=SC1090
  source "\$SECRETS_LOAD"
fi
EOF
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
"${SCRIPT_DIR}/sync-codex-auth.sh"

echo "bootstrap-codex-cli: $(command -v codex) $(codex --version 2>/dev/null || true)"
codex login status
