# Cloud Agent で Codex CLI の画像生成（ChatGPT サブスク枠）

Cursor Cloud Agent から、OpenAI Images API ではなく Codex 組み込み `image_gen` を使う。
`OPENAI_API_KEY` は不要。消費は ChatGPT / Codex のサブスク枠。

## 箱（2）

毎回の Cloud Agent で次を揃える。

1. Codex CLI（`scripts/bootstrap-codex-cli.sh`）
2. ChatGPT ログイン済みの `~/.codex/auth.json`（Git に置かない）

資格情報の正本は次のどれか。

| 置き場 | 使い方 |
|---|---|
| `~/.config/gmail-kanban-secrets/codex-auth.json` | 手元や Cloud の secrets ディレクトリにファイルを置く |
| `CODEX_AUTH_JSON` | Cursor 環境シークレットに JSON 全文を入れる（ログに出さない） |

この VM で一度 `codex login --device-auth` したあと、ホームの `~/.codex/auth.json` を上記へコピーする。中身はトークンなのでチャットに貼らない。

```bash
./scripts/bootstrap-codex-cli.sh
```

成功時は `Logged in using ChatGPT` だけ確認する。`auth.json` は cat しない。

トークンが死んだら ChatGPT 設定 → セキュリティでデバイスコード認証を ON のまま、`codex login --device-auth` をやり直して secrets を更新する。

## 使い方（3）

スキル `.cursor/skills/codex-imagegen/`。ラッパー:

```bash
./scripts/codex-imagegen.sh "赤いリンゴ、白背景、フラットなイラスト" /tmp/apple.png
```

エージェントは Cursor の GenerateImage や Images API に落とさない。`Do not use the CLI fallback` を付ける。

1 枚あたりトークンは 2 万前後。ループしない。
