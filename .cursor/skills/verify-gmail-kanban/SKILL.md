---
name: verify-gmail-kanban
description: Drive Gmail Kanban the way a user does (Next.js web UI on localhost). Use when proving a UI or auth change, walking sign-in / dashboard / 案件登録 / 要対応 / 設定, or capturing evidence that the running app actually changed.
---

# verify-gmail-kanban

Gmail Kanban は Clerk 付きの Next.js Web UI。ユーザーが触るのはブラウザだけ。証明は Playwright（既存 `e2e/`）を第一選択にし、Playwright がまだ無い経路は同じセレクタでブラウザを直接操作する。内部 setter やテスト専用エンドポイントで「動いた」ことにしない。`/api/health` は起動確認専用。

コマンド・回帰対象の正本は `notes/testing-discipline.md`。このスキルは「ユーザー経路をどう踏むか」だけを持つ。

## Launch

Cloud では先に `source /home/ubuntu/.config/gmail-kanban-secrets/load.sh`。ローカルは既存の `.env.local` を使う（エージェントは編集しない・中身を出さない）。`doctor.sh` は `load.sh` とリポの `.env.local` を値を出さずに読む。Turso クラウド鍵が無いときは `TURSO_DATABASE_URL=file:/workspace/local.db` と `pnpm exec drizzle-kit push`。空の file DB のまま認証後ページを開くと `no such table: users` で RSC が落ちる。push したあと、起動中の `next start` は一度止めて入れ直す。

ポート:

| 用途 | URL | 起動 |
|---|---|---|
| 対話 / ブラウザ証明 | `http://localhost:3000` | `pnpm dev` |
| 隔離 E2E | `http://localhost:3005` | `pnpm test:e2e`（先に `pnpm build` する） |

ホストは **`localhost`**。`127.0.0.1` だと Clerk rewrite が 500 になりやすい。

`pnpm dev` が 3000 で動いているときは **本番ビルドも `.next` 削除もしない**。その場合は隔離 E2E を使わず、`VERIFY_BASE_URL=http://localhost:3000` で doctor し、Playwright は `E2E_BASE_URL=http://localhost:3000` を付けて既存サーバを再利用する。

隔離起動（dev が居ないとき）:

```bash
source /home/ubuntu/.config/gmail-kanban-secrets/load.sh
export VERIFY_BASE_URL=http://localhost:3005
export E2E_BASE_URL=http://localhost:3005
pnpm test:e2e -- e2e/smoke.spec.ts
```

`pnpm test:e2e` は build → `next start --hostname localhost --port 3005`。準備完了は `GET /api/health` が `{"ok":true}`。Playwright の `webServer` がプロセスを持つ。CI 以外では `reuseExistingServer` が付き、すでに `:3005` で動いているサーバを再利用する。古い `next start` が残っていると doctor は通ってもビルドが古い。その PID だけ止めて入れ直す。こちらから `pkill` しない。このスキルが自分で `next start` した場合だけ、その PID を止める。

対話起動:

```bash
source /home/ubuntu/.config/gmail-kanban-secrets/load.sh
pnpm dev
```

準備完了は同じ `GET http://localhost:3000/api/health`。止めるときはこの `pnpm dev` の PID だけ。

## Doctor

起動したインスタンスに対して、読むだけ:

```bash
source /home/ubuntu/.config/gmail-kanban-secrets/load.sh
VERIFY_BASE_URL=http://localhost:3000 .cursor/skills/verify-gmail-kanban/scripts/doctor.sh
```

隔離 E2E なら `VERIFY_BASE_URL=http://localhost:3005`。成功条件:

- `GET {base}/api/health` が `{"ok":true}`
- Clerk publishable key が `pk_test_` で始まる（値は出さない。live の `pk_` は FAIL）
- `CLERK_SECRET_KEY` が `sk_test_` で始まる（値は出さない。live の `sk_` は FAIL）
- `TURSO_DATABASE_URL` が `file:` なら `users` テーブルがある（無ければ FAIL。`pnpm exec drizzle-kit push`）

認証後パスを踏むなら、`E2E_CLERK_USER_EMAIL` か `e2e-user.json` の `email` があること。ファイルがあるだけでは足りない。無いときはそのパスを skip し、未ログイン経路だけ証明する。

