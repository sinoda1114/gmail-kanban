# Clerk Development キーの同期（冪等）

## 正本

**Clerk CLI の linked app / Development instance だけが正本。**  
手元の `.env.local` や古いメモを正本にしてはいけない。

## 同期コマンド

番人マシン（`clerk auth login` 済み。`/tmp` からでも可）:

```bash
# リポ内
./scripts/sync-clerk-dev-secrets.sh

# または main から直接
curl -fsSL https://raw.githubusercontent.com/sinoda1114/gmail-kanban/main/scripts/sync-clerk-dev-secrets.sh -o /tmp/sync-clerk-dev-secrets.sh
chmod +x /tmp/sync-clerk-dev-secrets.sh
# ~/dev/gmail-kanban にいること（.env.local 更新先）
cd ~/dev/gmail-kanban && /tmp/sync-clerk-dev-secrets.sh
```

毎回 `clerk env pull --app <gmail-kanban> --instance dev` してから、次へ**上書き**する（値が同じならローカルはスキップ、GitHub Actions は読めないので毎回 set）。

| ターゲット | パス / 場所 |
|---|---|
| Cloud / 共有 | `~/.config/gmail-kanban-secrets/.env.clerk` |
| ローカルアプリ | リポの `.env.local` |
| CI E2E | GitHub Actions Secrets `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` |

指紋は `~/.config/gmail-kanban-secrets/.clerk-dev.fingerprint`（キー本体は置かない）。

## いつ回すか

- 初回セットアップ
- Clerk のキーをローテ / 再発行した直後
- E2E が `Unauthorized` になったとき
- 別マシンで Cloud Agent / ローカルを使い始めるとき

## 禁止

- 別環境の古い `.env.local` をコピーして Actions に載せる
- `CLERK_ENV=/path/to/stale.env` で登録する（ラッパは拒否する）
- 「前回セットしたから大丈夫」で fingerprint も見ずに放置する

## 関連

- `notes/testing-discipline.md`
- `.github/workflows/e2e.yml`
- 互換: `scripts/set-github-e2e-secrets.sh` → 本スクリプトへ委譲
