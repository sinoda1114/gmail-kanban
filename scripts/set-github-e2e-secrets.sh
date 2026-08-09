#!/usr/bin/env bash
# GitHub Actions に Clerk E2E 用 Secrets を登録する（ローカル / 番人用）。
# Cloud Agent には Secrets 書き込み権限が無いため、このスクリプトは人間側で実行する。
set -euo pipefail

REPO="${REPO:-sinoda1114/gmail-kanban}"
CLERK_ENV="${CLERK_ENV:-$HOME/.config/gmail-kanban-secrets/.env.clerk}"

if [[ ! -f "$CLERK_ENV" ]]; then
  echo "Clerk env が見つかりません: $CLERK_ENV" >&2
  echo "CLERK_ENV=/path/to/.env.clerk で指定するか、ファイルを置いてください。" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$CLERK_ENV"
set +a

if [[ -z "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" || -z "${CLERK_SECRET_KEY:-}" ]]; then
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY が $CLERK_ENV にありません。" >&2
  exit 1
fi

case "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" in pk_*) ;; *)
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY が pk_ で始まっていません" >&2
  exit 1
  ;;
esac
case "$CLERK_SECRET_KEY" in sk_*) ;; *)
  echo "CLERK_SECRET_KEY が sk_ で始まっていません" >&2
  exit 1
  ;;
esac

echo "Setting secrets on $REPO (values not printed)..."
printf '%s' "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY -R "$REPO"
printf '%s' "$CLERK_SECRET_KEY" | gh secret set CLERK_SECRET_KEY -R "$REPO"
echo "Done. Re-run the E2E workflow on the T-33 PR."
