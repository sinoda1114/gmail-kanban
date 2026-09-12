#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "$0")/../../../.." && pwd)"

load_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  set -a
  # shellcheck disable=SC1090
  source "$f"
  set +a
}

load_env "$HOME/.config/gmail-kanban-secrets/load.sh"
load_env "$root/.env.local"

base="${VERIFY_BASE_URL:-http://localhost:3000}"
health_url="${base%/}/api/health"

echo "doctor: GET $health_url"
body="$(curl -fsS --max-time 5 "$health_url")"
echo "doctor: body=$body"
if ! grep -q '"ok":true' <<<"$body"; then
  echo "doctor: FAIL health payload is not {\"ok\":true}" >&2
  exit 1
fi

fail=0
pk="${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-${CLERK_PUBLISHABLE_KEY:-}}"
if [[ "$pk" == pk_test_* ]]; then
  echo "doctor: Clerk publishable key present"
elif [[ "$pk" == pk_* ]]; then
  echo "doctor: FAIL Clerk publishable key must be pk_test_ (not live)" >&2
  fail=1
else
  echo "doctor: FAIL Clerk publishable key missing (pk_test_...)" >&2
  fail=1
fi

if [[ "${CLERK_SECRET_KEY:-}" == sk_test_* ]]; then
  echo "doctor: Clerk secret key present"
elif [[ "${CLERK_SECRET_KEY:-}" == sk_* ]]; then
  echo "doctor: FAIL Clerk secret key must be sk_test_ (not live)" >&2
  fail=1
else
  echo "doctor: FAIL Clerk secret key missing (sk_test_...)" >&2
  fail=1
fi

user_json="${E2E_USER_JSON_PATH:-$HOME/.config/gmail-kanban-secrets/e2e-user.json}"
if [[ -n "${E2E_CLERK_USER_EMAIL:-}" ]]; then
  echo "doctor: E2E user email from env"
elif [[ -f "$user_json" ]] && python3 - "$user_json" <<'PY'
import json, sys
try:
    data = json.load(open(sys.argv[1], encoding="utf-8"))
except Exception:
    sys.exit(1)
email = data.get("email") if isinstance(data, dict) else None
sys.exit(0 if isinstance(email, str) and email.strip() else 1)
PY
then
  echo "doctor: E2E user json has email"
else
  echo "doctor: WARN authenticated paths will skip (no E2E user email)"
fi

if [[ "${TURSO_DATABASE_URL:-}" == file:* ]]; then
  if ! python3 - "$TURSO_DATABASE_URL" <<'PY'
import sqlite3, sys
url = sys.argv[1]
path = url[5:]
try:
    con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    names = {row[0] for row in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
except Exception:
    sys.exit(2)
sys.exit(0 if "users" in names else 1)
PY
  then
    echo "doctor: FAIL file DB has no users table. Run: pnpm exec drizzle-kit push" >&2
    fail=1
  else
    echo "doctor: file DB schema present"
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "doctor: ok $base"
