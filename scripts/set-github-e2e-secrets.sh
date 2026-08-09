#!/usr/bin/env bash
# Clerk CLI で Development キーを取得し、GitHub Actions Secrets に登録する。
# Cloud Agent には Secrets 書き込み権限が無いため、人間のマシンで実行する。
set -euo pipefail

REPO="${REPO:-sinoda1114/gmail-kanban}"
INSTANCE="${INSTANCE:-dev}"
CLERK_ENV="${CLERK_ENV:-}"
USED_CLERK_PULL=0

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

# source せず KEY=VALUE 行だけ読む（任意コード実行を避ける）
read_env_key() {
  local file="$1" key="$2" line raw
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n 1 || true)"
  [[ -n "$line" ]] || return 0
  raw="${line#*=}"
  strip_quotes "$raw"
}

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI がありません。https://cli.github.com/ から入れてください。" >&2
  exit 1
fi
if ! command -v curl >/dev/null 2>&1; then
  echo "curl がありません。" >&2
  exit 1
fi

if [[ -z "$CLERK_ENV" ]]; then
  if ! command -v clerk >/dev/null 2>&1; then
    echo "clerk CLI がありません。先に: npm i -g clerk" >&2
    exit 1
  fi
  CLERK_ENV="$(mktemp -t clerk-e2e-env.XXXXXX)"
  trap 'rm -f "$CLERK_ENV"' EXIT
  USED_CLERK_PULL=1
  echo "Pulling Clerk ${INSTANCE} keys via CLI → temp env..."
  env -u CLERK_SECRET_KEY -u NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    clerk env pull --instance "$INSTANCE" --file "$CLERK_ENV" --mode agent
fi

if [[ ! -f "$CLERK_ENV" ]]; then
  echo "Clerk env が見つかりません: $CLERK_ENV" >&2
  exit 1
fi

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$(read_env_key "$CLERK_ENV" NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)"
CLERK_SECRET_KEY="$(read_env_key "$CLERK_ENV" CLERK_SECRET_KEY)"

if [[ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" || -z "$CLERK_SECRET_KEY" ]]; then
  echo "$CLERK_ENV に NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY がありません。" >&2
  if [[ "$USED_CLERK_PULL" -eq 1 ]]; then
    echo "先に: clerk auth login && cd ~/dev/gmail-kanban && clerk link" >&2
  fi
  exit 1
fi

case "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" in
  pk_test_*) ;;
  *)
    echo "Development キーが必要です（先頭: ${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:0:8}）。" >&2
    if [[ "$USED_CLERK_PULL" -eq 1 ]]; then
      echo "INSTANCE=dev で再実行するか、clerk link 先のアプリを確認してください。" >&2
    else
      echo "CLERK_ENV に pk_test_ / sk_test_ を入れてください。" >&2
    fi
    exit 1
    ;;
esac
case "$CLERK_SECRET_KEY" in
  sk_test_*) ;;
  *)
    echo "Development キーが必要です（先頭: ${CLERK_SECRET_KEY:0:8}）。" >&2
    if [[ "$USED_CLERK_PULL" -eq 1 ]]; then
      echo "INSTANCE=dev で再実行するか、clerk link 先のアプリを確認してください。" >&2
    else
      echo "CLERK_ENV に pk_test_ / sk_test_ を入れてください。" >&2
    fi
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
  if [[ "$USED_CLERK_PULL" -eq 1 ]]; then
    echo "clerk auth login → clerk link で正しいアプリ（Development）に繋いでから再実行してください。" >&2
  else
    echo "CLERK_ENV のキーが無効です。Clerk CLI で pull し直すか、有効な sk_test_ を入れてください。" >&2
  fi
  exit 1
fi
echo "Testing Token API: OK"

echo "Setting secrets on $REPO (values not printed)..."
printf '%s' "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" | gh secret set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY -R "$REPO"
printf '%s' "$CLERK_SECRET_KEY" | gh secret set CLERK_SECRET_KEY -R "$REPO"
echo "Done. Re-run the E2E workflow on the T-33 PR."
