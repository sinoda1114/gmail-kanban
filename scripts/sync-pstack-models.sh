#!/usr/bin/env bash
set -euo pipefail

# Copy the repo's pstack model map to the path pstack skills actually read.
root="$(cd "$(dirname "$0")/.." && pwd)"
src="$root/.cursor/rules/pstack-models.mdc"
dest="$HOME/.cursor/rules/pstack-models.mdc"

if [[ ! -f "$src" ]]; then
  echo "sync-pstack-models: missing $src" >&2
  exit 1
fi

mkdir -p "$(dirname "$dest")"
if [[ ! -d "$(dirname "$dest")" ]]; then
  echo "sync-pstack-models: failed to create $(dirname "$dest")" >&2
  exit 1
fi
cp "$src" "$dest"
echo "sync-pstack-models: wrote $dest"
