#!/usr/bin/env bash
# 互換ラッパ。正本は sync-clerk-dev-secrets.sh（Clerk CLI → 全環境へ冪等同期）。
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# 古い CLERK_ENV=ファイル 指定は拒否（ドリフトの温床）
if [[ -n "${CLERK_ENV:-}" ]]; then
  echo "CLERK_ENV は廃止しました。Clerk CLI が正本です。" >&2
  echo "そのまま実行: ${ROOT}/scripts/sync-clerk-dev-secrets.sh" >&2
  exit 1
fi
exec "${ROOT}/scripts/sync-clerk-dev-secrets.sh" "$@"