Doctor はシェルの preflight だ。対象プロセスの中身は見ない。読む env は `load.sh` と `.env.local`。Doctor が落ちたらそのインスタンスは運転しない。別プロセスの Next を奪わない。

## Drive

既存ハーネス: Playwright（`e2e/**/*.spec.ts`、`@clerk/testing` の Testing Token）。ワーカーは `e2e/helpers/clerk.ts` の `prepareClerkTestingPage` を先に呼ぶ。認証後は `signInE2eTestUser(page, email)`。`/` は RSC リダイレクトだけで Clerk JS が載らないので、サインインは `/sign-in` へ直接行く。

安定ハンドル（座標やタブ順は使わない）:

| ユーザーが見るもの | ハンドル |
|---|---|
| サインイン画面 | URL `/sign-in`、Clerk ルート `.cl-rootBox, .cl-signIn-root, [data-clerk-component]` |
| 保護ルート誘導 | `/dashboard` → URL が `/sign-in` |
| カンバン見出し | `getByRole("heading", { name: "案件カンバン" })` |
| ヘッダーのホーム | `getByRole("link", { name: "ダッシュボードへ移動" })` |
| 設定 | `getByRole("link", { name: "設定" })` |
| プラン | `getByRole("link", { name: "プラン" })` |
| 要対応（ヘッダー） | `getByRole("link", { name: "要対応" })` |
| 案件登録 | `getByRole("link", { name: "案件登録" })` |
| キャンセル（案件登録） | `getByRole("link", { name: "キャンセル" })`（ボタンではない） |
| 空カンバン | テキスト `案件がまだありません。「案件登録」から追加してください。` |
| カンバン検索 | プレースホルダ `タイトル・エージェント・技術・次アクションで検索` |
| 登録する | `getByRole("button", { name: "登録する" })` |
| 案件タイトル | `getByLabel("案件タイトル *")` |

マップは `features/`。証明の前に `features/README.md` を読み、対象 feature ファイルの全エントリポイントを踏む。便利な入口 1 つだけで終わらせない。

## Evidence

置き場はリポ直下の `verify-artifacts/<run-id>/`（gitignore。クリーンアップで消さない）。Cloud のユーザー向けデモは `/opt/cursor/artifacts/` へコピーしてよい。

証明の中身:

- 未ログイン: Playwright のコマンド、終了コード、sign-in URL、Clerk ルート可視
- 認証後: 最終 URL が `/dashboard`、見出し `案件カンバン`、ヘッダーリンクが見える。初回は `/onboarding` 経由で users 行が作られる
- UI 操作: 操作したハンドルと、操作後の画面状態（スクリーンショット + 見出し/URL）。最終画面だけは不足
- 変異（案件登録・ステータス変更）: カンバンまたは案件詳細を開き直して同じ値が見えること
- サイド効果: DB 行や Gmail API を「呼んだつもり」で終わらない。画面に戻った値か、Playwright の assertion を残す

モックは本番境界（Clerk Testing Token、外部 Gmail が無いときの手動ペースト）だけ。`/api/health` が 200 なことは認証ゲートの証明に使わない。

## Cleanup

このランが起動した `next start` / `pnpm dev` の PID だけを止める。プロセス名での `pkill` はしない。`verify-artifacts/` は残す。共有の `pnpm dev`（3000、自分で起動していないもの）は止めない。隔離 E2E は Playwright `webServer` に終了させる。

## Helpers

```bash
# 起動確認（値を出さず、鍵の有無だけ見る）
VERIFY_BASE_URL=http://localhost:3000 .cursor/skills/verify-gmail-kanban/scripts/doctor.sh

# 未ログインの認証ゲート（隔離。dev 非起動時）
pnpm test:e2e -- e2e/smoke.spec.ts

# 認証後カンバン（E2E ユーザーがあるとき）
pnpm test:e2e -- e2e/auth-smoke.spec.ts
```

`scripts/doctor.sh` は実行ビット付き。`pnpm test:e2e` は `notes/testing-discipline.md` のとおり build を含む。dev 起動中は使わない。
