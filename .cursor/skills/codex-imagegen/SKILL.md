---
name: codex-imagegen
description: Generate a PNG with Codex CLI built-in image_gen (ChatGPT subscription, no OPENAI_API_KEY). Use when the user wants an image from Cloud Agent or the repo scripts.
---

# Codex 組み込み画像生成

ChatGPT サブスク枠の Codex CLI `image_gen` を使う。Images API と `OPENAI_API_KEY` は使わない。

## 前提

```bash
./scripts/bootstrap-codex-cli.sh
```

`codex login status` が `Logged in using ChatGPT` であること。失敗したら `notes/codex-cloud-imagegen.md`。資格情報の中身は出さない。

## 生成

```bash
./scripts/codex-imagegen.sh "<日本語または英語の絵の指定>" /opt/cursor/artifacts/<name>.png
```

または同等の `codex exec`（`--skip-git-repo-check`、`Do not use the CLI fallback`、`RESULT_PATH=`）。

## 禁止

- `scripts/image_gen.py` や Images API
- ユーザーに API キーを要求する
- `auth.json` やトークンをログ / PR / チャットに出す
- 連続で大量生成する（1 枚でトークン約 2 万）
