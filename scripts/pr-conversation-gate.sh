#!/usr/bin/env bash
# PR conversation gate — branch protection「All comments must be resolved」対策
#
# Usage:
#   scripts/pr-conversation-gate.sh                 # 現在ブランチの PR を検査（未解決なら exit 1）
#   scripts/pr-conversation-gate.sh --pr 131
#   scripts/pr-conversation-gate.sh --resolve-safe  # outdated / 対応済み「返信あり」だけ Resolve
#   scripts/pr-conversation-gate.sh --resolve-all   # 未解決をすべて Resolve（対応後のマージ直前用）
#
# Exit: 0 = clean, 1 = unresolved remain / error
set -euo pipefail

MODE="check"
PR_NUMBER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --) shift ;;
    --pr) PR_NUMBER="${2:?}"; shift 2 ;;
    --resolve-safe) MODE="resolve-safe"; shift ;;
    --resolve-all) MODE="resolve-all"; shift ;;
    -h|--help) sed -n '2,12p' "$0"; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

command -v gh >/dev/null || { echo "gh CLI required" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq required" >&2; exit 1; }

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

FIRST_QUERY='
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      url
      reviewThreads(first:100) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          comments(first:100) {
            pageInfo { hasNextPage endCursor }
            nodes { body author { login } }
          }
        }
      }
    }
  }
}'

NEXT_QUERY='
query($owner:String!, $name:String!, $number:Int!, $cursor:String!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      url
      reviewThreads(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          isOutdated
          comments(first:100) {
            pageInfo { hasNextPage endCursor }
            nodes { body author { login } }
          }
        }
      }
    }
  }
}'

COMMENT_QUERY='
query($id:ID!, $cursor:String!) {
  node(id:$id) {
    ... on PullRequestReviewThread {
      comments(first:100, after:$cursor) {
        pageInfo { hasNextPage endCursor }
        nodes { body author { login } }
      }
    }
  }
}'

complete_comments() {
  local node="$1"
  local tid c_has c_cursor comments
  tid=$(echo "$node" | jq -r .id)
  c_has=$(echo "$node" | jq -r '.comments.pageInfo.hasNextPage')
  c_cursor=$(echo "$node" | jq -r '.comments.pageInfo.endCursor // empty')
  comments=$(echo "$node" | jq -c '.comments.nodes')
  while [[ "$c_has" == "true" ]]; do
    local cpage more
    cpage=$(gh api graphql -f query="$COMMENT_QUERY" -f id="$tid" -f cursor="$c_cursor")
    more=$(echo "$cpage" | jq -c '.data.node.comments.nodes // []')
    comments=$(jq -c -n --argjson a "$comments" --argjson b "$more" '$a + $b')
    c_has=$(echo "$cpage" | jq -r '.data.node.comments.pageInfo.hasNextPage')
    c_cursor=$(echo "$cpage" | jq -r '.data.node.comments.pageInfo.endCursor // empty')
  done
  jq -c -n --argjson n "$node" --argjson comments "$comments" \
    '$n | .comments = {nodes:$comments}'
}

fetch_all_threads() {
  local has_next="true" cursor="" page_json first=1 all='[]'
  while [[ "$has_next" == "true" ]]; do
    if [[ "$first" -eq 1 ]]; then
      page_json=$(gh api graphql \
        -f query="$FIRST_QUERY" \
        -F owner="$OWNER" \
        -F name="$NAME" \
        -F number="$PR_NUMBER")
      first=0
    else
      page_json=$(gh api graphql \
        -f query="$NEXT_QUERY" \
        -F owner="$OWNER" \
        -F name="$NAME" \
        -F number="$PR_NUMBER" \
        -f cursor="$cursor")
    fi

    local url
    url=$(echo "$page_json" | jq -r '.data.repository.pullRequest.url // empty')
    if [[ -z "$url" ]]; then
      echo "Failed to load PR #$PR_NUMBER" >&2
      echo "$page_json" | jq -c '.errors // .' >&2
      return 1
    fi
    printf '%s' "$url" >"$URL_FILE"

    local nodes enriched='[]' node completed
    nodes=$(echo "$page_json" | jq -c '.data.repository.pullRequest.reviewThreads.nodes // []')
    while IFS= read -r node; do
      [[ -z "$node" ]] && continue
      completed=$(complete_comments "$node")
      enriched=$(jq -c -n --argjson a "$enriched" --argjson b "$completed" '$a + [$b]')
    done < <(echo "$nodes" | jq -c '.[]')

    all=$(jq -c -n --argjson a "$all" --argjson b "$enriched" '$a + $b')
    has_next=$(echo "$page_json" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.hasNextPage')
    cursor=$(echo "$page_json" | jq -r '.data.repository.pullRequest.reviewThreads.pageInfo.endCursor // empty')
  done
  printf '%s\n' "$all"
}

URL_FILE=$(mktemp)
trap 'rm -f "$URL_FILE"' EXIT

ALL_NODES=$(fetch_all_threads)
URL=$(cat "$URL_FILE")

THREADS_JSON=$(echo "$ALL_NODES" | jq -c '
  [.[]
    | select(.isResolved == false)
    | {
        id,
        outdated: .isOutdated,
        commentCount: (.comments.nodes | length),
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
  .[] | "- outdated=\(.outdated) comments=\(.commentCount) author=\(.author) last=\(.lastAuthor) | \(.preview|gsub("\n";" "))"
'

is_affirmative_ack() {
  local body="$1"
  if echo "$body" | grep -Eiq \
    '対応済(み)?では(ありません|ない)|対応済(み)?とは言え|not (fixed|resolved|addressed)|unresolved|未対応|まだ直|still (open|broken)|ではなく'; then
    return 1
  fi
  if echo "$body" | grep -Eiq \
    '(^|\n)\s*(対応済|対応済み|Fixed:|Resolved:|Addressed:|Done\.|LGTM)|対応済み[:：]|これで対応|修正(しました|済み)|直しました'; then
    return 0
  fi
  return 1
}

is_safe_to_resolve() {
  local outdated="$1" comment_count="$2" last_body="$3"
  if [[ "$outdated" == "true" ]]; then
    return 0
  fi
  # Never auto-resolve unreplied single comments (bots often include "fixed" in findings).
  if [[ "$comment_count" -lt 2 ]]; then
    return 1
  fi
  is_affirmative_ack "$last_body"
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
  comment_count=$(echo "$row" | jq -r .commentCount)
  last_body=$(echo "$row" | jq -r .lastBody)
  last_author=$(echo "$row" | jq -r .lastAuthor)
  if [[ "$MODE" == "resolve-all" ]] || is_safe_to_resolve "$outdated" "$comment_count" "$last_body"; then
    resolve_thread "$tid"
    RESOLVED=$((RESOLVED + 1))
  else
    echo "  skip (needs judgment): $tid ($last_author, comments=$comment_count)"
    SKIPPED=$((SKIPPED + 1))
  fi
done < <(echo "$THREADS_JSON" | jq -c '.[]')

echo "Resolved=$RESOLVED skipped=$SKIPPED"

ALL_NODES=$(fetch_all_threads)
REMAINING=$(echo "$ALL_NODES" | jq '[.[] | select(.isResolved==false)] | length')
if [[ "$REMAINING" -gt 0 ]]; then
  echo "FAIL: $REMAINING unresolved thread(s) remain" >&2
  exit 1
fi

echo "OK: conversations clean"
exit 0
