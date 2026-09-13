#!/usr/bin/env bash
# ChatGPT ログイン済みの Codex CLI 資格情報をホームへ置く。中身は出さない。
# 正本（どれか1つ）:
#   $SECRETS_DIR/codex-auth.json
#   $CODEX_AUTH_JSON_PATH
#   $CODEX_AUTH_JSON（ファイル中身そのもの）
set -euo pipefail

SECRETS_DIR="${SECRETS_DIR:-$HOME/.config/gmail-kanban-secrets}"
DEST="${CODEX_HOME:-$HOME/.codex}/auth.json"
SRC=""

if [[ -n "${CODEX_AUTH_JSON_PATH:-}" && -f "${CODEX_AUTH_JSON_PATH}" ]]; then
  SRC="${CODEX_AUTH_JSON_PATH}"
elif [[ -f "${SECRETS_DIR}/codex-auth.json" ]]; then
  SRC="${SECRETS_DIR}/codex-auth.json"
fi

mkdir -p "$(dirname "$DEST")"
chmod 700 "$(dirname "$DEST")" 2>/dev/null || true

if [[ -n "$SRC" ]]; then
  cp "$SRC" "$DEST"
elif [[ -n "${CODEX_AUTH_JSON:-}" ]]; then
  umask 077
  printf '%s' "$CODEX_AUTH_JSON" >"$DEST"
else
  if [[ -f "$DEST" ]]; then
    echo "sync-codex-auth: kept existing ~/.codex/auth.json"
    chmod 600 "$DEST"
    exit 0
  fi
  echo "sync-codex-auth: no secret (codex-auth.json / CODEX_AUTH_JSON). ChatGPT login missing." >&2
  exit 1
fi

chmod 600 "$DEST"
echo "sync-codex-auth: wrote ~/.codex/auth.json"
