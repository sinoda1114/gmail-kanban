# ci-standard: Clerk Secrets → e2e マップ（適用手順）

> **ブロッカー解消用**。[ci-standard#2](https://github.com/sinoda1114/ci-standard/issues/2)  
> Cloud Agent は `ci-standard` へ push できないため、番人／ローカルで適用する。

## 前提

- gmail-kanban 側の Actions Secrets（`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY`）は登録済み
- パッチ対象は `sinoda1114/ci-standard` の `@main`（取得時点の `node-ci.yml` / `templates/node-caller.yml`）

## 適用（ローカル）

```bash
cd ~/dev/ci-standard   # または clone
git checkout main && git pull
git checkout -b feat/node-ci-clerk-optional-secrets

git apply ~/dev/gmail-kanban/notes/patches/ci-standard-node-ci-clerk-secrets.patch
git apply ~/dev/gmail-kanban/notes/patches/ci-standard-node-caller-clerk-secrets.patch

# README の設計 4 と templates コメントのドリフトがあれば合わせて直す
# （secrets: inherit ではなく明示マップ、と書く）

git add .github/workflows/node-ci.yml templates/node-caller.yml README.md
git commit -m "feat(node-ci): e2e へ optional Clerk Secrets をマップする"
git push -u origin HEAD
# PR を main へマージ
```

パッチが当たない場合は Issue 本文の YAML 断片を手で入れる（同じ内容）。

## マージ後（gmail-kanban）

1. `cursor/t33-standard-e2e-50d8`（本リポの準備ブランチ）を main にマージ
2. PR で `ci / e2e` が実走して緑になることを確認
3. 固有 `.github/workflows/e2e.yml` は退役済みになる
4. [ci-standard#2](https://github.com/sinoda1114/ci-standard/issues/2) と T-33 / #73 を Close

## パッチファイル

| ファイル | 対象 |
|---|---|
| `ci-standard-node-ci-clerk-secrets.patch` | `.github/workflows/node-ci.yml` |
| `ci-standard-node-caller-clerk-secrets.patch` | `templates/node-caller.yml` |
