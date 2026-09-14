#!/usr/bin/env bash
# PR conversation gate — branch protection「All comments must be resolved」対策
#
# Usage:
#   scripts/pr-conversation-gate.sh                 # 現在ブランチの PR を検査（未解決なら exit 1）
#   scripts/pr-conversation-gate.sh --pr 131
#   scripts/pr-conversation-gate.sh --resolve-safe  # outdated / 対応済み返信スレッドを Resolve
#   scripts/pr-conversation-gate.sh --resolve-all   # 未解決をすべて Resolve（マージ直前用）
#
# Exit codes: 0 = clean, 1 = unresolved remain / error
set -euo pipefail

MODE="check"
PR_NUMBER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --)
      shift
      ;;
    --pr)
      PR_NUMBER="${2:?}"
      shift 2
      ;;
    --resolve-safe)
      MODE="resolve-safe"
      shift
      ;;
    --resolve-all)
      MODE="resolve-all"
      shift
      ;;
    -h|--help)
      sed -n '2,12p' "$0"
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI required" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "jq required" >&2
  exit 1
fi

REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
OWNER=${REPO%%/*}
NAME=${REPO#*/}

if [[ -z "$PR_NUMBER" ]]; then
  PR_NUMBER=$(gh pr view --json number -q .number 2>/dev/null || true)
fi
if [[ -z "$PR_NUMBER" ]]; then
  echo "No PR for current branch. Pass --pr <N>." >&2
  exit 1
fi

QUERY='
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      url
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          comments(first: 20) {
            nodes {
              databaseId
              body
              author { login }
            }
          }
        }
      }
    }
  }
}'

fetch_threads() {
  gh api graphql \
    -f query="$QUERY" \
    -F owner="$OWNER" \
    -F name="$NAME" \
    -F number="$PR_NUMBER"
}

PAYLOAD=$(fetch_threads)
URL=$(echo "$PAYLOAD" | jq -r '.data.repository.pullRequest.url // empty')
if [[ -z "$URL" ]]; then
  echo "Failed to load PR #$PR_NUMBER" >&2
  echo "$PAYLOAD" | jq -r '.errors // .' >&2
  exit 1
fi

THREADS_JSON=$(echo "$PAYLOAD" | jq -c '
  [.data.repository.pullRequest.reviewThreads.nodes[]
    | select(.isResolved == false)
    | {
        id,
        outdated: .isOutdated,
        author: (.comments.nodes[0].author.login // ""),
        lastAuthor: (.comments.nodes[-1].author.login // ""),
        lastBody: (.comments.nodes[-1].body // ""),
        preview: ((.comments.nodes[0].body // "")[0:120])
      }
  ]
')

COUNT=$(echo "$THREADS_JSON" | jq 'length')
echo "PR #$PR_NUMBER ($URL)"
echo "Unresolved review threads: $COUNT"

if [[ "$COUNT" -eq 0 ]]; then
  echo "OK: conversations clean"
  exit 0
fi

echo "$THREADS_JSON" | jq -r '
  .[] | "- outdated=\(.outdated) author=\(.author) last=\(.lastAuthor) | \(.preview|gsub("\n";" "))"
'

is_safe_to_resolve() {
  local outdated="$1" last_author="$2" last_body="$3"
  if [[ "$outdated" == "true" ]]; then
    return 0
  fi
  # Agent / bot acknowledgement replies — the thread should be resolved.
  if echo "$last_author" | grep -Eiq '^(cursor|cursor\[bot\]|github-actions|github-actions\[bot\]|copilot-pull-request-reviewer|devin-ai-integration|amazon-q-developer)'; then
    if echo "$last_body" | grep -Eiq '対応済|resolved|fixed|addressed|done|lgtm|問題なし'; then
      return 0
    fi
  fi
  if echo "$last_body" | grep -Eiq '対応済|対応済み:|^Fixed:|^Resolved:|^Addressed:'; then
    return 0
  fi
  return 1
}

resolve_thread() {
  local tid="$1"
  gh api graphql \
    -f query='mutation($id:ID!){ resolveReviewThread(input:{threadId:$id}){ thread{ id isResolved } } }' \
    -f id="$tid" \
    --jq '.data.resolveReviewThread.thread.isResolved' >/dev/null
  echo "  resolved: $tid"
}

if [[ "$MODE" == "check" ]]; then
  echo "FAIL: unresolved conversations block merge. Re-run with --resolve-safe or --resolve-all after addressing them." >&2
  exit 1
fi

RESOLVED=0
SKIPPED=0
while IFS= read -r row; do
  [[ -z "$row" ]] && continue
  tid=$(echo "$row" | jq -r .id)
  outdated=$(echo "$row" | jq -r .outdated)
  last_author=$(echo "$row" | jq -r .lastAuthor)
  last_body=$(echo "$row" | jq -r .lastBody)
  if [[ "$MODE" == "resolve-all" ]] || is_safe_to_resolve "$outdated" "$last_author" "$last_body"; then
    resolve_thread "$tid"
    RESOLVED=$((RESOLVED + 1))
  else
    echo "  skip (needs judgment): $tid ($last_author)"
    SKIPPED=$((SKIPPED + 1))
  fi
done < <(echo "$THREADS_JSON" | jq -c '.[]')

echo "Resolved=$RESOLVED skipped=$SKIPPED"

REMAINING=$(fetch_threads | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved==false)] | length')

if [[ "$REMAINING" -gt 0 ]]; then
  echo "FAIL: $REMAINING unresolved thread(s) remain" >&2
  exit 1
fi

echo "OK: conversations clean"
exit 0
