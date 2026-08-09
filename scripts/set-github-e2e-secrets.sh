#!/usr/bin/env bash
# Clerk CLI で Development キーを取得し、GitHub Actions Secrets に登録する。
# Cloud Agent には Secrets 書き込み権限が無いため、人間のマシンで実行する。
set -euo pipefail

REPO="${REPO:-sinoda1114/gmail-kanban}"
INSTANCE="${INSTANCE:-dev}"
CLERK_ENV="${CLERK_ENV:-}"

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

if [[ -z "$CLERK_ENV" ]]; then
  if ! command -v clerk >/dev/null 2>&1; then
    echo "clerk CLI がありません。先に: npm i -g clerk" >&2
    exit 1
  fi
  CLERK_ENV="$(mktemp -t clerk-e2e-env.XXXXXX)"
  trap 'rm -f "$CLERK_ENV"' EXIT
  echo "Pulling Clerk ${INSTANCE} keys via CLI → temp env..."
  # 壊れた .env.local のキーを拾わないよう、pull 中は外す
  env -u CLERK_SECRET_KEY -u NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    clerk env pull --instance "$INSTANCE" --file "$CLERK_ENV" --mode agent
fi

if [[ ! -f "$CLERK_ENV" ]]; then
  echo "Clerk env が見つかりません: $CLERK_ENV" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
source "$CLERK_ENV"
set +a

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$(strip_quotes "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}")"
CLERK_SECRET_KEY="$(strip_quotes "${CLERK_SECRET_KEY:-}")"

if [[ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || -z "$CLERK_SECRET_KEY" ]]; then
  echo "pull 結果に NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY がありません。" >&2
  echo "先に: clerk auth login && cd ~/dev/gmail-kanban && clerk link" >&2
  exit 1
fi

case "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" in
  pk_test_*) ;;
  *)
    echo "Development キーが必要です（先頭: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:8}）。INSTANCE=dev で再実行してください。" >&2
    exit 1
    ;;
esac
case "$CLERK_SECRET_KEY" in
  sk_test_*) ;;
  *)
    echo "Development キーが必要です（先頭: ${CLERK_SECRET_KEY:0:8}）。INSTANCE=dev で再実行してください。" >&2
    exit 1
    ;;
esac

echo "PK=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:8}… len=${#NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}"
echo "SK=${CLERK_SECRET_KEY:0:8}… len=${#CLERK_SECRET_KEY}"

echo "Checking Clerk Testing Token API..."
HTTP_CODE="$(
  curl -sS -o /tmp/clerk-testing-token.json -w '%{http_code}' \
    -X POST 'https://api.clerk.com/v1/testing_tokens' \
    -H "Authorization: Bearer ${CLERK_SECRET_KEY}" \
    -H 'Content-Type: application/json'
)"
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Testing Token API が ${HTTP_CODE} を返しました。" >&2
  echo "clerk auth login → clerk link で正しいアプリ（Development）に繋いでから再実行してください。" >&2
  exit 1
fi
echo "Testing Token API: OK"

echo "Setting secrets on $REPO (values not printed)..."
printf '%s' "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY -R "$REPO"
printf '%s' "$CLERK_SECRET_KEY" | gh secret set CLERK_SECRET_KEY -R "$REPO"
echo "Done. Re-run the E2E workflow on the T-33 PR."
