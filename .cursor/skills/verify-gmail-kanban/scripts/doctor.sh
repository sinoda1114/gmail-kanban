#!/usr/bin/env bash
set -euo pipefail

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
if [[ "${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-}" == pk_* ]] || [[ "${CLERK_PUBLISHABLE_KEY:-}" == pk_* ]]; then
  echo "doctor: Clerk publishable key present"
else
  echo "doctor: FAIL Clerk publishable key missing (pk_...)" >&2
  fail=1
fi

if [[ "${CLERK_SECRET_KEY:-}" == sk_* ]]; then
  echo "doctor: Clerk secret key present"
else
  echo "doctor: FAIL Clerk secret key missing (sk_...)" >&2
  fail=1
fi

user_json="${E2E_USER_JSON_PATH:-$HOME/.config/gmail-kanban-secrets/e2e-user.json}"
if [[ -n "${E2E_CLERK_USER_EMAIL:-}" ]]; then
  echo "doctor: E2E user email from env"
elif [[ -f "$user_json" ]]; then
  echo "doctor: E2E user json present"
else
  echo "doctor: WARN authenticated paths will skip (no E2E user)"
fi

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi

echo "doctor: ok $base"
