#!/usr/bin/env bash
# GitHub Actions に Clerk E2E 用 Secrets を登録する（ローカル / 番人用）。
# Cloud Agent には Secrets 書き込み権限が無いため、このスクリプトは人間側で実行する。
set -euo pipefail

REPO="${REPO:-sinoda1114/gmail-kanban}"
CLERK_ENV="${CLERK_ENV:-$HOME/.config/gmail-kanban-secrets/.env.clerk}"

strip_quotes() {
  local v="$1"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  if [[ "${#v}" -ge 2 ]]; then
    if [[ "${v:0:1}" == '"' && "${v: -1}" == '"' ]]; then
      v="${v:1:${#v}-2}"
    elif [[ "${v:0:1}" == "'" && "${v: -1}" == "'" ]]; then
      v="${v:1:${#v}-2}"
    fi
  fi
  printf '%s' "$v"
}

if [[ ! -f "$CLERK_ENV" ]]; then
  echo "Clerk env が見つかりません: $CLERK_ENV" >&2
  echo "CLERK_ENV=/path/to/.env.local で指定するか、ファイルを置いてください。" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$CLERK_ENV"
set +a

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$(strip_quotes "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}")"
CLERK_SECRET_KEY="$(strip_quotes "${CLERK_SECRET_KEY:-}")"

if [[ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || -z "$CLERK_SECRET_KEY" ]]; then
  echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY が $CLERK_ENV にありません。" >&2
  exit 1
fi

case "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" in
  pk_test_*) ;;
  pk_live_*)
    echo "E2E には Development インスタンスのキー（pk_test_ / sk_test_）が必要です。今は pk_live_ です。" >&2
    exit 1
    ;;
  *)
    echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY が pk_test_ で始まっていません（先頭: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:8}）" >&2
    exit 1
    ;;
esac
case "$CLERK_SECRET_KEY" in
  sk_test_*) ;;
  sk_live_*)
    echo "E2E には Development インスタンスのキー（pk_test_ / sk_test_）が必要です。今は sk_live_ です。" >&2
    exit 1
    ;;
  *)
    echo "CLERK_SECRET_KEY が sk_test_ で始まっていません（先頭: ${CLERK_SECRET_KEY:0:8}）" >&2
    exit 1
    ;;
esac

echo "Checking Clerk Testing Token API (dev instance)..."
HTTP_CODE="$(
  curl -sS -o /tmp/clerk-testing-token.json -w '%{http_code}' \
    -X POST 'https://api.clerk.com/v1/testing_tokens' \
    -H "Authorization: Bearer ${CLERK_SECRET_KEY}" \
    -H 'Content-Type: application/json'
)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Testing Token API が ${HTTP_CODE} を返しました。キーが無効か、Development 用ではありません。" >&2
  echo "Clerk Dashboard → Development → API Keys の pk_test_ / sk_test_ を .env.local に入れて再実行してください。" >&2
  exit 1
fi
echo "Testing Token API: OK"

echo "Setting secrets on $REPO (values not printed)..."
printf '%s' "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY -R "$REPO"
printf '%s' "$CLERK_SECRET_KEY" | gh secret set CLERK_SECRET_KEY -R "$REPO"
echo "Done. Re-run the E2E workflow on the T-33 PR."
