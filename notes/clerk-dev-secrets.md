# Clerk Development キーの同期（冪等）

## 正本

**Clerk CLI の Development instance だけが正本。**  
手元の `.env.local` や古いメモを正本にしてはいけない。

アプリ指定は公開の Application ID（秘密ではない）:

- 環境変数 `CLERK_APP`（最優先）
- リポ内 `scripts/clerk-app.id`
- スクリプト内蔵フォールバック

## 同期コマンド

前提: `clerk auth login`（`clerk link` は不要）。

```bash
cd ~/dev/gmail-kanban
./scripts/sync-clerk-dev-secrets.sh
```

ローカル `main` が古いときの回避策（このリポの raw のみ。信頼できる場合）:

```bash
cd ~/dev/gmail-kanban
curl -fsSL https://raw.githubusercontent.com/sinoda1114/gmail-kanban/main/scripts/sync-clerk-dev-secrets.sh -o /tmp/sync-clerk-dev-secrets.sh
# 必要なら commit SHA で pin: .../main → .../<sha>/
chmod +x /tmp/sync-clerk-dev-secrets.sh
/tmp/sync-clerk-dev-secrets.sh
```

毎回 `clerk env pull --app <id> --instance dev` してから次へ**上書き**する（値が同じならローカルはスキップ、GitHub Actions は読めないので毎回 set）。

| ターゲット | パス / 場所 |
|---|---|
| Cloud / 共有 | `~/.config/gmail-kanban-secrets/.env.clerk` |
| ローカルアプリ | リポの `.env.local`（`package.json` name と origin で gmail-kanban か検証） |
| CI E2E | GitHub Actions Secrets |

指紋は `~/.config/gmail-kanban-secrets/.clerk-dev.fingerprint`（キー本体は置かない）。

## いつ回すか

- 初回セットアップ
- Clerk のキーをローテ / 再発行した直後
- E2E が `Unauthorized` になったとき
- 別マシンで Cloud Agent / ローカルを使い始めるとき

## 禁止

- 別環境の古い `.env.local` をコピーして Actions に載せる
- `CLERK_ENV=/path/to/stale.env` で登録する
- 「前回セットしたから大丈夫」で放置する

## 関連

- `notes/testing-discipline.md`
- `.github/workflows/e2e.yml`
- 互換: `scripts/set-github-e2e-secrets.sh` → 本スクリプトへ委譲
