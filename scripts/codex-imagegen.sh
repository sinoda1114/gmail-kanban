#!/usr/bin/env bash
# Codex 組み込み image_gen で 1 枚生成する。OPENAI_API_KEY は使わない。
set -euo pipefail

export PATH="${HOME}/.local/bin:${PATH}"

if [[ $# -lt 1 ]]; then
  echo "usage: $0 <prompt> [outfile.png]" >&2
  exit 2
fi

PROMPT="$1"
OUT="${2:-./image-$(date +%s).png}"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex が無い。先に ./scripts/bootstrap-codex-cli.sh" >&2
  exit 1
fi

if ! codex login status 2>/dev/null | grep -q 'Logged in using ChatGPT'; then
  echo "ChatGPT 未ログイン。secrets の codex-auth.json を置くか、codex login --device-auth" >&2
  exit 1
fi

WORKDIR="$(mktemp -d "${TMPDIR:-/tmp}/codex-imagegen.XXXXXX")"
cleanup() { rm -rf "$WORKDIR"; }
trap cleanup EXIT

LOG="${WORKDIR}/exec.log"
set +e
codex exec -c model_reasoning_effort="low" --skip-git-repo-check --sandbox danger-full-access \
  "Use the built-in image_gen tool to generate ONE image. Do not use the CLI fallback and do not ask for an API key. Spec: ${PROMPT}. After generating, print the absolute file path of the saved PNG on its own line prefixed with RESULT_PATH=" \
  >"$LOG" 2>&1
STATUS=$?
set -e

SRC="$(grep -m1 '^RESULT_PATH=' "$LOG" | cut -d= -f2- || true)"
if [[ "$STATUS" -ne 0 || -z "$SRC" || ! -f "$SRC" ]]; then
  echo "generation failed" >&2
  grep -E 'ERROR:|RESULT_PATH=|tokens used' "$LOG" >&2 || tail -20 "$LOG" >&2
  exit 1
fi

mkdir -p "$(dirname "$OUT")"
cp "$SRC" "$OUT"
echo "$OUT"
